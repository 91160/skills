# Slash Commands 详细路由

> 本文件是 SDD Workflow 14 个 Slash Commands 的**详细路由表 + 流程冲突保护**。AGENTS.md 仅保留 14 个命令名概览，详细路由在此。
>
> AI 按需读取：用户触发 `/sdd-*` 命令或 AI 需要决定如何路由时 Read 本文件。

用户可通过 slash 命令显式触发本工作流的关键流程；命令文件位于 `{SKILL_DIR}/.claude/commands/`，由 `/sdd-init` 安装到用户级（`~/.claude/commands/`）或项目级（`.claude/commands/`）。AI 在用户调用命令时按本表路由：

> **G0.0 豁免规则**：用户首条消息是 slash 命令时，**G0.0 不强制**走 G0 路径，由命令体自有路由机制处理（含前置检查 / 四场景路由 / 二次判定等）；仅对 slash 命令直接触发生效。**自然语言**触发（如"启动工作流"/"做新项目"）仍按 G0.0 强制走 G0 路径。命令体内部进入 §X.Y 时仍受 G0.5 阶段执行约束（输出流程声明头）+ Skill 调用强制约束（5 步走）。

## 流程触发类（4 个）

| 命令 | 绑定流程 | AI 路由动作 |
|---|---|---|
| `/sdd-init` | SKILL.md 安装/更新/状态/卸载 | 读取并执行 `{SKILL_DIR}/SKILL.md`，按 A/B/C/D 四选一执行 |
| `/sdd-start` | G0 对话初始化 | 必读 AGENTS.md + context.md，按 AGENTS.md「`/sdd-start` 触发约束」四场景路由 |
| `/sdd-prd-change` | §2.6 Spec Sync `[prd]` | 读取 `{SKILL_DIR}/rules/phase-spec.md` §2.6，按 Step1~6 完整执行；结束后按倒数第二条 last 返回原阶段 |
| `/sdd-bug-fix` | G0.4.1 当前需求 bug 二次判定 → §3.0 bug 修复回环 | 按 G0.4.1 二次判定表分流；判定为当前需求 bug → §3.0 通道判断；不归属或不确定 → G2 停车三选一 |

## 工具触发类（10 个，按统一 Skill 执行流程）

| 命令 | 对应 Skill | 绑定阶段 | 执行流程 |
|---|---|---|---|
| `/sdd-prd-audit` | `tools/prd-audit/` | §1.1 / §1.2(feature) / §2.6[prd] | 读 skill-routing.md → 读 SKILL.md → 执行 → 输出 Skill 执行日志 |
| `/sdd-front-context` | `tools/front-project-context/` | §1.3 前端规范提取 | 同上；产出 `mv` 到 `.project/specs/rules/frontend-context.md` |
| `/sdd-back-context` | `tools/back-project-context/` | §1.3 后端规范提取 | 同上；产出 `mv` 到 `.project/specs/rules/backend-context.md` |
| `/sdd-frontend-standards` | `tools/frontend-code-standards/` | §3.5 前端代码变更 | 同上；融合优先级见 §3.5 |
| `/sdd-java-create` | `tools/java-project-creator/` | §1.1 后端项目初始化 | 同上；可独立执行（SDD 未初始化时） |
| `/sdd-wap-create` | `tools/wap-project-creator/` | §1.1 前端项目初始化 | 同上；可独立执行 |
| `/sdd-reverse-scan` | `tools/reverse-scan/` | §1.4 深度业务代码扫描 | 同上；产出在 `.project/reverse-scan/`；AI 执行合并到 profile/overview/api-doc/context |
| `/sdd-test-case` | `tools/test-case-design/` | §2.7 功能测试用例设计 | 同上；自动注入 SDD 模式参数（task_type/output_dir/csv_template） |
| `/sdd-unit-test` | `tools/unit-test-generator/` | §3.7.1 自动化单测 | 同上；自主设计模式；自动注入 frameworks/exec_mode；前置清理 generated/ 残留 |
| `/sdd-e2e-test` | `tools/e2e-test-runner/` | §4 全部模块归档后 E2E 测试 | 同上；Playwright only；产出 `.outdocs/e2e-report.md` + `.outdocs/e2e-report.html` |

## 流程冲突保护（仅适用 10 个工具触发类命令）

> **流程触发类（4 个）各自有自有机制，不复用本模板：**
> - `/sdd-init`：基础设施操作，不绑定阶段，无冲突场景
> - `/sdd-start`：四场景路由（A 未装 / B 首次 / C 进行中 / D 异常，详见 AGENTS.md「`/sdd-start` 触发约束」）
> - `/sdd-prd-change`：前置检查（无 AGENTS.md/无 context.md → 退出） + 严格按 §2.6 流程
> - `/sdd-bug-fix`：前置检查 + G0.4.1 二次判定 + G2 停车三选一（A 走回环 / B 走新 bug 工单 / C 取消）

下述两类冲突保护仅适用工具触发类命令（`/sdd-prd-audit` / `/sdd-front-context` / `/sdd-back-context` / `/sdd-frontend-standards` / `/sdd-java-create` / `/sdd-wap-create` / `/sdd-reverse-scan` / `/sdd-test-case` / `/sdd-unit-test` / `/sdd-e2e-test`）。

实际有**两类**冲突场景，AI 按场景使用对应模板：

### 类 1：阶段冲突（last 字段与命令绑定阶段不一致）

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：{绑定阶段}
冲突点：{具体冲突，如"已在 §3 编码阶段，重审 PRD 可能涉及级联变更"}

请选择处理方式：
  A. 独立执行（不更新 context.md / index.md / 不触发级联）
  B. 作为工作流的一部分执行（按命令体内的"动态路由表"决定走哪个 §X.Y 流程）
  C. 取消
```

> B 选项的具体路由由命令体定义。例如 `/sdd-prd-audit` 选 B：last 在 §1 → 走 §1 PRD 审计；last 在 §2~§4 → 走 §2.6 Spec Sync。

### 类 2：产出物冲突（产出文件已存在 / 状态前置不满足）

```
【流程冲突提示 — 产出物冲突】
检测到：{具体场景，如 "frontend-context.md 已存在" / "TC-F 文档已存在" / "REQ 不是 approved"}

请选择处理方式：
  A. {处理方式 1，如"备份后重建" / "强制执行"}
  B. {处理方式 2，如"独立产出（{时间戳}.md）" / "增量更新"}
  C. 取消
```

> 类 2 的具体三选项由各命令体定义（如 sdd-front-context、sdd-back-context、sdd-test-case），与类 1 不同——类 1 关注"何时执行"，类 2 关注"如何处理已有产出"。

> 详细的命令体（产出位置、参数、兜底）见各命令文件 `{SKILL_DIR}/.claude/commands/sdd-*.md`。
