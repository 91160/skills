---
inclusion: always
description: "SDD 开发工作流 v1.0 — G 系列全局规则始终加载，§1~§4 阶段规则按需读取，流程声明头机械跳转"
---
# SDD Workflow — AI 执行规则 v1.0

> **最高指令**：严禁在未确认变更通道的情况下直接编写或修改生产代码。每次回复优先使用中文。
>
> **防误触**：用户说"初始化工作流"、"启动工作流"、"安装 SDD"等词时，**禁止执行 Claude Code 内置的 /init 命令**（/init 是生成 CLAUDE.md 的命令，与本工作流无关）。应按本文件 G0 对话初始化流程执行；若 AGENTS.md 尚未安装到项目，则按 SKILL.md 安装流程执行。

---

## 编号与流程声明规约（v1.0）

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
2. **进入任何 §N.N 章节前，必须先读取该章节顶部的流程声明引用块**，按 `prev` / `next` / `gate` 字段执行跳转与门禁检查
3. 正文与声明头冲突时，以正文为准；同时修复声明头
4. G 系列章节（G0~G3）常驻 AGENTS.md，不使用声明头；阶段章节（§1~§4）必须带声明头
5. 字段取值规范：`phase ∈ {init, spec, coding, archive}`；空值统一用 `none`；next 多分支用 `/` 分隔，条件写括号内
6. 其他 AI 工具（Cursor/Copilot 等）只读 AGENTS.md，不消费流程声明；动态加载 + 声明头机制仅 Claude Code / Codex 启用
7. **context.md 状态标记规约**：AI 在关键节点追加 `.project/context.md` 记录时，**每条记录必须在末尾标注 `last: §N.N {章节名}`**（或 `last: G0.N` 如果处于全局初始化阶段），用于下次对话 G0.4 状态恢复时精确定位当前所处章节。关键节点包括：§2.1 任务拆分完成 / §2.2 REQ 完成 / §2.3 DES 完成 / §2.4 原型规格完成 / §2.5 评审通过 / §2.6 Spec Sync 完成 / §2.7 功能测试用例设计完成 / §3.0 直通通道完成 / §3.11 写入 context.md / §4 归档完成。G0.4 状态恢复时，AI 读取 context.md **最后一条记录的 `last` 字段**即可反查阶段文件，无需推理

---

## G0 对话初始化

**每次对话开始时**，AI 先检查 `.project/context.md` 是否存在且有内容：

- **不存在 或 无有效记录**（首次对话 / 项目启动未完成）→ 走**首次路径**：G0.1 → G0.2 → G0.3 → G0.5
- **存在且包含至少 1 条状态记录（含 `last` 字段）**（后续对话）→ 走**后续路径**：G0.4 → G0.4.1（推断，非阻塞）→ G0.5

---

### 首次路径（G0.1 → G0.2 → G0.3 → G0.5）

> 仅在 `.project/context.md` 不存在或为空时执行。后续对话跳过本段。

**G0.1 项目类型确认**：AI 主动询问项目类型：

```
【项目确认】
请问这是新项目还是旧项目？
  A. 新项目（请提供 PRD）
  B. 旧项目 — 新增需求
  C. 旧项目 — Bug 修复
  D. 旧项目 — 技术优化
```

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

**`.test/.test-env.md` 模板生成**（已存在则跳过）：

G0.2 同时在 `.test/` 目录下生成 `.test-env.md` 模板文件（供 §3.7 unit-test-generator 使用）：

```markdown
# 测试运行环境声明

**version**: 1

## 服务端点
- `base_url.local = http://localhost:8080`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://root:YOUR_PASSWORD@localhost:3306/app_test`

## 测试运行命令
- `test_commands.frontend = npm test`
- `test_commands.backend = mvn test`

## 单测目录约定
- `test_dirs.frontend_unit = src/__tests__`
- `test_dirs.backend_unit = src/test/java`

## 全局变量
- `vars.test_user = zhangsan`
- `vars.test_password = "YOUR_PASSWORD"`
```

> 以上为占位模板，用户按实际测试环境修改。不修改不阻断流程：unit-test-generator 会自动降级为 in-memory 模式（进程内注入 + 内存数据库）。

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

  · .test/.test-env.md — 测试环境配置（模板已自动生成在 .test/ 目录，按实际环境修改即可；
    不修改也不阻断，单元测试会自动降级为 in-memory 模式）

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

> **重要**：必须实际读取文件内容，不要凭记忆执行。每个阶段文件的章节顶部有流程声明头，AI 读取后按 `prev` / `next` / `gate` 字段执行。

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
├── .test/                                 ← 测试产出根目录（独立于 .project）
│   ├── .test-env.md                       ← 测试运行环境声明（模板自动生成）
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
