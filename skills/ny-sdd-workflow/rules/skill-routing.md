# Skill 路由表与执行流程

## Skill 调用强制约束（与 G1 同级硬约束，最高优先级）

每次需要调用 Skill 时，AI **必须**按以下 5 步执行，**任何一步缺失即视为未调用**（必须重做）：

1. **Read SKILL.md 全文**（用 Read 工具，对话中必须可见此调用）
   ```
   Read({SKILL_DIR}/tools/{skill名称}/SKILL.md)
   ```

2. **输出标准 Skill 执行日志**（4 字段不可省）：
   ```
   【Skill 执行日志】
     阶段: §X.Y {章节名}
     Skill: {skill名称}
     路径: {SKILL_DIR}/tools/{skill名称}/
     执行: 调用Skill / 内置兜底({兜底文件})
   ```

3. **按 SKILL.md 中的 Step 1~N 顺序逐步执行**（不得跳步、不得合并）

4. **每个 Step 完成后输出执行小结**（让用户看到进度，可简短）

5. **最终产出物路径必须与 SKILL.md 定义一致**（不得自己起名）

**违反检测**（用户和审计可校验）：
- 输出审计/扫描报告但**没有** Skill 执行日志 → 视为伪调用，**必须重做**
- 工具调用记录里**没有** Read SKILL.md 路径 → 同上
- 产出物路径/格式与 SKILL.md 模板**不符** → 同上

**Skill 文件缺失才允许走兜底**：
- `Read` 返回错误 / 文件不存在 → 此时按下方"匹配规则"中定义的兜底执行
- 走兜底时执行日志的"执行"字段必须填 `内置兜底({具体兜底文件})`，**必须明示**
- ❌ "AI 觉得需求简单"**不是** Skill 缺失，禁止用此理由跳过 Read
- ❌ "AI 凭通用知识也能做"**不是** Skill 缺失，禁止跳过 Read

**Slash 命令场景**：
- 工具触发类命令（9 个）的命令体已要求 Read SKILL.md + 输出执行日志，**与本约束完全一致**
- 「A 独立执行」与「B 工作流内」选项都必须走完整 5 步（Skill 必须正确调用，仅范围不同）

---

## Skill 路由表

所有 Skill 已内置在 `{SKILL_DIR}/tools/` 目录下，AI 在对应阶段直接读取调用，无需远程安装。

| 阶段           | 触发时机                              | Skill 路由             | 内置目录              |
| -------------- | ------------------------------------- | ---------------------- | --------------------- |
| PRD 审计       | §1.1 / §1.2(feature) / §2.6[prd]   | /prd-audit             | `tools/prd-audit/`    |
| 后端项目初始化 | §1.1 脚手架创建（仅新项目）          | /java-project-creator  | `tools/java-project-creator/` |
| 前端项目初始化 | §1.1 脚手架创建（仅新项目）          | /wap-project-creator   | `tools/wap-project-creator/`  |
| 前端规范提取   | §1.3 前后端规范提取                  | /front-project-context | `tools/front-project-context/` |
| 后端规范提取   | §1.3 前后端规范提取                  | /back-project-context  | `tools/back-project-context/` |
| 前端编码       | §3.5 代码变更（前端改动）            | /frontend-coding       | `tools/frontend-code-standards/` |
| 后端编码       | §3.5 代码变更（后端改动）            | — | 内置兜底（C-01~C-10） |
| 代码审计       | §3.6 代码审计                        | — | 内置兜底（S-01~S-07 + S-08） |
| 深度代码扫描   | §1.4 深度业务代码扫描                | /reverse-scan          | `tools/reverse-scan/` |
| 功能测试用例设计 | §2.7 评审通过后（feature/bug/refactor）| /test-case-design      | `tools/test-case-design/` |
| 单元测试       | §3.7 编码后自测                      | /unit-test-generator   | `tools/unit-test-generator/` |
| E2E 测试       | §4 全部模块归档后（用户确认执行）     | [e2e-test-skill]       | [未发布]              |

**Skill 执行流程**（所有触发点必须统一严格遵守，不可跳过）：

```
1. 读取 {SKILL_DIR}/tools/{skill名称}/SKILL.md
   → 文件存在 → 进入第 2 步（调用）
   → 文件不存在 → 内置 Skill 缺失，使用兜底规则
2. 调用：读取 SKILL.md 内容，按其规范执行
3. 输出执行日志（必须，未输出视为未执行）
4. 更新状态（§3 编码阶段的 Skill）：更新 index.md 对应模块的 `coding-skill` 或 `audit-skill`
```

**Skill 执行日志格式**（每次执行 Skill 流程后必须输出，禁止省略）：

```
【Skill 执行日志】
  阶段: {触发阶段，如 §1.1 PRD审计 / §3.5 前端编码}
  Skill: {skill名称}
  路径: {SKILL_DIR}/tools/{skill名称}/
  执行: {调用Skill / 内置兜底({兜底方式})}
```

**匹配规则**：

- 根据 project-profile.md「技术栈」声明 + 当前改动文件类型，匹配对应 Skill
- 内置 Skill 文件缺失 → 使用内置兜底规则
- **项目初始化（仅新项目 §1.1）**：技术栈含 Java → java-project-creator；技术栈含前端 → wap-project-creator；旧项目（§1.2）已有代码结构，不触发
- **深度代码扫描**：§1.2 旧项目初始化，§1.3 前后端规范提取完成后调用 /reverse-scan（§1.4）。成功 → 从扫描产出中提取业务架构/流程，跳过浅层推断；失败 → 兜底执行现有的浅层"业务架构与流程提取"
- **编码阶段**：
  - 有 context 文件（旧项目）→ 以 context 文件为编码规范，**跳过** /frontend-coding
  - 无 context 文件（新项目）→ 前端调用 /frontend-coding；后端无内置编码 Skill，使用 C-01~C-10 内置规约
- **代码审计**：无内置审计 Skill，使用 `{SKILL_DIR}/rules/quality-standards.md` 中 S-01~S-08 标准
- **功能测试用例设计**：§2.7 评审通过后调用 /test-case-design。Skill 只产出功能测试层（manual/ui-dom/ui-visual），产出到 `.test/testcases/`。Skill 文件缺失 → 跳过（功能测试用例非编码阻断项，可后续补充）
- **单元测试**：§3.7 编码后调用 /unit-test-generator（`{SKILL_DIR}/tools/unit-test-generator/`，自主设计模式）。从 REQ/DES + 源代码 → 设计单测用例 + 生成代码 + 执行 + 报告。SDD 模式下自动从 project-profile.md 推断框架。产出到 `.test/unit/`。Skill 文件缺失 → fallback 到 T-01~T-06 自测
- **E2E 测试**：§4 全部模块归档后，询问用户是否执行。未来 /e2e-test-skill 消费 §2.7 产出的功能测试用例（TC-F-*.md），生成 Playwright/Cypress 代码并执行。Skill 未发布时选项 A 自动跳过

**融合规则**：

- **有 context 文件时**（旧项目）：

  1. project-profile.md（铁律）
  2. context 文件（frontend-context.md / backend-context.md）
  3. 内置规约（C-01~C-10 / U-01~U-06 / S-01~S-08）
  4. 冲突项 → 铁律 > context > 内置
- **无 context 文件时**（新项目）：

  1. project-profile.md（铁律）
  2. Skill 编码规范（/frontend-coding）；后端无 Skill，直接用内置规约
  3. 内置规约（C-01~C-10 / U-01~U-06 / S-01~S-08）
  4. 冲突项 → 铁律 > Skill > 内置

---

## Slash Commands 入口表（Skill 视角）

用户可通过 slash 命令显式触发本工作流的关键流程；命令文件位于 `{SKILL_DIR}/.claude/commands/`，由 `/sdd-init` 安装到用户级（`~/.claude/commands/`）或项目级（`.claude/commands/`）。AI 在用户调用命令时按本表路由，路由动作仍走本文件「Skill 执行流程」与「匹配规则」。

> **命令路由视角的完整规则 + 流程冲突保护**：详见 `{SKILL_DIR}/rules/slash-commands.md`（含 4 流程触发 + 9 工具触发详细路由、阶段冲突 / 产出物冲突两类模板）。本表侧重 **Skill 角度**（含兜底链路）；slash-commands.md 侧重 **命令路由 + 冲突保护**——两表互补。

### 流程触发类（4 个）

| 命令 | 绑定流程 | AI 路由动作 |
| ---- | -------- | ---------- |
| `/sdd-init` | SKILL.md 安装/更新/状态/卸载 | 读取并执行 `{SKILL_DIR}/SKILL.md`，按 A/B/C/D 四选一 |
| `/sdd-start` | G0 对话初始化 | 必读 AGENTS.md + context.md，按 AGENTS.md「`/sdd-start` 触发约束」四场景路由（A 未装 / B 首次 / C 进行中 / D 异常） |
| `/sdd-prd-change` | §2.6 Spec Sync `[prd]` | 读取 `{SKILL_DIR}/rules/phase-spec.md` §2.6，按 Step1~6 完整执行；结束后按倒数第二条 last 返回原阶段 |
| `/sdd-bug-fix` | G0.4.1 当前需求 bug 二次判定 → §3.0 bug 修复回环 | 按 G0.4.1 二次判定表分流；判定为当前需求 bug → §3.0 通道判断；不归属或不确定 → G2 停车三选一 |

### 工具触发类（9 个，按本文件 Skill 执行流程）

| 命令 | 对应 Skill | 绑定阶段 | 关键约束 |
| ---- | ---------- | -------- | -------- |
| `/sdd-prd-audit` | `tools/prd-audit/` | §1.1 / §1.2(feature) / §2.6[prd] | 兜底 → quality-standards.md 中 PRD 审计标准 |
| `/sdd-front-context` | `tools/front-project-context/` | §1.3 前端规范提取 | 产出 `mv` 到 `.project/specs/rules/frontend-context.md`；兜底 → `rules/fallback/frontend-scan.md` |
| `/sdd-back-context` | `tools/back-project-context/` | §1.3 后端规范提取 | 产出 `mv` 到 `.project/specs/rules/backend-context.md`；兜底 → `rules/fallback/backend-scan.md` |
| `/sdd-frontend-standards` | `tools/frontend-code-standards/` | §3.5 前端代码变更 | 融合优先级见 §3.5；兜底 → C-01~C-10 + U-01~U-06 |
| `/sdd-java-create` | `tools/java-project-creator/` | §1.1 后端项目初始化 | 可独立执行；兜底 → Spring Boot 官方 CLI |
| `/sdd-wap-create` | `tools/wap-project-creator/` | §1.1 前端项目初始化 | 可独立执行；兜底 → Vue 官方 CLI |
| `/sdd-reverse-scan` | `tools/reverse-scan/` | §1.4 深度业务代码扫描 | 产出 `.project/reverse-scan/`；AI 执行合并到 profile/overview/api-doc/context；兜底 → 浅层业务架构推断 |
| `/sdd-test-case` | `tools/test-case-design/` | §2.7 功能测试用例设计 | 自动注入 SDD 模式参数（task_type/output_dir/csv_template）；产出 `.test/testcases/`；缺失时跳过（非编码阻断项） |
| `/sdd-unit-test` | `tools/unit-test-generator/` | §3.7.1 自动化单测 | 自主设计模式；自动注入 frameworks/exec_mode；前置清理 generated/ 残留；产出 `.test/unit/`；兜底 → T-01~T-06 |

### 流程冲突保护（仅适用 9 个工具触发类命令，与 AGENTS.md 一致）

> **流程触发类（4 个）各自有自有机制，不复用本模板：**
> - `/sdd-init`：基础设施操作，不绑定阶段，无冲突场景
> - `/sdd-start`：四场景路由（A 未装 / B 首次 / C 进行中 / D 异常，详见 AGENTS.md G0 章节顶部约束）
> - `/sdd-prd-change`：前置检查 + 严格按 §2.6 流程
> - `/sdd-bug-fix`：前置检查 + G0.4.1 二次判定 + G2 停车三选一

下述两类冲突保护仅适用工具触发类（`/sdd-prd-audit` / `/sdd-front-context` / `/sdd-back-context` / `/sdd-frontend-standards` / `/sdd-java-create` / `/sdd-wap-create` / `/sdd-reverse-scan` / `/sdd-test-case` / `/sdd-unit-test`）。实际有**两类**冲突场景：

| 冲突类型 | 触发条件 | 三选一模板 |
|---|---|---|
| **类 1：阶段冲突** | 当前 `last` 字段与命令绑定阶段不一致 | A. 独立执行 / **B. 作为工作流的一部分执行**（按命令体的动态路由表决定走哪个 §X.Y）/ C. 取消 |
| **类 2：产出物冲突** | 产出文件已存在 / 状态前置不满足（如 REQ 未 approved） | A. 备份后重建（或强制执行）/ B. 独立产出（或增量更新）/ C. 取消 |

> 类 1 关注"何时执行"；类 2 关注"如何处理已有产出"。具体三选一文案由各命令体定义。详细的命令体（产出位置、参数、兜底）见各命令文件 `{SKILL_DIR}/.claude/commands/sdd-*.md`。
