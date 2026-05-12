---
description: 设计 + 生成 + 执行单元测试（绑定 SDD §3.7.1 自动化单测）
---

# /sdd-unit-test — 单元测试全链路

调用 SDD Workflow 内置的 `unit-test-generator` Skill。SDD 模式下采用**自主设计模式**：从 REQ/DES + 实际源代码直接设计单测用例 + 生成代码 + 执行 + 输出报告。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}`。不存在 → 提示「请先 `/sdd-init`」并退出。
2. **`.test-env.md` 按需生成 + 自动检测**（调用 Skill 前必须完成）：
   - `ls .test-env.md` → 不存在则按 `phase-spec.md §2.7「.test-env.md 按需生成 + 自动检测」`段流程创建（Read 权威模板 + 扫描项目配置 + 填值）
   - 存在则 `grep '# TODO' .test-env.md` 检查 TODO 字段 → 有则按检测表补全
   - vars 类账号字段 AI 无法自动检测时 → 触发 G2 询问用户（详见 §2.7 「用户决策路径」）
3. 读取 `{SKILL_DIR}/rules/skill-routing.md`。
4. **前置清理**（中断恢复机制）：
   - 检查测试目录是否存在 `generated/` 临时子目录 → 存在则删除
   - 检查 `.test/unit/report.md` → 结论 PASS 且 generated/ 已清理 → 视为上次已成功，跳过本次执行直接进入 §3.7.2
5. 读取 `{SKILL_DIR}/tools/unit-test-generator/SKILL.md`，按**自主设计模式**在**当前工作目录**执行。
6. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## SDD 模式参数（自动注入）

| 参数 | 值 | 说明 |
|---|---|---|
| `input` | 当前模块的 REQ + DES + 实际源代码文件 | 来自 `.project/specs/master/` + 实际代码 |
| `frameworks` | 从 `project-profile.md` 技术栈自动推断 | 前端→vitest/jest，后端→junit5/pytest/gotest；全栈一次调用同时生成 |
| `exec_mode` | `true`（SDD 默认开启） | 生成后自动执行 |
| `output_dir` | `.test/unit/` | 与 SDD 标准产出路径一致 |

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致）

读取 `.project/context.md` 的 `last` 字段。若 `last` 不在 §3.5（编码完成后）/ §3.7（开发自测阶段），输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§3.7.1 自动化单测（前置：§3.5 编码完成）
冲突点：{当前模块尚未编码 / last 在更早阶段}

请选择处理方式：
  A. 强制执行（源代码可能不完整，单测可能产生大量失败）
  B. 等编码完成（中断本命令）
  C. 取消
```

### 类 2：产出物冲突（单测产出已存在）

若 `.test/unit/UT-{当前模块}-*.md` 或 `.test/unit/report.md`（结论 PASS）**已存在**，输出：

```
【流程冲突提示 — 产出物冲突】
检测到当前模块单测产出已存在（report.md 结论：{PASS/SKIP/FAIL}）。

请选择处理方式：
  A. 备份后重建（备份现有 UT-* 与 report.md.bak.{时间戳}，重新设计 + 生成 + 执行）
  B. 仅补充未覆盖部分（读取现有 report.md 中"未覆盖清单"，针对性补充用例）
  C. 取消
```

## 执行流程（核心节选）

1. **设计 + 生成**：分析源代码 + REQ/DES → 设计单测用例 → 输出 `UT-{模块}-{功能}.md` + `skeleton/{TC-ID}.{framework}.{ext}`
2. **执行**：将 skeleton/ 复制到项目测试目录的 `generated/` 子目录 → 运行 test runner（带覆盖率参数）
3. **覆盖率检查**：行覆盖率 ≥ 70% 且 分支覆盖率 ≥ 60% 即达标；不达标 → 自动补充用例（最多 2 轮）
4. **清理**：删除 `generated/` 子目录（skeleton/ 原件保留作为归档）
5. **结果写入**：
   - `.test/unit/report.md`（模块级报告）
   - `.outdocs/unit-test-report.md`（追加，全局汇总；**锚点格式固定**：`## {模块编号-模块名} 开发自测报告（YYYY-MM-DD）`，含「### 自动化单测（§3.7.1）」+「### 补充验证（§3.7.2）」两个三级标题 + 末尾「结论」行明确为 PASS / SKIP / FAIL；§3.8 进入时按此锚点回灌）
   - `.project/context.md` 追加一条记录 + `produced: .outdocs/unit-test-report.md#{锚点-slug} {SHA-256 前 8 位}`（gated 章节强制）

## 降级处理（统一出口）

以下任一情况触发降级（report.md 写入结论 `SKIP`）：
- 依赖缺失安装失败
- 环境配置问题（需修复 `.test/.test-env.md` 后重跑）
- §3.5→§3.6→§3.7 自愈循环超 5 次，用户选择跳过单测
- 当前 AI 工具无 Bash 能力（仅生成代码，不执行）
- Skill 文件缺失

降级后单测代码骨架正常保留（`skeleton/`），用户可手动修复后说"重跑单测"或重新运行 `/sdd-unit-test`。

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/unit-test-generator/SKILL.md` 不存在 → **fallback 到 T-01~T-06 全量自测**（来自 `quality-standards.md` 自测标准），执行日志标注 `内置兜底(T-01~T-06)`。

## 产出

```
.test/unit/
├── UT-{模块}-{功能}.md         ← 单测用例文档
├── skeleton/                   ← 单测代码骨架（原件，不删除）
│   ├── *.jest.ts / *.junit.java / ...
│   └── fixtures/*.json
└── report.md                   ← 单元测试执行报告
```

## 参数

`$ARGUMENTS`（可选）：指定模块编号、特定函数或测试框架。留空 → 默认为 `context.md` 当前模块。
