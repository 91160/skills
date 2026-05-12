---
description: 为已通过评审的需求生成功能测试用例集（绑定 SDD §2.7 功能测试用例设计）
---

# /sdd-test-case — 功能测试用例设计

调用 SDD Workflow 内置的 `test-case-design` Skill，以测试工程师视角，为已通过评审的需求/设计生成功能测试用例集（含 6 种经典测试设计方法论）。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}`。不存在 → 提示「请先 `/sdd-init` 并完成 §2.5 评审」并退出。
2. **`.test-env.md` 按需生成 + 自动检测**（调用 Skill 前必须完成）：
   - `ls .test-env.md` → 不存在则按 `phase-spec.md §2.7「.test-env.md 按需生成 + 自动检测」`段流程创建（Read 权威模板 + 扫描项目配置 + 填值）
   - 存在则 `grep '# TODO' .test-env.md` 检查 TODO 字段 → 有则按检测表补全
   - vars 类账号字段 AI 无法自动检测时 → 触发 G2 询问用户（详见 §2.7 「用户决策路径」）
3. 读取 `{SKILL_DIR}/rules/skill-routing.md`。
4. 读取 `{SKILL_DIR}/tools/test-case-design/SKILL.md`，按其规范在**当前工作目录**执行。
5. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## SDD 模式参数（自动注入）

调用 Skill 时按工作流约定传入：

| 参数 | 值 | 说明 |
|---|---|---|
| `task_type` | 从 G0.1 类型映射读取（feature / bug / refactor） | 由 `.project/context.md` + `index.md` 推断 |
| `output_dir` | `.test/testcases/` | 与 SDD 标准产出路径一致 |
| `csv_template` | `both` | 同时输出 detailed + traditional |

> 不传 `channels_filter`——Skill 内部自动判断（纯后端项目不产出 UI 用例）。

## 输入

- 当前模块的 REQ（`review-status: approved`）+ DES（`review-status: approved`）
- PRD 内容（通过 `project-profile.md`「PRD 内容索引」定位）

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致 / REQ-DES 未 approved）

读取 `.project/context.md` 的 `last` 字段。若 `last` 不在 §2.7（评审通过后）或当前模块 REQ/DES 不是 `approved`，输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§2.7 功能测试用例设计（前置：§2.5 评审通过）
冲突点：{当前模块 REQ/DES review-status: {状态} / last 不在 §2.7}

请选择处理方式：
  A. 强制执行（基于 draft REQ/DES 设计 TC，结果可能在评审后重做）
  B. 先去 §2.5 评审（中断本命令，提示用户完成评审后再执行）
  C. 取消
```

### 类 2：产出物冲突（TC-F 文档已存在）

若 `.test/testcases/TC-F-{当前模块}-*.md` **已存在**，输出：

```
【流程冲突提示 — 产出物冲突】
检测到当前模块 TC-F 文档已存在。

请选择处理方式：
  A. 备份后重建（备份现有为 TC-F-*.md.bak.{时间戳}，重新设计全量 TC）
  B. 增量更新（仅 §2.6 PRD 变更场景使用，比对变更前后 REQ/DES，仅更新涉及的 TC 条目）
  C. 取消
```

## 产出

```
.test/testcases/
├── TC-F-{模块}-{功能}.md            ← 功能测试用例文档（按模块分文件）
├── testcases.detailed.csv            ← CSV 详细版（全局汇总，所有模块追加）
└── testcases.traditional.csv         ← CSV 传统版（全局汇总，所有模块追加）
```

## 用途

- QA 手工执行功能测试
- 导入禅道/飞书测试管理平台
- 未来 E2E Skill 的输入
- §3.1 编码时加载参考（TDD 思路）
- §3.6 代码审计 S-08 功能完整性检查

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/test-case-design/SKILL.md` 不存在 → **跳过并提示用户后续补充**，不触发 G2 停车（功能测试用例非编码阻断项），执行日志标注 `Skill 缺失，跳过`。

## 参数

`$ARGUMENTS`（可选）：指定模块编号或名称。留空 → 默认为 `context.md` 当前模块。
