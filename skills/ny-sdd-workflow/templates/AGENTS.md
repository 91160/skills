---
inclusion: always
description: "SDD 开发工作流 v1.0.2 — G 系列全局规则始终加载，§1~§4 阶段规则按需读取，流程声明头机械跳转，13 个 Slash Commands 显式入口"
---
# SDD Workflow — AI 执行规则 v1.0.2

> **最高指令**：严禁在未确认变更通道的情况下直接编写或修改生产代码。每次回复优先使用中文。
>
> **防误触**（本文件被加载意味着 AGENTS.md 已存在）：
> - 用户说"安装 SDD"、"安装工作流"、"安装 AGENTS"或运行 `/sdd-init` → 走 SKILL.md 基础设施安装流程（更新/状态/卸载等场景）。
> - 用户说"启动工作流"、"开始开发"或运行 `/sdd-start` → 走本文件 G0 对话初始化流程（首次/后续路径）。
> - **禁止执行 Claude Code 内置的 `/init` 命令**（/init 是生成 CLAUDE.md 的命令，与本工作流无关）。
>
> （AGENTS.md 不存在的场景由 SKILL.md 顶部触发条件接管，本文件不消费）

---

## 编号与流程声明规约（v1.0.2）

本工作流使用两套编号体系，AI 读取时必须严格区分：

| 前缀 | 含义 | 位置 | 加载时机 |
| --- | --- | --- | --- |
| **G0~G3** | 全局规则（Global）— 对话初始化 + 三大机制 | AGENTS.md（本文件） | 始终加载 |
| **§1~§4** | 阶段流程（Stage）— 项目启动/需求设计/编码/归档 | `{SKILL_DIR}/rules/phase-*.md` | 按需加载 |

**流程声明头**：`{SKILL_DIR}/rules/phase-*.md` 中的每个 §N.N 章节顶部必须有一段「流程声明」引用块，字段固定顺序为 `phase / step / prev / next / gate / blocking`，格式示例：

````markdown
## §3.5 代码变更

> **流程声明**
> - phase: coding
> - step: 5/11
> - prev: §3.4 影响面评估
> - next: §3.6 代码审计
> - gate: G1 写码门禁
> - blocking: true

...正文...
````

**AI 执行约束**：

1. 所有章节使用 `§N.N` 两级编号（§3.1 内部允许三级 §3.1.N），禁止半整数
2. **进入任何 §N.N 章节前，必须先读取该章节顶部的流程声明引用块**（按 `prev` / `next` / `gate` 字段执行跳转与门禁检查），**并在执行该章节正文动作前输出该声明头作为可见凭证**（详见下方 G0.5 阶段执行约束）
3. 正文与声明头冲突时，以正文为准；同时修复声明头
4. G 系列章节（G0~G3）常驻 AGENTS.md，不使用声明头；阶段章节（§1~§4）必须带声明头
5. 字段取值规范：`phase ∈ {init, spec, coding, archive}`；空值统一用 `none`；next 多分支用 `/` 分隔，条件写括号内
6. 其他 AI 工具（Cursor/Copilot 等）只读 AGENTS.md，不消费流程声明；动态加载 + 声明头机制仅 Claude Code / Codex 启用
7. **context.md 状态标记规约**：AI 在关键节点追加 `.project/context.md` 记录时，**每条记录必须在末尾标注 `last: §N.N {章节名}`**（或 `last: G0.N` 如果处于全局初始化阶段），用于下次对话 G0.4 状态恢复时精确定位当前所处章节。关键节点包括：§2.1 任务拆分完成 / §2.2 REQ 完成 / §2.3 DES 完成 / §2.4 原型规格完成 / §2.5 评审通过 / §2.6 Spec Sync 完成 / §2.7 功能测试用例设计完成 / §3.0 直通通道完成 / §3.11 写入 context.md / §4 归档完成。G0.4 状态恢复时，AI 读取 context.md **最后一条记录的 `last` 字段**即可反查阶段文件，无需推理

---

## G0.0 用户输入预处理（强制 / 最高优先级）

**每次对话开始时**（在执行 G0 任何步骤之前），AI 必须先做：

1. **暂存用户首条消息**为「待处理输入」，不立即执行
2. **完整跑完 G0 路径**：
   - 首次：G0.1 → G0.2 → G0.3 → G0.5
   - 后续：G0.4 → G0.4.1 → G0.5
3. **G0 完成后**才处理「待处理输入」

**禁止行为**（违反触发 G2 停车信号）：
- ❌ G0 未完成时调用任何 Skill（含 prd-audit / java-project-creator 等所有 tools/）
- ❌ G0 未完成时创建/修改任何文件（**G0.2 目录骨架除外**）
- ❌ 跳过 G0.1 项目类型确认（即便用户首条消息含"新项目""做 XXX"等明显信号）

**多轮交互处理规则**（用户在 G0.X 期间发新消息时）：

- 新消息**是 G0.X 询问的答复**（如 A/B/C/D / "新项目" / "放好了" 等）→ 当作答复处理，继续推进 G0
- 新消息**含新需求/指令**（如 "改成 XXX 需求" / "加个功能"）→ 追加到「待处理输入」，G0 完成后一并处理
- 新消息**与 G0 询问无关**（如 "现在几点" / 闲聊）→ 暂不响应，提示 "请先完成项目类型确认 / 文档补充" 后继续

> **Slash 命令豁免**：当用户首条消息是 slash 命令（`/sdd-init` / `/sdd-start` / `/sdd-prd-change` / `/sdd-bug-fix` / `/sdd-prd-audit` / `/sdd-front-context` / `/sdd-back-context` / `/sdd-frontend-standards` / `/sdd-java-create` / `/sdd-wap-create` / `/sdd-reverse-scan` / `/sdd-test-case` / `/sdd-unit-test` 任意一个）时：
> - **G0.0 不强制**走 G0 路径，由命令体自己负责前置检查和阶段路由
> - 命令体内部仍受 G0.5 阶段执行约束 + Skill 调用强制约束（见下方）
> - 此豁免**仅对 slash 命令直接触发**生效；用户用自然语言（"启动工作流"等）触发 G0 时不豁免

---

## G0 对话初始化

**每次对话开始时**（先经过 G0.0 预处理后），AI 先检查 `.project/context.md` 是否存在且有内容：

- **不存在 或 无有效记录**（首次对话 / 项目启动未完成）→ 走**首次路径**：G0.1 → G0.2 → G0.3 → G0.5
- **存在且包含至少 1 条状态记录（含 `last` 字段）**（后续对话）→ 走**后续路径**：G0.4 → G0.4.1（推断，非阻塞）→ G0.5

> **`/sdd-start` 触发约束（强制）**：用户运行 `/sdd-start` 时，AI **必须重新读取 `AGENTS.md` 与 `.project/context.md`**，不得凭记忆跳过。读取后按以下四场景路由：
>
> | 场景 | 检测 | 处理 |
> |---|---|---|
> | A. 未装工作流 | 项目根目录无 `AGENTS.md` | 提示「请先 `/sdd-init`」并退出 |
> | B. 首次开发 | `AGENTS.md` 存在，`context.md` 不存在或无有效记录 | 走 G0 首次路径 |
> | C. 已在开发中 | `context.md` 已有 `last` 字段 | 输出当前进度，三选一：A 继续上次（G0 后续路径）/ B 重新开始（**强制全量备份**到 `.sdd-bak.{YYYYMMDDHHmm}/`，含 `.project/` + `.test/` + `.outdocs/`，并询问 `AGENTS.md` 是否一并备份重置后走首次路径）/ C 取消 |
> | D. 异常状态 | 有 `.project/` 但无 `context.md` | 保守询问：A 走首次路径 / B 取消（不自动反推 specs 状态） |
>
> 即便 AI 因上下文丢失"忘了"流程，也必须按本约束重新执行；这是 `/sdd-start` 的最高优先级路由。详细备份步骤见 `{SKILL_DIR}/.claude/commands/sdd-start.md`。

---

### 首次路径（G0.1 → G0.2 → G0.3 → G0.5）

> 仅在 `.project/context.md` 不存在或为空时执行。后续对话跳过本段。

**G0.1 项目类型确认**：

AI 根据「待处理输入」是否含项目特征，分两种模式输出：

**模式 A：「待处理输入」含项目特征**（如 "做新项目 XXX" / "砍价模拟器" / "搭建 Vue3 项目" 等明显项目意图）

```
【项目确认】
基于你刚才的描述，我推断这是「A 新项目」。
请确认或修正：
  A. 新项目（请提供 PRD）  ← AI 推断
  B. 旧项目 — 新增需求
  C. 旧项目 — Bug 修复
  D. 旧项目 — 技术优化

（你的需求描述将作为"对话粘贴的 PRD"在 §1.1 处理，不必重复）
```

**模式 B：「待处理输入」不含项目特征**（如纯 "启动工作流" / "开始" / "你好" 等）

```
【项目确认】
请问这是新项目还是旧项目？
  A. 新项目（请提供 PRD）
  B. 旧项目 — 新增需求
  C. 旧项目 — Bug 修复
  D. 旧项目 — 技术优化
```

用户回复确认后，AI 才进入 G0.2。

> **判别规则**：「项目特征」指消息中含具体项目类型（如 Vue/Java）、产品名（"砍价模拟器"等）、功能描述（"做个 XXX 系统"）、明确角色（"新项目"/"旧项目"）。模糊不清时按模式 B 处理。

**G0.2 目录骨架初始化**（已存在则跳过）：

```
.docs/prd/                                 ← PRD 文字需求（md/pdf）
.docs/prd/prototype/                       ← 原型图（线框图 png/jpg/pdf）
.docs/prd/ui/                              ← UI 设计稿（高保真 png/jpg/pdf）
.docs/prd/ui-spec/                         ← UI 解析文件（Figma/蓝湖导出 md）
.docs/tech/                                ← 技术文档（API/建表/中间件）
.project/specs/master/requirements/
.project/specs/master/design/
.project/specs/master/prototypes/          ← §2.4 原型产出（HTML + prototype-spec.md）
.project/specs/rules/
.project/changelog/
.test/                                    ← 测试产出根目录（独立于 .project）
.test/testcases/                          ← §2.7 功能测试用例
.test/unit/                               ← §3.7 单元测试
.outdocs/
.agents/skills/
```

**项目根 `.test-env.md` 模板生成**（已存在则跳过）：

G0.2 在**项目根目录**（不是 `.test/` 子目录）生成 `.test-env.md` 文件，供 test-case-design Skill（§2.7）和 unit-test-generator Skill（§3.7.1）读取运行时配置使用。

> **重要**：`.test-env.md` 必须放在**项目根目录**，与 Skill 的默认查找路径一致（详见 `{SKILL_DIR}/tools/test-case-design/references/test-env-template.md`，该文件是模板和字段的**唯一权威来源**）。

**生成步骤**（AI 必须按此执行）：

1. **Read 权威模板**：`{SKILL_DIR}/tools/test-case-design/references/test-env-template.md`
2. **取出其中"## 一、完整模板"段内 ` ```` ```markdown ... ```` ` 代码块的内容**（约 33 行，含服务端点 / 测试数据库 / 测试运行命令 / **MCP 能力声明** / 单测目录约定 / 全局变量 6 大段，不得简化）
3. **按下方"自动检测填充约束"主动检测项目实际配置**，用真实值替换模板默认值
4. 写入项目根 `.test-env.md`

**自动检测填充约束（强制）**：AI **不得直接套用模板默认值**，必须按下表逐一用 Read/Bash/Glob 工具检测项目实际配置后再写入。检测不到的字段保留权威模板的占位值并在该行末标注 `  # TODO 用户填写`（注释前两个空格）：

| 字段类别 | 必须检测的来源 | 示例 |
|---|---|---|
| `test_db.type` / `test_db.dsn` | `application.yml` / `application.properties` / `.env` / `.env.example` / `docker-compose.yml`；后端 `package.json` 的依赖（pg / mysql2 / better-sqlite3 等） | MySQL / PostgreSQL / SQLite |
| `test_commands.frontend` | 前端 `package.json` 的 `scripts.test`（如有 `pnpm-lock.yaml` 用 `pnpm test`、`yarn.lock` 用 `yarn test`、否则 `npm test`） | `npm test` / `pnpm test` / `yarn test` |
| `test_commands.backend` | 后端构建文件：`pom.xml` → `mvn test` / `build.gradle` → `gradle test` / `go.mod` → `go test ./...` / `pyproject.toml` 或 `setup.py` → `pytest` 或 `python -m pytest` | `mvn test` / `gradle test` / `go test` |
| `test_dirs.frontend_unit` | 实际扫描（`Glob src/**/__tests__` / `**/*.test.{ts,js}` / `**/*.spec.{ts,js}`），取最常见的目录 | `src/__tests__` / `tests/` |
| `test_dirs.backend_unit` | 实际扫描（Java：`src/test/java`；Go：与源码同目录的 `*_test.go`；Python：`tests/`） | `src/test/java` / `tests/` |
| `base_url.local` | 后端启动配置（`application.yml` 的 `server.port` / `package.json` 的 `start` 脚本端口）；`.docs/tech/` 中的 API 文档 | `http://localhost:8080` / `:3000` |
| `MCP 能力声明` | 当前 AI 工具能力（Claude Code 通常有 `shell`；`http-client` / `sql-runner` / `playwright` 取决于是否装了对应 MCP；不确定时仅列 `shell`） | 列出实际可用的能力 |
| `vars.*` | 保留权威模板的示例值，**全部标注 `# TODO 改为项目实际测试账号`**（账号密码不应由 AI 推测） | — |

**违反检测**：
- 如果 AI 写入的 `.test-env.md` 字段值与权威模板默认值**完全相同**（如 `mysql://test:test@localhost:3306/app_test`）但**未在该行末标注 `# TODO`** → 视为未检测，**必须重做**
- 如果某字段未做实际检测就填值（如未 Read package.json 就写 `npm test`）→ 同上

> **修改不阻断流程**：用户不改 `# TODO` 字段也能继续。test-case-design / unit-test-generator 会自动降级（manual / in-memory 模式）。

**G0.3 文档补充确认**（已存在则跳过）：

检查 `.docs/prd/` 和 `.docs/tech/` 是否为空：
- 均为空 → 必须暂停，询问用户：

```
【文档补充】
目录已创建，请将已有文档放入对应子目录后告诉我：

  · .docs/prd/             — PRD 文字需求（md/pdf）
  · .docs/prd/prototype/   — 原型图（线框图，png/jpg/pdf）
  · .docs/prd/ui/          — UI 设计稿（高保真视觉，png/jpg/pdf）
  · .docs/prd/ui-spec/     — UI 解析文件（Figma/蓝湖导出的 md）
  · .docs/tech/            — 技术文档（API 文档/建表脚本/中间件配置等）

不确定归类的文件可直接放 .docs/prd/ 根目录，AI 会自动识别。

  · 项目根 .test-env.md — 测试环境配置（G0.2 已按项目实际检测自动填充，标 # TODO 的字段请按实际环境修改；
    不修改也不阻断，test-case-design / unit-test-generator 会自动降级为 manual / in-memory 模式）

放好后回复"放好了"继续，或回复"没有文档"跳过。
```

- 仅 `.docs/prd/` 根目录 + 其所有子目录（prototype/、ui/、ui-spec/）都无任何文件 → 提示「.docs/prd/ 为空，新增需求（feature）后续需要 PRD 才能进入设计，建议现在放入。回复"没有"跳过（后续可在对话中直接粘贴需求描述）」
- 仅 `.docs/tech/` 为空 → 不阻断（技术文档可选）
- 均不为空 → 跳过

> **用户回复"放好了"后**，AI 必须重新扫描 `.docs/` 再继续。

→ 进入 G0.5 阶段路由

---

### 后续路径（G0.4 → G0.4.1 → G0.5）

> 仅在 `.project/context.md` 已存在且有内容时执行。跳过 G0.1/G0.2/G0.3。

**G0.4 状态恢复**：读取以下文件恢复状态：

- `.project/context.md` — 恢复工作进度。**读取最后一条记录的 `last: §N.N` 字段**作为当前章节位置（规约见本节第 7 条）；若 `last` 字段不存在（历史数据），则从最后一条记录的文本描述推理当前阶段
- `.project/task.md` — 恢复子任务进度（如存在）
- `.project/specs/rules/project-profile.md` — 恢复项目级认知（铁律/技术栈/外部依赖/业务架构）
- `.project/specs/rules/frontend-context.md` — 恢复前端规范（如存在）
- `.project/specs/rules/backend-context.md` — 恢复后端规范（如存在）

**G0.4.1 任务意图推断**（替代首次路径的 G0.1，后续对话时执行）：

AI 根据用户**首条消息**推断当前意图，**直接执行，不等待确认**。推断后输出一行简短状态提示（非阻塞），让用户知道 AI 的理解：

| 用户表述示例 | 推断意图 | 处理 |
|---|---|---|
| "继续" / "接着做" / "继续开发" / 无明确新任务 | 延续上次 | 按 context.md `last` 字段定位，继续原任务原类型 |
| "我要加功能" / "新增 XXX" / "做 XXX 需求" | 新增 feature | 新任务，类型=feature |
| "有个 bug" / "XXX 报错" / "修复 XXX" / "XXX 不正常" | bug 修复 | **二次判定**（见下方 bug 意图二次判定） |
| "优化 XXX" / "重构 XXX" / "性能问题" / "代码整理" | refactor | 新任务，类型=refactor |
| 无法推断（模糊表述） | 不确定 | 触发 G2 停车信号，请用户明确意图 |

**Bug 意图二次判定**：

推断为 bug 后，AI 必须结合 context.md `last` 字段 + bug 描述内容，区分两种场景：

| 判定条件 | 场景 | 处理 |
|---|---|---|
| `last` 在 §3.x 或 §4，**且** bug 描述涉及的模块/功能/接口/页面与 context.md 记录的当前模块一致 | **当前需求 bug** | 加载 `{SKILL_DIR}/rules/phase-coding.md`，直接进入 §3.0 通道判断（bug 修复回环），**跳过 G0.5** |
| `last` 不在 §3.x~§4，**或** bug 与当前模块无关 | **新 bug 工单** | 新任务，类型=bug，进入 G0.5 → §2.2 |
| 无法判定归属 | 不确定 | 触发 G2 停车信号：「这是当前需求 {模块名} 的 bug，还是一个独立的新 bug？」 |

> **排他**：以下意图不进入 bug 修复回环，即使 `last` 在 §3.x~§4 也走原流程：
> - "需求变更" / "改一下需求" / "加个字段" → feature 或 §2.6 Spec Sync
> - "评审批注改完了" / "继续" → 延续上次
> - "优化 XXX" / "重构 XXX" → refactor

**状态提示格式**（非阻塞，AI 输出后直接继续执行）：

```
【状态恢复】上次进度：{last 字段}（{模块名/任务名}）| 本次：{推断结果}
```

当前需求 bug 时的状态提示：
```
【状态恢复】上次进度：{last 字段}（{模块名}）| 本次：当前需求 bug 修复 → §3.0 通道判断
```

- AI 推断后**不等待用户回复**，直接进入 G0.5 阶段路由（当前需求 bug 则直接进入 §3.0，跳过 G0.5）
- 用户如发现推断错误，随时说 `"不是，我要做 XXX"` 打断，AI 重新推断

---

### G0.5 阶段路由（首次/后续共用）

根据状态判断当前阶段，**读取对应的阶段规则文件**：

| 当前状态 | 阶段编号 | 加载规则文件 | 说明 |
|---------|---------|-------------|------|
| 无 `.project/` 目录 | **§1** | `{SKILL_DIR}/rules/phase-init.md` | 项目启动初始化 |
| 有 `.project/` 但需求/设计未完成 | **§2** | `{SKILL_DIR}/rules/phase-spec.md` | 需求分析与方案设计 |
| REQ+DES `review-status: approved`，准备编码 | **§3** | `{SKILL_DIR}/rules/phase-coding.md` | 编码变更通道 |
| 模块子任务全 done，准备归档 | **§4** | `{SKILL_DIR}/rules/phase-archive.md` | 归档 |

> **重要**：按下方「G0.5 阶段执行约束」处理 — 进入每个 §N.N 章节前先输出流程声明头作为凭证；详细规则按需 Read 对应 phase-*.md（不强制每次都重读，速查表 + 已加载的 G 系列规则覆盖大部分场景）。

#### G0.5 阶段执行约束（声明式校验）

进入任何 §N.N 章节执行动作前，AI **必须**先输出该章节的流程声明头作为凭证。**输出格式必须与 phase-*.md 章节顶部真实声明头完全一致**（含"流程声明"标题 + 6 字段：phase / step / prev / next / gate / blocking），并在前面加一行 `【进入 §X.Y {章节名}】` 作为 AI 标识：

```
【进入 §X.Y {章节名}】
> **流程声明**
> - phase: {init|spec|coding|archive}
> - step: {N}/{总数}
> - prev: {严格按 phase-*.md 章节顶部声明头复制，不得简化}
> - next: {严格按 phase-*.md 章节顶部声明头复制}
> - gate: {G1 写码门禁 | none}
> - blocking: {true | false}
```

输出后才执行该章节正文动作。

**违反检测**：
- 执行 §X.Y 动作但**没有**先输出声明头 → 视为违反 G2 信号「路由不确定」，停止当前动作
- 输出的声明头**任一字段值**与 phase-*.md 真实定义不符 → AI 必须按需 Read 对应 phase-*.md 后修正
- 自创/简化 prev / next 描述（不按真实头逐字复制）→ 同上

**何时主动 Read phase-*.md**（按需，节省 token）：
- AI 自感不确定章节内容（流程声明头与下方"阶段速查表"对不上）
- 用户明确要求"请按 phase-X.md §X.Y 执行"
- 进入审计/自测等需要详细规则的章节（§3.6 / §3.7 → quality-standards.md）

**何时跳过 Read**（绝大多数日常场景）：
- AI 已能从下方"阶段速查表" + AGENTS.md G 系列规则推导出执行步骤
- 已经在当前会话上下文中读过该章节

> **Slash 命令的差异化执行**：
> - 工具触发类命令选「A 独立执行」：仅 Read SKILL.md（按 Skill 调用强制约束），**不强制**输出阶段声明头（独立执行不进入工作流阶段）
> - 工具触发类命令选「B 工作流内」：必须按 last 字段映射阶段，输出对应声明头
> - 流程触发类命令（4 个）：命令体自有路由机制，按命令体的"前置检查 / 四场景路由 / 二次判定"执行，不强制叠加本约束

**类型映射**（贯穿后续所有阶段）：

| 来源 | 匹配 | 任务类型 | 对应 §2.2 模板 |
|---|---|---|---|
| G0.1 选项（首次） | A / B | feature | 新增需求 |
| G0.1 选项（首次） | C | bug | Bug 修复 |
| G0.1 选项（首次） | D | refactor | 技术优化 |
| G0.4.1 推断（后续） | 延续上次 | 上次类型 | 无需重映射 |
| G0.4.1 推断（后续） | 新增功能 | feature | 新增需求 |
| G0.4.1 推断（后续） | bug 描述 | bug | Bug 修复 |
| G0.4.1 推断（后续） | 优化/重构 | refactor | 技术优化 |

---

## G1 写码门禁（Code Gate）

> AI 每次准备写/改生产代码前，必须自检以下条件，**全部 ✅ 才可执行**：

| # | 检查项                                              | 未通过处理                     |
| - | --------------------------------------------------- | ------------------------------ |
| 1 | `.project/` 已初始化                              | → 先完成项目启动              |
| 2 | 当前功能有 REQ + DES 且 `review-status: approved` | → 先完成需求分析+方案设计    |
| 3 | 阻塞依赖已就绪（用户明确说"跳过"的视为就绪）        | → 等待用户提供或确认跳过      |
| 4 | 技术栈对应的编码/审计 Skill 已安装                  | → 读取 `{SKILL_DIR}/rules/skill-routing.md` 按流程安装 |
| 5 | task.md 中当前模块有 pending 子任务                 | → 定位下一个 pending 子任务   |
| 6 | 本次变更与项目铁律无冲突                            | → 列冲突点 + 替代方案，触发 G2 停车信号 |

**检查项 #4 Skill 安装检查规则**：根据 project-profile.md「技术栈」声明，检查以下目录是否存在：

- 技术栈含前端 → 检查 `{SKILL_DIR}/tools/frontend-code-standards/` 是否存在
- 技术栈含 Java → 无内置编码 Skill，使用内置规约 C-01~C-10
- 代码审计 → 无内置审计 Skill，使用 `{SKILL_DIR}/rules/quality-standards.md` 中 S-01~S-07 + S-08
- 内置 Skill 缺失 → 读取 `{SKILL_DIR}/rules/skill-routing.md` 按兜底规则处理

**检查项 #5 Task 定位规则**：读取 `.project/task.md`，定位当前模块的下一个 pending 子任务，输出：

```
【当前任务】{ID} [{类型}] {描述}
【模块进度】{done}/{总数}
```

- task.md 不存在（bug 类型无 task.md；refactor 类型用户选择不创建时无 task.md）→ 跳过此检查项
- 当前模块无 pending 子任务 → 进入归档（读取 `{SKILL_DIR}/rules/phase-archive.md`）

**快速通道豁免**：仅样式/文案的快速通道任务，检查项 #2 简化为：REQ + DES 可各简化为一句话描述，免评审。AI 在进入 §3.1 前，在对应 REQ + DES 文件中追加一句话记录（文件不存在则新建）。检查项 #5 跳过（快速通道不更新 task.md，样式/文案改动不对应独立子任务）。

**Bug 修复回环豁免**：从 G0.4.1 二次判定进入 §3.0 的当前需求 bug 修复，检查项 #5 跳过（bug 修复不是 task.md 中的子任务，不受子任务状态约束）。修复完成后的归档由 §3.11 路由规则控制（原始 last 在 §4 → 重新归档；原始 last 在 §3.x → 回到原位继续开发）。

- 任一 ❌ → **停止**，输出缺失项，等待用户指示
- **禁止将"继续"、"开始"等模糊指令默认理解为"直接写代码"**，应先执行门禁自检

---

## G2 停车信号

以下情况必须暂停，向用户报告并等待指示：

| 信号 | 处理 |
|------|------|
| 路由不确定 | 说明两种判断及理由，请用户选择 |
| 影响面超预期 | 列出影响范围，建议升级通道 |
| 循环超限 | 列出未通过项 + 错误模式，请用户判断（审计循环超 3 次 / 自愈循环超 5 次） |
| 规则冲突 | 列出矛盾点（Spec 间 / 铁律 / DES 冲突），请用户裁决 |
| 未覆盖场景 | 描述场景 + 建议处理方式，请用户确认 |

**停车不是失败，是负责任。** AI 不应在不确定的情况下"猜着往前走"。

---

## G3 未覆盖场景兜底

发现本规则未覆盖的场景时，按 G2 停车信号「未覆盖场景」处理：描述场景 + 建议处理方式，暂停等待用户确认。

---

## 按需加载的规则文件索引

以下文件位于 `{SKILL_DIR}/` 目录，在对应阶段由 AI 主动读取：

| 文件 | 用途 | 何时读取 |
|------|------|---------|
| `rules/phase-init.md` | **§1 项目启动**（§1.1 新项目 / §1.2 旧项目 / §1.3 前后端规范提取 / §1.4 深度扫描 / §1.5 技术文档处理） | 项目首次初始化 |
| `rules/phase-spec.md` | **§2 需求与设计**（§2.1 任务拆分 / §2.2 需求分析 / §2.3 方案设计 / §2.4 原型生成 / §2.5 评审 / §2.6 Spec Sync / §2.7 功能测试用例设计） | 进入需求/设计阶段 |
| `rules/phase-coding.md` | **§3 编码变更通道**（§3.0 通道判断 / §3.1~§3.11 标准通道步骤） | 进入编码阶段 |
| `rules/phase-archive.md` | **§4 归档** | 模块编码完成后 |
| `rules/quality-standards.md` | 审计标准（PRD/REQ/DES/代码/自测） | 执行审计时 |
| `rules/skill-routing.md` | Skill 路由表 + 安装/执行流程 | 需要安装或调用 Skill 时 |
| `rules/fallback/frontend-scan.md` | 前端内置扫描（兜底） | 前端 context skill 不可用时 |
| `rules/fallback/backend-scan.md` | 后端内置扫描（兜底） | 后端 context skill 不可用时 |
| `templates/project-profile.tpl.md` | project-profile.md 模板（仅项目级） | 初始化 profile 时 |
| `templates/project-overview.tpl.md` | project-overview.md 输出结构模板 | 生成 overview 时 |

---

## Slash Commands 入口表

用户可通过 slash 命令显式触发本工作流的关键流程；命令文件位于 `{SKILL_DIR}/.claude/commands/`，由 `/sdd-init` 安装到用户级（`~/.claude/commands/`）或项目级（`.claude/commands/`）。AI 在用户调用命令时按本表路由：

> **G0.0 豁免规则**：用户首条消息是 slash 命令时，**G0.0 不强制**走 G0 路径，由命令体自有路由机制处理（含前置检查 / 四场景路由 / 二次判定等）；仅对 slash 命令直接触发生效。**自然语言**触发（如"启动工作流"/"做新项目"）仍按 G0.0 强制走 G0 路径。命令体内部进入 §X.Y 时仍受 G0.5 阶段执行约束（输出流程声明头）+ Skill 调用强制约束（5 步走）。

### 流程触发类（4 个）

| 命令 | 绑定流程 | AI 路由动作 |
|---|---|---|
| `/sdd-init` | SKILL.md 安装/更新/状态/卸载 | 读取并执行 `{SKILL_DIR}/SKILL.md`，按 A/B/C/D 四选一执行 |
| `/sdd-start` | G0 对话初始化 | 必读 AGENTS.md + context.md，按上方「`/sdd-start` 触发约束」四场景路由 |
| `/sdd-prd-change` | §2.6 Spec Sync `[prd]` | 读取 `{SKILL_DIR}/rules/phase-spec.md` §2.6，按 Step1~6 完整执行；结束后按倒数第二条 last 返回原阶段 |
| `/sdd-bug-fix` | G0.4.1 当前需求 bug 二次判定 → §3.0 bug 修复回环 | 按 G0.4.1 二次判定表分流；判定为当前需求 bug → §3.0 通道判断；不归属或不确定 → G2 停车三选一 |

### 工具触发类（9 个，按统一 Skill 执行流程）

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

### 流程冲突保护（仅适用 9 个工具触发类命令）

> **流程触发类（4 个）各自有自有机制，不复用本模板：**
> - `/sdd-init`：基础设施操作，不绑定阶段，无冲突场景
> - `/sdd-start`：四场景路由（A 未装 / B 首次 / C 进行中 / D 异常，详见上方"`/sdd-start` 触发约束"）
> - `/sdd-prd-change`：前置检查（无 AGENTS.md/无 context.md → 退出） + 严格按 §2.6 流程
> - `/sdd-bug-fix`：前置检查 + G0.4.1 二次判定 + G2 停车三选一（A 走回环 / B 走新 bug 工单 / C 取消）

下述两类冲突保护仅适用工具触发类命令（`/sdd-prd-audit` / `/sdd-front-context` / `/sdd-back-context` / `/sdd-frontend-standards` / `/sdd-java-create` / `/sdd-wap-create` / `/sdd-reverse-scan` / `/sdd-test-case` / `/sdd-unit-test`）。

实际有**两类**冲突场景，AI 按场景使用对应模板：

#### 类 1：阶段冲突（last 字段与命令绑定阶段不一致）

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

#### 类 2：产出物冲突（产出文件已存在 / 状态前置不满足）

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

---

## .project 目录结构

```
项目根目录/
├── .project/                          ← 项目管理目录
│   ├── context.md                     ← 每次对话必读，AI 自动维护
│   ├── task.md                        ← 子任务级进度跟踪
│   ├── specs/
│   │   ├── master/
│   │   │   ├── index.md               ← 模块状态总览
│   │   │   ├── requirements/
│   │   │   │   └── REQ-{xx}-{name}.md
│   │   │   ├── design/
│   │   │   │   └── DES-{xx}-{name}.md
│   │   │   └── prototypes/            ← §2.4 原型产出
│   │   │       └── {xx}-{模块名}/
│   │   │           ├── *.html         ← HTML 线框图（仅 PRD 无视觉内容时生成）
│   │   │           └── prototype-spec.md  ← 按页面基准来源表 + 交互流程 + 结构说明
│   │   ├── change-log-specs.md
│   │   └── rules/
│   │       ├── project-profile.md     ← 项目级（铁律/技术栈/外部依赖/业务架构）
│   │       ├── frontend-context.md    ← 前端规范（context skill 或 fallback 产出）
│   │       ├── backend-context.md     ← 后端规范（context skill 或 fallback 产出）
│   │       └── unit-test-base.md      ← [可选]
│   ├── changelog/
│   └── reverse-scan/              ← [可选] 深度扫描产出（reverse-scan Skill）
│       ├── knowledge-cards/       ← 知识卡片（逐文件函数级）
│       ├── call-graph.md          ← 全局调用关系图
│       ├── module-map.md          ← 模块地图
│       ├── db-schema.md           ← 数据库结构
│       ├── specs/requirements/    ← 已有模块 REQ（逆向，仅供参考）
│       ├── specs/design/          ← 已有模块 DES（逆向，仅供参考）
│       ├── profile-patch.md       ← 合并就绪：业务架构 + 业务流程
│       ├── overview.md            ← 合并就绪：项目全景文档
│       ├── api-doc.md             ← 合并就绪：全量接口文档
│       ├── verification-report.md
│       ├── grey-decisions.md
│       └── scan-summary.md
├── .docs/
│   ├── prd/                           ← PRD 文字需求（md/pdf）
│   │   ├── prototype/                 ← 原型图（线框图）
│   │   ├── ui/                        ← UI 设计稿（高保真）
│   │   └── ui-spec/                   ← UI 解析文件（md 格式）
│   └── tech/                          ← 技术文档
├── .test-env.md                           ← 测试运行环境声明（G0.2 自动生成，项目根目录；test-case-design / unit-test-generator 默认查找位置）
├── .test/                                 ← 测试产出根目录（独立于 .project）
│   ├── testcases/                         ← §2.7 功能测试用例（test-case-design 产出）
│   │   ├── TC-F-{xx}-{模块}.md            ← 按模块分文件
│   │   ├── testcases.detailed.csv         ← 全局汇总（所有模块追加）
│   │   └── testcases.traditional.csv
│   └── unit/                              ← §3.7 单元测试（unit-test-generator 产出）
│       ├── UT-{xx}-{模块}.md              ← 单测用例文档
│       ├── skeleton/                      ← 单测代码骨架（原件，不删除）
│       │   ├── *.jest.ts / *.junit.java / ...
│       │   └── fixtures/*.json
│       └── report.md                      ← 单元测试执行报告
├── .outdocs/
│   ├── project-overview.md
│   ├── api-doc.md
│   ├── audit-report.md
│   ├── unit-test-report.md
│   ├── task-report.md
│   └── prd-change-log.md
└── .agents/skills/                    ← ny-sdd-workflow 安装目录（所有子 Skill 已内置在 tools/ 下）
```

---

## 阶段速查表（始终加载，免去 phase-*.md 重读）

> **使用方式**：AI 在执行任何 §N.N 时按此表快速定位关键动作；如需详细规则（如 §3.6 S-01~S-08 完整描述、§2.6 Spec Sync 级联规则等），按需 Read 对应 `phase-*.md` 或 `quality-standards.md`。

### §1 项目启动（rules/phase-init.md）

| § | 动作 | 关键产出 / 前置 |
|---|---|---|
| §1.1 | 新项目：PRD 审计 → 业务流程提取 → 询问技术栈 → 脚手架 → §1.3 → §2.1 | PRD 审计 P0 必须解决；脚手架前需技术栈确定 |
| §1.2 | 旧项目：扫描代码 → 技术栈识别 → §1.3 → §1.4 → feature/bug/refactor 分流 | 兜底：浅层业务架构推断 |
| §1.3 | 调用 front-/back-project-context Skill 提取规范 → mv 到 `.project/specs/rules/` | 兜底：`fallback/{frontend,backend}-scan.md` |
| §1.4 | 调用 reverse-scan Skill 深度业务代码扫描 | 仅 §1.2 旧项目；产出在 `.project/reverse-scan/` |
| §1.5 | 技术文档处理规则（横切，被 §1.1/§1.2/§2.3/§3.5 引用） | 按 `.docs/{prd,tech}/` 分流处理 |

### §2 需求与设计（rules/phase-spec.md）

| § | 动作 | 关键产出 / 前置 |
|---|---|---|
| §2.1 | 模块排序 + 子任务拆分 + 写入 `task.md` + 选执行模式（连续/逐个确认） | feature 类型；首次进入 §2 |
| §2.2 | 需求分析 → REQ 文件（`review-status: draft`）+ REQ 自审 | feature/bug/refactor 分模板 |
| §2.3 | 方案设计 → DES 文件 + `api-doc.md` 自动追加 + DES 自审 | DES 含 API 时自动写 api-doc |
| §2.4 | 原型生成 → `prototype-spec.md`（+ HTML 线框图条件性） | 仅 feature 含前端 |
| §2.5 | 人工评审 → REQ/DES `review-status: approved` | 阻塞，待用户确认 |
| §2.6 | Spec Sync（PRD/specs/tech 三种触发源）→ 级联更新 | 横切动作，可在 §1~§4 任意触发 |
| §2.7 | 调用 test-case-design Skill → TC-F + CSV | 评审通过后；非编码阻断项 |

### §3 编码变更通道（rules/phase-coding.md）

| § | 动作 | 关键产出 / 前置 |
|---|---|---|
| §3.0 | 通道判断（直通/快速/标准 + bug 修复回环） | 受 G1 门禁前置 |
| §3.1 | 加载规范+铁律（4 子步骤：铁律 / 已有代码 / 编码上下文 / UI 上下文） | — |
| §3.2 | 加载 Spec（sync-status + coding-skill + audit-skill 状态检查） | — |
| §3.3 | 文档学习（按需，优先 `.docs/`） | — |
| §3.4 | 影响面评估（6 维度） | — |
| §3.5 | 代码变更（C-01~C-10 + U-01~U-06） | 调用 frontend-code-standards Skill 或 context 文件 |
| §3.6 | 代码审计（S-01~S-08）→ `audit-report.md` | 内置兜底，详细规则在 quality-standards.md |
| §3.7 | 自动化单测（unit-test-generator）+ T-01~T-06 自动补充 | 报告 PASS/SKIP/FAIL；产出 `.test/unit/` |
| §3.8 | 更新 `task.md`（feature 类型，或 refactor 有 task.md 时） | — |
| §3.9 | 生成 Changelog → `.project/changelog/` | 所有通道 |
| §3.10 | Spec 状态同步（含 bug 修复回环留痕） | 更新 sync-status / change-log-specs.md |
| §3.11 | 写入 `context.md`（含 bug 回环路由） | 路由：原始 last 在 §3.x→回原位 / §4→重新归档 |

### §4 归档（rules/phase-archive.md）

| 动作 | 关键产出 / 前置 |
|---|---|
| 15 项检查清单 → 通过即归档 | 任一不通过回对应阶段 |
| 标签 `[Feature/Bug/Refactor]` + `task-report.md` | — |
| feature 连续模式 → 自动下一模块；逐个确认模式 → 询问；bug/refactor → 询问下一步 | — |

> **覆盖范围**：本速查表覆盖**自然语言路径**和**slash 命令路径**的所有阶段动作。AI 进入任何 §N.N 时先按此表定位关键动作 + 输出流程声明头，详细规则按需 Read。

### 必读边界清单（即便有速查表，以下场景仍必须 Read 详细文件）

| 场景 | 必读文件 | 原因 |
|---|---|---|
| §3.5 代码变更 | `quality-standards.md` 的 C-01~C-10 | 10 条编码规约逐项核对 |
| §3.5 前端代码变更 | `quality-standards.md` 的 U-01~U-06 | 6 条 UI 还原规约 |
| §3.6 代码审计 | `quality-standards.md` 的 S-01~S-08 | 8 条审计规约 + 详细判定标准 |
| §3.7.2 自动补充验证 | `quality-standards.md` 的 T-01~T-06 | 6 条自测规约 + 执行细节 |
| §2.2 REQ 自审 / §2.3 DES 自审 | `quality-standards.md` 的 REQ/DES 审计标准 | 审计循环上限 / 自审项清单 |
| §2.6 Spec Sync 级联 | `phase-spec.md` §2.6 完整段 | 5 张级联规则表 / Step 1~6 详细流程 |
| §3.10 bug 修复回环留痕 | `phase-coding.md` §3.10 完整段 | a~e 5 项留痕动作 + 文档级联 |
| §1.4 reverse-scan 合并 | `phase-init.md` §1.4 + scan-summary.md | 合并到 profile/overview/api-doc/context 的具体规则 |
| §4 归档检查 | `phase-archive.md` 完整段 | 15 项检查清单 + 各项验证细节 |
| 调用任何 Skill | `tools/{skill}/SKILL.md` | 必读全文（详见 skill-routing.md 的 Skill 调用强制约束） |
| 兜底（Skill 缺失时） | `quality-standards.md` 或 `rules/fallback/*.md` | 内置兜底规则的详细描述 |

> 这些场景速查表无法承载完整规则，**Read 不可省**。AI 必须在执行该场景时显式 Read 对应文件。

