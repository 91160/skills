# §1 项目启动

> 本文件在项目初始化阶段加载。完成后进入 `{SKILL_DIR}/rules/phase-spec.md`（§2）或 `{SKILL_DIR}/rules/phase-coding.md`（§3）。
>
> 本文件所有 §N.N 章节顶部均带有「流程声明」引用块，AI 进入任何章节前必须先读声明头。

---

## §1.1 新项目流程

> **流程声明**
> - phase: init
> - step: 1/5
> - prev: G0.5 阶段路由（新项目）
> - next: §1.3 前后端规范提取
> - gate: none
> - blocking: true

```
AI 检查 .docs/prd/ 是否有文件：
  - 有文件 → 读取全部内容（文本+图片+PDF 统一为需求输入）
  - 为空 → 询问用户提供 PRD（用户可能在对话中直接粘贴需求描述）
  → AI 读取 PRD，理解业务需求
  → AI 执行 PRD 审计（必须输出 Skill 执行日志）：
    1. 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用 /prd-audit Skill，输出执行日志
    2. Skill 安装失败 → 询问用户（手动安装 / 使用 {SKILL_DIR}/rules/quality-standards.md 中 PRD 审计标准兜底）
    3. P0 必须解决后才继续
  → AI 从 PRD 提取业务流程，首次生成 .outdocs/project-overview.md，写入「二、业务架构」「三、核心业务流程」部分（新项目不写入 project-profile.md，待需求澄清完善后再沉淀；其余章节留空，由 §2.1 补充）
  → AI 扫描 .docs/ 目录，按下方「技术文档处理规则」处理：
    - .docs/prd/ 有文件 → 已在上方读取，此处跳过
    - .docs/tech/ 有文件 → 按技术文档流程处理，扫描到的信息（技术栈/外部依赖/数据库等）直接采用，后续询问时跳过已知项
    - .docs/tech/ 为空 → 跳过（G0.3 文档补充确认已完成，不再重复询问）
  → AI 询问技术栈（跳过 .docs/ 已覆盖的项）→ 写入 project-profile.md「技术栈」区块
  → AI 询问外部依赖（跳过 .docs/ 已覆盖的项）→ 写入 project-profile.md「外部依赖」区块
  → .docs/ 已覆盖的外部依赖 → 直接从文档提取，无需用户重复提供
  → AI 初始化 .project/ 文件（目录骨架已在 G0.2 创建）
  → AI 初始化代码结构（脚手架，必须输出 Skill 执行日志）：
    1. 查 {SKILL_DIR}/rules/skill-routing.md，按技术栈匹配对应 Skill
    2. 后端 Java → 按 Skill 执行流程调用 java-project-creator，输出执行日志
    3. 前端 → 按 Skill 执行流程调用 wap-project-creator，输出执行日志
    4. Skill 安装失败 → 询问用户（手动安装 / 使用框架官方 CLI 兜底）
  → 安装依赖，确认能跑起来
  → 执行 §1.3 前后端规范提取
  → 读取 `{SKILL_DIR}/rules/phase-spec.md`，进入 §2.1 任务拆分（全量模块排序 + 全量模块子任务拆分）
  → 进入图二业务开发循环
```

**技术栈询问格式**：

```
【技术栈确认】
请告诉我本项目的技术栈：
  1. 前端框架？（如 Vue3 / React）
  2. 后端框架？（如 SpringBoot / Node.js）
  3. 数据库？（如 MySQL / PostgreSQL）
  4. 前端代码根目录？（如 src/ / frontend/）
  5. 后端代码根目录？（如 server/ / backend/）
```

**外部依赖询问格式**：

```
【外部依赖确认】
请告诉我需要调用的外部服务：
  1. 第三方 API？（如微信支付、地图服务）
  2. 公司内部其他服务接口？
  3. 指定的前端组件库或工具库？
```

---

## §1.2 旧项目流程

> **流程声明**
> - phase: init
> - step: 2/5
> - prev: G0.5 阶段路由（旧项目）
> - next: §1.3 前后端规范提取
> - gate: none
> - blocking: true

**AI 自动执行**（读代码得出，无需人工提供）：

- 扫描 .docs/ 目录，按 §1.5 技术文档处理规则处理（G0.3 文档补充确认已完成，此处直接扫描，不再重复询问）
- 技术栈识别（.docs/ 已覆盖的直接采用）→ 写入 project-profile.md「技术栈」区块
- 外部依赖梳理（.docs/ 已覆盖的直接采用）→ 记录到 project-profile.md「外部依赖」区块
- 数据库结构梳理（.docs/ 已覆盖的以文档为准，否则从代码反推）
- 接口文档梳理（.docs/ 已覆盖的以文档为准，否则从代码反推）
- 执行 §1.3 前后端规范提取
- 执行 §1.4 深度业务代码扫描 → 成功则跳过兜底，失败则执行兜底
- **兜底：业务架构与流程提取**（仅在深度扫描 Skill 不可用时执行）→ 写入 project-profile.md「业务架构」「业务流程」区块，人工确认
  提取来源与内容：
  | 信息源            | 提取什么               |
  | ----------------- | ---------------------- |
  | 路由/控制器       | API 全貌、模块划分     |
  | 数据库模型/实体类 | 业务实体关系、数据流向 |
  | 服务层/业务逻辑   | 核心流程、状态流转     |
  | 中间件/拦截器     | 权限模型、全局处理     |
  | 前端路由/页面     | 用户操作路径           |
  | .docs/（如有）    | 已有文档补充佐证       |

  **兜底产出格式要求**（写入 project-profile.md 对应区块）：

  「业务架构」区块必须包含：
  - 模块划分表：`| 模块名 | 职责描述 | 核心文件/目录 | 依赖模块 |`
  - 角色/权限矩阵（如代码中可识别）：`| 角色 | 可访问模块 | 关键权限 |`

  「业务流程」区块必须包含：
  - 每条核心流程的正常路径（步骤序列，标注涉及的模块和接口）
  - 每条核心流程的异常路径（至少列出代码中已处理的异常分支）
  - 状态流转（如代码中存在状态机/枚举状态）：`状态A → 触发条件 → 状态B`

  **兜底深度标准**：扫描粒度为路由/控制器 + 服务层入口方法，不要求逐函数级别（那是 reverse-scan 的职责）。目标是建立模块级认知，能支撑 §2.1 任务拆分。

**人工确认**（AI 无法自行判断，必须问）：

- 危险区域确认（核心逻辑 / 遗留代码 / 不能动的部分）
- 分支策略确认（开发分支 / review 流程 / 合并策略）
- 部署环境确认（dev / staging / prod / CI/CD 流程）
- 敏感配置确认（密钥 / 证书 / .env 处理方式）
- 性能和业务约束（瓶颈 / 特殊要求）
- 团队协作信息（维护者 / 并行开发 / 提交规范）
- 基线确认（核心功能是否正常 / 已知 bug / 进行中分支）

**完成后**：

```
AI 生成 .project/ 目录（汇总所有信息）
  → 安装依赖，确认能跑起来
  → 生成 .outdocs/project-overview.md（若上方已从 reverse-scan 合并则跳过；未合并则从 project-profile.md + frontend-context.md + backend-context.md + index.md + 实际代码结构汇总，模板见 {SKILL_DIR}/templates/project-overview.tpl.md）
  → 生成 .outdocs/api-doc.md（若上方已从 reverse-scan 合并则跳过）
  → feature 类型 → 检查 .docs/prd/ 是否有文件，有则执行全量 PRD 审计（与 §1.1 一致）：
      1. 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用 /prd-audit Skill，输出执行日志
      2. Skill 不可用 → 按 {SKILL_DIR}/rules/quality-standards.md 中 PRD 审计标准兜底
      3. P0 问题必须解决后才继续
    → 读取 `{SKILL_DIR}/rules/phase-spec.md`，进入 §2.1 任务拆分（全量模块排序 + 拆分，与新项目一致）
  → bug / refactor 类型 → 跳过 §2.1，直接读取 `{SKILL_DIR}/rules/phase-spec.md`，进入 §2.2
  → 进入图二业务开发循环
```

**project-profile.md 模板**：初始化时，读取 `{SKILL_DIR}/templates/project-profile.tpl.md` 作为模板写入 `.project/specs/rules/project-profile.md`。项目铁律由团队人工填写，AI 不自动生成。其余区块由 AI 在初始化时自动填写。

**AI 执行规则**：

- 每次标准通道和快速通道开始前必须先读取铁律（执行详见 phase-coding.md §3.1.1）
- 未收到用户明确指示不得继续执行

---

## §1.3 前后端规范提取

> **流程声明**
> - phase: init
> - step: 3/5
> - prev: §1.1 新项目流程 / §1.2 旧项目流程
> - next: §1.4 深度业务代码扫描（旧项目）/ §2.1 任务拆分（新项目）
> - gate: none
> - blocking: false

根据 project-profile.md「技术栈」声明，按前后端分别调用对应的 context skill 提取项目规范：

**前端**（技术栈含前端时执行）：

```
1. 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用 front-project-context skill
2. 成功 → skill 产出 FRONT_PROJECT_CONTEXT.md 在项目根目录
   → 移动并重命名：mv FRONT_PROJECT_CONTEXT.md .project/specs/rules/frontend-context.md
3. 失败 → 询问用户：
   A. 手动安装（用户自行执行命令后告知 AI）
   B. 使用内置兜底 → 读取 {SKILL_DIR}/rules/fallback/frontend-scan.md，按其指令扫描，产出直接写入 .project/specs/rules/frontend-context.md
4. 必须输出 Skill 执行日志
```

**后端**（技术栈含后端时执行）：

```
1. 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用 back-project-context skill
2. 成功 → skill 产出 BACKEND_PROJECT_CONTEXT.md 在项目根目录
   → 移动并重命名：mv BACKEND_PROJECT_CONTEXT.md .project/specs/rules/backend-context.md
3. 失败 → 询问用户：
   A. 手动安装（用户自行执行命令后告知 AI）
   B. 使用内置兜底 → 读取 {SKILL_DIR}/rules/fallback/backend-scan.md，按其指令扫描，产出直接写入 .project/specs/rules/backend-context.md
4. 必须输出 Skill 执行日志
```

**纯前端项目**：不生成 backend-context.md。
**纯后端项目**：不生成 frontend-context.md。

**context 文件更新规则**：
- context skill 仅在 §1 初始化时调用一次，mv 到 `.project/specs/rules/` 后不再重新调用覆盖
- 编码过程中新增的公共能力直接追加到 context 文件对应章节（增量追加，不覆盖已有内容）
- 如需全量重新扫描（如项目架构大改），用户手动触发 context skill，AI 执行前须备份现有 context 文件为 `{name}.bak`，skill 产出 mv 后与备份合并（新产出为主，备份中编码期间追加的内容保留）

---

## §1.4 深度业务代码扫描

> **流程声明**
> - phase: init
> - step: 4/5
> - prev: §1.3 前后端规范提取
> - next: §2.1 任务拆分（feature）/ §2.2 需求分析（bug、refactor）
> - gate: none
> - blocking: false

> 仅 §1.2 旧项目流程执行。通过逐文件逐函数级别的深度扫描，自底向上建立代码认知层，为后续编码提供精准的复用参考。

```
1. 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用 reverse-scan Skill
2. 成功 → Skill 产出在 .project/reverse-scan/（知识卡片 + 调用关系图 + 模块地图 + DES/REQ + 合并就绪文件）
   → AI 执行合并（Skill 不直接写入主工作流文件，由此处统一合并）：
     a. 读取 `.project/reverse-scan/profile-patch.md` → 合并到 project-profile.md「业务架构」「业务流程」区块
     b. 读取 `.project/reverse-scan/overview.md` → 写入 .outdocs/project-overview.md
     c. 读取 `.project/reverse-scan/api-doc.md` → 写入 .outdocs/api-doc.md
     d. 读取 `.project/reverse-scan/scan-summary.md` → 追加到 .project/context.md
   → 跳过上方「兜底：业务架构与流程提取」
3. 失败 → 询问用户：
   A. 手动安装（用户自行执行命令后告知 AI）
   B. 使用内置兜底 → 执行上方「兜底：业务架构与流程提取」（现有浅层扫描逻辑）
4. 必须输出 Skill 执行日志
```

**深度扫描产出物**（产出在 `.project/reverse-scan/`，与正向 Spec 体系路径隔离）：

| 产出 | 用途 | 后续谁消费 |
|------|------|-----------|
| `knowledge-cards/*.md` | 逐文件函数级知识卡片 | §2.2 需求分析(feature/refactor) / §2.3 方案设计 / §3.1,§3.4,§3.5,§3.6 编码与审计 |
| `call-graph.md` | 全局调用关系图 | §2.2 需求分析(refactor) / §2.3 方案设计 / §3.4 影响面评估 |
| `module-map.md` | 已有模块划分 + 职责 + 依赖 | §2.1 任务拆分 |
| `db-schema.md` | 完整数据库结构 | §2.3 数据模型设计 / §3.3 文档学习 / §3.4 影响面评估 |
| `specs/design/DES-*.md` | 已有模块的设计规格（逆向） | §2.3 参考已有技术方案 / §3.1 编码上下文加载 |
| `specs/requirements/REQ-*.md` | 已有模块的需求规格（逆向） | §2.2 界定新旧功能边界 |

**条件加载规则**：后续阶段（§2/§3）检查 `.project/reverse-scan/` 是否存在。存在则加载对应产出作为参考，不存在则跳过（不影响流程）。

**更新规则**：
- Skill 仅在 §1.2 初始化时调用一次，产出为快照，编码过程中不回写更新
- 如需全量重新扫描 → 用户说"重新扫描"，AI 备份后重新调用 Skill

---

## §1.5 技术文档处理规则（.docs/）

> **流程声明**
> - phase: init
> - step: 5/5
> - prev: none
> - next: none
> - gate: none
> - blocking: false

> **章节性质**：规则性章节（非线性流程步骤）。被 §1.1 / §1.2 在扫描 `.docs/` 时引用，§2.3 / §3.3 / §3.5 在加载文档时引用。AI 按需读取本节规则执行扫描与解析，执行完毕后返回调用方继续原有流程，不产生阶段跳转。

用户将文档放入项目根目录 `.docs/` 的对应子目录：

- `.docs/prd/` — PRD 需求文档
- `.docs/tech/` — 技术文档（API 文档、建表脚本、中间件配置、对接手册等）

文件格式和命名不限，可以多个文件也可以全部放一个文件。

**何时扫描**：

- §1.1 / §1.2 项目初始化时 → `.docs/` 存在则自动扫描全部文件
- 用户说"文档更新了" / ".docs 有新文件" / "我加了文档" → 重新扫描
- §2.3 方案设计时 → 读取当前模块相关内容
- §3.5 代码变更时 → 读取当前模块相关内容

**怎么扫描**：

1. 按子目录分类处理：
   - `.docs/prd/` → **全部文件均为需求内容**，不区分格式，统一扫描（见下方「PRD 内容扫描」）
   - `.docs/tech/` → 走技术文档流程（识别 API 接口 / 数据库结构 / 中间件配置 / 其他）
   - `.docs/` 根下的文件（兼容旧结构）→ AI 按内容自动判断：含 PRD 特征（需求描述/用户故事/功能清单）走 PRD 流程，否则走技术文档流程，同时提示用户归入对应子目录
2. 技术文档在 project-profile.md「外部依赖」区块建立索引（内容摘要 + 来源文件路径）

**PRD 内容扫描**（`.docs/prd/` 统一处理规则）：

`.docs/prd/` 下所有文件均为**需求的唯一真相源**，AI 按格式自动解析：

| 文件格式 | 解析方式 |
|---------|---------|
| md/txt | 直接读取文本，提取需求描述/业务流程/验收标准 |
| pdf | 读取内容，提取需求描述/业务流程/验收标准 |
| png/jpg/jpeg/webp/svg | AI 视觉分析，提取：页面布局结构、UI 组件（类型+状态+字段）、交互线索（跳转/流程/标注）、视觉规范（颜色/字号/间距/圆角）、数据字段（表单字段名/列表列名） |

解析后统一处理：

1. **建索引**：所有文件写入 project-profile.md「PRD 内容索引」区块：
   ```
   ## PRD 内容索引
   > 以下从 .docs/prd/ 解析，设计和编码时必须以 PRD 内容为准

   | 文件 | 格式 | 对应页面/功能 | 内容摘要 |
   | --- | --- | --- | --- |
   | .docs/prd/{文件名} | {md/png/pdf/...} | {页面名/功能名} | {核心内容：业务逻辑 / 布局+组件+交互 / 字段清单} |
   ```

2. **图片解析落入 REQ**：图片解析出的结构化信息（布局/组件/字段/交互/状态），在 §2.2 写 REQ 时直接写入验收标准的「UI 需求」部分（不仅是索引摘要）

3. **后续阶段加载方式**：各阶段通过索引定位源文件，**重新读取原始文件**（不依赖记忆），各阶段自行定义使用规则

**怎么用**：

- 涉及外部 API → 接口路径、参数、响应格式、认证方式**必须以 `.docs/` 中的文档为准**，禁止编造
- 涉及数据库 → 表结构、字段类型、索引**必须以 `.docs/` 中的文档为准**
- 涉及中间件 → 配置方式、连接参数**必须以 `.docs/` 中的文档为准**
- `.docs/` 中未提及的内容视为无外部文档约束，按现有规则链处理（project-profile.md > context 文件 > Skill 规范 > 内置规约），不询问用户补充文档

**索引格式**（写入 project-profile.md「外部依赖」区块）：

```
## 外部依赖（API 学习记录）
> 以下信息从 .docs/ 自动提取，编码时必须以 .docs/ 原始文档为准

- {能力描述}（来源：.docs/{文件名} #{章节，如有}）
- {能力描述}（来源：.docs/{文件名}）
```
