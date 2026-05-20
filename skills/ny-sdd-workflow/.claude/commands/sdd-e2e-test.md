---
description: 执行 SDD E2E 端到端附加验收（绑定 SDD §4 全部模块归档后；Playwright only）
---

# /sdd-e2e-test

触发 SDD E2E 端到端测试（§4 全部模块归档后的后置验收，也可在 SDD 项目内独立重跑）。

## 前置检查

/sdd-e2e-test 仅支持 **SDD 项目内独立重跑**，不支持脱离 SDD 项目的普通独立运行。

必须满足：
1. 项目根存在 `AGENTS.md`
2. 存在 `.project/context.md`
3. 存在 `.project/specs/master/`

处理：
- `AGENTS.md` / `.project/context.md` / `.project/specs/master/` 缺失 → 判定为非完整 SDD 项目，停止，不生成 E2E 报告。
- `.test/testcases/TC-F-*.md` 缺失 → 记录 `skip_reason=缺少 TC-F 用例来源`，继续执行「产物冲突保护」，随后记录 `SKIP` 留痕，不生成 E2E 报告。
- `.test/.test-env.md` 缺失 → 不记录 `skip_reason`；进入 `e2e-test-runner` 的「E2E 前置环境准备」，自动创建并补全可安全确定的字段。
- `.test/.test-env.md` 中缺少 `e2e.base_url` / `e2e.test_command` / 账号类 `vars.*` → 不猜测；由 `e2e-test-runner` 输出确认提示，等待用户补充、允许新项目 AI 造数，或选择跳过并记录 SKIP 留痕。

## 执行顺序

1. 前置检查
2. 场景适用性判断（先判定本场景是否应做 E2E：bug 修复等不适用场景直接 SKIP，不进入后续）
3. 阶段冲突保护（类 1：是否全部模块已归档）
4. 产物冲突保护（类 2：E2E 产物已存在）
5. 若存在 `skip_reason` → 记录 SKIP 留痕（`ref:` 续行，不写 `last:`/`produced:`），不调用 Runner，不生成 E2E 报告
6. 无 `skip_reason` → 执行 `e2e-test-runner` 的 `.test/.test-env.md` 创建 / 补全 / 配置确认
7. 生成 Playwright 配置与 spec
8. 探测 `e2e.base_url`；未启动时按 `e2e.start_command` 或 AI 自动推断的可信启动命令拉起服务并轮询，无法唯一判断时才询问用户
9. 执行 Playwright 并生成 Markdown + HTML 报告
10. 停止仅由本次 Runner 启动的服务

## 场景适用性

进入路由前必须先判断是否应该做 E2E：

| 场景 | 处理 |
|---|---|
| 新项目 feature | 能做则执行；不能做时告知用户原因并记录 `SKIP` 留痕，不生成 E2E 报告 |
| 旧项目 feature / 新增需求 | 能做且有必要则执行；不能做时告知用户原因并记录 `SKIP` 留痕，不生成 E2E 报告 |
| bug 修复 | 不执行 E2E，输出「Bug 修复场景不进行 E2E」并记录 `SKIP` 留痕，不生成 E2E 报告 |
| refactor / 技术优化 | 先判断是否影响用户主流程 / 页面路由 / 接口契约 / 权限链路 / 跨模块状态流转；有必要且能做才执行，否则告知用户原因并记录 `SKIP` |

独立执行时若无法从 `.project/context.md` / `index.md` / REQ 判断项目/任务场景，输出：

```
【E2E 场景确认】
无法从当前 SDD 状态判断 E2E 场景，请确认：
  A. 新项目 feature
  B. 旧项目新增需求
  C. Bug 修复
  D. 技术优化 / refactor
  E. 取消
```

用户选择后再进入对应场景规则。

技术优化 / refactor 场景必须先输出：

```
【E2E 必要性判断】
- 用户主流程：是/否
- 页面路由：是/否
- 接口契约：是/否
- 权限链路：是/否
- 跨模块状态流转：是/否

结论：{需要 E2E / 无必要做 E2E}
```

五项全否 → 记录 SKIP 留痕，不生成 E2E 报告，原因：无必要做 E2E。任一为是 → 继续判断是否能做 E2E。

Bug 修复场景：
- 不执行 Playwright
- 不调用 `e2e-test-runner`
- 不生成 `.outdocs/e2e-report.md/html` 或 `.test/e2e/report.md/html`
- 只记录 SKIP 留痕
- 原因：Bug 修复场景不进行 E2E

## 流程冲突保护

### 类 1：阶段冲突（是否全部模块已归档）

读取 `.project/context.md` **最后一条含 `last:` 的记录**（纯 `ref:` E2E 续行跳过，规约见 AGENTS.md 第 8 条）。E2E 是**附加验收**，触发铁律：**仅当所有 dev-order 模块全部归档完成（`last: §4 归档` 且无未归档模块）才属于正式 E2E**；其余情况只能独立参考执行。

**情况 1 — `last: §4 归档` 且 index.md 中所有 dev-order 模块均已 `[done]`**：无冲突，直接进入产物冲突保护。E2E 痕迹按 AGENTS.md 第 8 条作为 `ref:` 续行追加到该 `last: §4 归档` 记录之后。

**情况 2 — `last` 不在 §4 归档，或仍有未归档模块，或无法确定是否全部归档**：输出提示（不视为错误）：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§4 全部模块归档后 E2E 测试
冲突点：尚未确认全部模块归档完成。E2E 是附加验收，不能影响/阻塞主流程，
        此时只能作为独立参考执行，不写入任何 context.md 状态。

请选择处理方式：
  A. 独立参考执行（仅生成 E2E 报告；不写 context.md 的 last: / produced: / ref:，不改任何模块归档状态）
  B. 取消
```

用户选 A 后继续产物冲突保护，且**全程不向 context.md 写入任何 `last:` / `produced:` / `ref:`**（独立参考运行，零状态副作用）；用户选 B 则停止。

### 类 2：产出物冲突（E2E 产物已存在）

若 `.test/e2e/`、`.outdocs/e2e-report.md` 或 `.outdocs/e2e-report.html` 已存在，输出：

```
【流程冲突提示 — 产出物冲突】
检测到 E2E 产物已存在：
  - {已存在路径列表}

请选择处理方式：
  A. 备份后重跑（备份为 .bak.{时间戳} 后重新生成）
  B. 覆盖重跑（直接刷新 .test/e2e/ 与 .outdocs/e2e-report.*）
  C. 取消
```

选择 A/B 后再进入下方路由；选择 C 则停止。

## 路由

读取 `{SKILL_DIR}/rules/skill-routing.md`，按 Skill 调用强制约束执行：

1. Read `{SKILL_DIR}/tools/e2e-test-runner/SKILL.md`
2. 输出 Skill 执行日志
3. 按 SKILL.md Step 0~10 执行（含 Step 6.5）

## 默认参数

- `tc_source`: `.test/testcases/TC-F-*.md`
- `runtime_source`: `.test/.test-env.md`
- `framework`: `playwright`
- `output_dir`: `.test/e2e`
- `exec_mode`: `true`

## 产出

仅实际执行 E2E 时生成以下产物；不执行 E2E 时只记录 SKIP 留痕，不生成 E2E 报告。

- `.test/e2e/E2E-PLAN.md`
- `.test/e2e/playwright.config.ts`
- `.test/e2e/results.json`
- `.test/e2e/report.md`
- `.test/e2e/report.html`
- `.outdocs/e2e-report.md`
- `.outdocs/e2e-report.html`
