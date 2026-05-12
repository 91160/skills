# §2 需求与设计

> 本文件在需求分析、方案设计、评审阶段加载。完成后进入 `{SKILL_DIR}/rules/phase-coding.md`（§3）。
>
> 本文件所有 §N.N 章节顶部均带有「流程声明」引用块，AI 进入任何章节前必须先读声明头。

---

## §2.1 任务拆分（项目初始化后执行一次，后续按需调整）

> **流程声明**
> - phase: spec
> - step: 1/7
> - prev: §1.3 前后端规范提取（新项目）/ §1.4 深度业务代码扫描（旧项目 feature）
> - next: §2.2 需求分析
> - gate: none
> - blocking: true

**触发时机**：

- §1.1 新项目初始化完成后 → 自动进入，全量模块排序 + 拆分
- §1.2 旧项目新增需求（仅 feature 类型）→ 全量模块排序 + 拆分（与新项目一致）
- 用户主动要求重新规划时
- bug / refactor 类型 → **跳过 §2.1**，直接进入 §2.2

**已有代码认知加载**（`.project/reverse-scan/` 存在时执行，不存在则跳过）：

读取 `.project/reverse-scan/module-map.md`，了解已有模块划分和依赖关系。任务拆分时判断：
- 新需求的功能点归入已有模块 → index.md 只建该功能的条目，不为已有模块重复建条目
- 新需求需要新建模块 → index.md 正常新建，参考 module-map.md 的依赖关系确定 dev-order
- 新需求跨越多个已有模块 → 按涉及的已有模块拆分子任务，每个子任务引用对应的逆向 DES 作为上下文

**模块编号续接规则**：若 `.project/reverse-scan/module-map.md` 已存在，新模块编号从已有最大编号 +1 续编（如已有 M-01~M-05，新模块从 06 开始）。REQ/DES 文件编号与模块编号一致。

**Step 1：模块排序**

AI 读取 index.md，分析模块间依赖关系，按「P0 > P1 > P2，同优先级按依赖关系」排序，输出开发计划。仅 1 个模块时输出「仅 1 个模块，无需排序」，跳过用户确认直接进入 Step 2：

```
【开发计划】
  第 1 轮：{编号}-{模块名}（{优先级}，无依赖）
  第 2 轮：{编号}-{模块名}（{优先级}，依赖 {编号}）
  第 3 轮：{编号}-{模块名}（{优先级}，依赖 {编号}）
  ...
  可并行：{编号} 与 {编号}（无相互依赖）
请确认或调整顺序。
```

**Step 2：模块内拆子任务**

用户确认排序后，对**所有模块**按以下维度拆分：

| 维度     | 拆分粒度                  | 示例                  |
| -------- | ------------------------- | --------------------- |
| 数据层   | 每张表/迁移脚本一个子任务 | 用户表设计 + 迁移脚本 |
| 后端接口 | 每个 API 一个子任务       | POST /api/auth/login  |
| 前端页面 | 每个页面/组件一个子任务   | 登录页表单组件        |
| 联调     | 前后端对接一个子任务      | 登录流程联调          |

逐模块输出，所有模块输出完毕后**统一请用户确认**（不逐模块等确认）：

```
【模块 {编号}-{模块名} 子任务拆分】
  {编号}-1. [数据层] {描述}
  {编号}-2. [后端] {API路径} {描述}
  {编号}-3. [前端] {页面/组件} {描述}
  {编号}-4. [联调] {描述}
预计子任务数：{N}

... （所有模块依次列出）

以上为全部模块的子任务拆分，总计 {总子任务数} 项。
请确认或调整。
```

**Step 3：写入 index.md + task.md**

用户确认后：

- index.md 填入 `depends` 和 `dev-order` 列的值，记录依赖关系和开发顺序，`sync-status` 初始化为 `pending`，`coding-skill` 和 `audit-skill` 均初始化为 `pending`
- 全量子任务写入 `.project/task.md`，格式见下方 task.md 结构
- 首轮模块的子任务同时写入对应 REQ 文件，作为验收清单的一部分
- 补充 `.outdocs/project-overview.md` 的「四、技术架构」「五、模块结构与开发计划」部分（已有章节保留不覆盖，仅补充空缺章节；数据来源：project-profile.md 技术栈 + frontend-context.md + backend-context.md + index.md 模块列表与依赖关系 + 实际代码目录结构，模板见 {SKILL_DIR}/templates/project-overview.tpl.md）
- 新项目：将 `.outdocs/project-overview.md` 的「二、业务架构」「三、核心业务流程」回写到 project-profile.md「一、项目级」对应区块（此时需求已澄清、模块已确认，沉淀为持久化的业务上下文，后续编码 §3.1 可加载）
- **更新 context.md**：追加一条记录 `{日期} 任务拆分完成（{N} 个模块，{M} 项子任务，执行模式: {连续/逐个确认}）— last: §2.1 任务拆分（下次进入 §2.2 需求分析）`

**task.md 结构**：

```markdown
# Task Board

> 状态：pending → in-progress → done

## 模块总览
| 模块 | 总任务 | done | in-progress | pending |
| --- | --- | --- | --- | --- |
| 01-用户认证 | 4 | 0 | 0 | 4 |
| 02-订单管理 | 5 | 0 | 0 | 5 |

## 01-用户认证 [pending]
| ID | 类型 | 描述 | status | 备注 |
| --- | --- | --- | --- | --- |
| 01-1 | 数据层 | 用户表设计+迁移 | pending | |
| 01-2 | 后端 | POST /api/auth/login | pending | |
| 01-3 | 前端 | 登录页表单 | pending | |
| 01-4 | 联调 | 登录流程联调 | pending | |

## 02-订单管理 [pending]
...
```

**task.md 状态流转规则**：

- 模块状态取决于子任务：任一 in-progress → 模块 `[in-progress]`，全部 done → 模块 `[done]`
- 模块总览表的计数随子任务状态变更实时更新

**Step 4：选择执行模式**

仅 1 个模块时跳过此步（无需选择）。2 个以上模块时询问用户：

```
【执行模式】
请选择模块开发的推进方式：
  A. 连续模式：按 dev-order 自动连续执行所有模块，中间不暂停
  B. 逐个确认模式：每个模块完成后询问是否继续下一个（默认）
```

用户选择后记录到 context.md，后续归档时按此模式处理。用户可随时说"切换为连续模式"或"切换为逐个确认模式"变更。

---

## §2.2 需求分析

> **流程声明**
> - phase: spec
> - step: 2/7
> - prev: §2.1 任务拆分（feature 首次）/ §1.4 深度业务代码扫描（旧项目 bug、refactor）/ §4 归档（feature 连续模式下一模块）
> - next: §2.3 方案设计
> - gate: none
> - blocking: true

根据 G0.1 确定的任务类型，使用对应的 REQ 模板。feature 类型且 task.md 已有当前模块的子任务清单时，以 task.md 中的子任务作为 REQ 验收清单的输入：

**A/B. 新增需求（feature）**：

0. **已有代码认知加载**（`.project/reverse-scan/` 存在时执行，不存在则跳过）：
   读取当前模块相关的知识卡片和 `.project/reverse-scan/specs/requirements/REQ-*.md`，了解该区域已有功能和验收标准。写 REQ 时精确界定"新增"和"已有"的边界，避免将已有功能重复纳入新 REQ。

1. **PRD 内容加载**（写 REQ 前必须执行）：
   查 project-profile.md「PRD 内容索引」，定位当前模块对应的 `.docs/prd/` 文件，**全部读取**（文本直接读，图片 AI 视觉分析，PDF 读内容）。从 PRD 内容中提取：
   - 业务逻辑：正常流程 + 异常场景 + 边界条件
   - UI 需求（PRD 含视觉内容时）：字段清单（名称/类型/必填/校验）、交互行为（按钮→动作→结果）、页面状态（加载中/空/错误/成功）
   - 数据需求：字段来源、展示格式、排序/筛选规则
   PRD 中明确的内容 → 直接写入验收标准；PRD 中模糊的内容 → 纳入下方澄清问题清单
2. AI 读取需求，初步理解功能意图
3. **AI 主动澄清（必须执行）**：

```
【需求澄清】
我理解这次要做 {功能名}，但有以下几点需要确认：
  1. {不清晰的地方}
  2. {边界不明确的地方}
  3. {可能有多种实现方式需要选择的地方}
请确认后继续。
```

> 注：项目级 PRD 审计已在 §1.1 / §1.2 / §2.6 执行，此处不重复。§2.2 聚焦模块级需求澄清和验收标准确认。

4. 用户补充说明后，AI 确认验收标准
5. 验收标准必须具体，不接受模糊描述（如"功能正常"）
6. 写入 REQ：需求描述、验收标准（含从 PRD 视觉内容提取的 UI 需求），文件头部标记 `review-status: draft`
7. **REQ 自审**：按 {SKILL_DIR}/rules/quality-standards.md 中 REQ 审计标准逐项自审，不通过项当场修复。**自审循环上限**：单项修复超 3 次仍未通过 → 触发 G2 停车信号（可能需要人工澄清需求边界）
8. **更新 context.md**：追加一条记录 `{日期} {模块名} REQ 完成（review-status: draft，待评审）— last: §2.2 需求分析（下次进入 §2.3 方案设计）`

**C. Bug 修复（bug）**：

1. **AI 主动收集 Bug 信息（必须执行）**：

```
【Bug 定位】
请确认以下信息：
  1. 复现步骤？
  2. 预期行为 vs 实际行为？
  3. 影响范围（哪些模块/用户受影响）？
  4. 严重程度：P0紧急 / P1重要 / P2一般？
```

2. AI 确认验收标准（Bug 修复后预期行为 + 不引入回归）
3. **受影响模块定位**（index.md 存在且有模块条目时执行，否则跳过）：
   从 index.md 定位 Bug 所属的已有模块编号和名称，写入 REQ 头部 `affected-module: {编号}-{模块名}`。如 Bug 跨多个模块，列出所有受影响模块。
4. 写入 REQ：复现步骤、预期vs实际、影响范围、严重程度、验收标准、受影响模块，文件头部标记 `review-status: draft`
5. **REQ 自审**：按 {SKILL_DIR}/rules/quality-standards.md 中 REQ 审计标准逐项自审，不通过项当场修复。**自审循环上限**：单项修复超 3 次仍未通过 → 触发 G2 停车信号（可能需要人工澄清需求边界）
6. **更新 context.md**：追加一条记录 `{日期} Bug-{描述} REQ 完成（review-status: draft，待评审，affected-module: {编号}-{模块名}）— last: §2.2 需求分析（下次进入 §2.3 方案设计）`
7. 仅涉及样式/文案的 Bug，进入开发时走快速通道

**D. 技术优化（refactor）**：

0. **已有代码认知加载**（`.project/reverse-scan/` 存在时执行，不存在则跳过）：
   读取优化目标区域相关的知识卡片（函数级业务语义 + 调用关系）和 `.project/reverse-scan/call-graph.md`，了解当前代码结构、调用链路和依赖关系。写 REQ 时精确定义"优化什么"和"不改什么"的边界。

1. **AI 主动确认优化目标（必须执行）**：

```
【优化目标确认】
请确认以下信息：
  1. 优化什么？（具体目标）
  2. 不改什么？（业务行为不变的边界）
  3. 如何验证？（怎么证明优化有效且无回归）
```

2. AI 确认验收标准（优化指标 + 回归验证方式）
3. **受影响模块定位**（index.md 存在且有模块条目时执行，否则跳过）：
   从 index.md 定位重构涉及的已有模块编号和名称，写入 REQ 头部 `affected-module: {编号}-{模块名}`。如跨多个模块，列出所有受影响模块。
4. 写入 REQ：优化目标、不变边界、验证方式、验收标准、受影响模块，文件头部标记 `review-status: draft`
5. **REQ 自审**：按 {SKILL_DIR}/rules/quality-standards.md 中 REQ 审计标准逐项自审，不通过项当场修复。**自审循环上限**：单项修复超 3 次仍未通过 → 触发 G2 停车信号（可能需要人工澄清需求边界）
6. **更新 context.md**：追加一条记录 `{日期} Refactor-{描述} REQ 完成（review-status: draft，待评审，affected-module: {编号}-{模块名}）— last: §2.2 需求分析（下次进入 §2.3 方案设计）`
7. AI 判断是否涉及多步骤，如涉及则拆子任务并写入 task.md，询问用户确认：

```
【任务管理确认】
本次技术优化涉及多个步骤：
  1. {步骤描述}
  2. {步骤描述}
  3. {步骤描述}
是否创建 task.md 跟踪进度？
  A. 是（创建子任务，按步骤推进，每步完成后回到门禁自检）
  B. 否（AI 一次性完成所有步骤，不做子任务级跟踪，进度记录在 context.md）
```

用户选 B 时：AI 按 REQ 中列出的步骤顺序执行，不创建 task.md，§3.8 更新 task.md 跳过。完成后直接进入 §4 归档。

---

## §2.3 方案设计

> **流程声明**
> - phase: spec
> - step: 3/7
> - prev: §2.2 需求分析
> - next: §2.4 原型生成（feature 含前端）/ §2.5 评审（其他）
> - gate: none
> - blocking: false

**PRD 内容加载**（写 DES 前必须执行）：

重新读取当前模块对应的 `.docs/prd/` 文件（通过 project-profile.md「PRD 内容索引」定位，**实际读取原始文件，不依赖记忆**）。DES 的每个维度必须能追溯到 PRD 内容：
- 数据模型 → 从 PRD 业务描述和 UI 字段推导
- API 定义 → 从 PRD 交互流程推导
- 核心流程 → 从 PRD 正常+异常路径推导
- 状态管理 → 从 PRD 页面状态推导
- 权限矩阵 → 从 PRD 角色/操作描述推导

PRD 含视觉内容时，DES 前端部分须额外覆盖：
- 页面布局结构（与 PRD 视觉内容对齐）
- 组件选择（按 PRD 中的 UI 元素匹配组件库组件）
- 交互还原方案（跳转路径/动画/反馈与 PRD 一致）
- 偏离 PRD 视觉内容处**必须标注原因**

**已有代码认知加载**（`.project/reverse-scan/` 存在时执行，不存在则跳过）：

DES 编写前，加载当前模块相关的深度扫描产出（§1.4 产出）：
- **知识卡片**：从 `.project/reverse-scan/knowledge-cards/` 中读取当前模块涉及的文件知识卡片，精确匹配可复用的已有函数（到 类名.方法名 级别），写入 DES「复用能力」清单
- **逆向 DES**：从 `.project/reverse-scan/specs/design/DES-*.md` 中读取相关模块的 DES，了解已有技术方案和核心流程，确保新设计与已有逻辑一致
- **调用关系图**：从 `.project/reverse-scan/call-graph.md` 中定位当前模块的调用链路，确保新 API 不与已有接口重复
- **数据库结构**：从 `.project/reverse-scan/db-schema.md` 中读取相关表结构，确保新数据模型不与已有表冲突

**项目上下文加载**：

先读取 project-profile.md「业务架构」「业务流程」（仅旧项目有），以及按改动类型读取对应 context 文件（前端 → frontend-context.md；后端 → backend-context.md）的「项目架构」「构建与运行」「内部公共能力」，确保方案与现有架构模式、数据库访问方式、路由注册方式一致，且不破坏现有业务流程。然后根据任务类型，使用对应的 DES 模板，写入 `.project/specs/master/design/DES-{xx}-{name}.md`：

> DES 达标标准：读完 DES 即可编码，无需猜测。涉及的维度必须覆盖，不涉及的标注「不涉及」或跳过。

| 任务类型           | DES 内容                                       |
| ------------------ | ---------------------------------------------- |
| **feature**  | 技术方案、数据结构、接口设计、影响范围         |
| **bug**      | 根因分析、修复方案（按涉及层列出：数据层/接口层/UI层，如有）、影响范围、回归风险、受影响 Spec 变更清单 |
| **refactor** | 重构方案、改动前后对比、影响范围、回归验证计划、受影响 Spec 变更清单 |

**bug / refactor 类型「受影响 Spec 变更清单」**（REQ 头部有 `affected-module` 时必须填写）：

列出受影响模块的已有 DES 中哪些部分需要在完成后同步更新：

| 维度 | 检查方式 |
| ---- | -------- |
| 核心流程 | 是否改变了正常/异常路径的处理步骤 |
| 异常处理 | 是否新增/修改/删除了异常分支 |
| API 定义 | 是否改变了请求参数/响应格式/错误码/校验规则 |
| 状态管理 | 是否改变了状态流转条件 |
| 数据模型 | 是否涉及字段/约束/索引变更 |

涉及 API 行为变更时，DES 中必须列出变更后的 API 定义（路径/参数/响应/错误码），以便 §3.10 Spec 状态同步时更新 api-doc.md。

**feature 类型须覆盖以下维度**：

| 维度     | 必须明确                      |
| -------- | ----------------------------- |
| 数据模型 | 完整字段定义（名/类型/约束）  |
| API 定义 | 路径/方法/参数/响应/错误码    |
| 核心流程 | 正常+异常路径，节点有输入输出 |
| 状态管理 | 状态枚举+流转条件（如涉及）   |
| 权限矩阵 | 角色-资源-操作（如涉及）      |
| 复用能力 | 本次任务使用的内部公共能力清单（从 profile 匹配，含 import 路径和调用方式），未匹配到的需求才新建 |
| UI 还原 | PRD 含视觉内容时必须覆盖：页面布局/组件选择/交互还原/字段映射/状态展示，偏离处标注原因（不涉及前端则标注「不涉及」） |

**接口文档自动生成**（DES 含 API 定义时，不限任务类型）：

DES 完成后，从 DES 的 API 定义部分自动提取，以模块章节形式追加或更新到 `.outdocs/api-doc.md`（新增 API → 追加；变更已有 API → 更新对应章节）。DES 中 API 定义变更时（§2.6 Spec Sync），同步更新对应模块章节。

**DES 自审**（DES 写完后立即执行，不等到 §2.5）：文件头部标记 `review-status: draft`，AI 按 {SKILL_DIR}/rules/quality-standards.md 中 DES 审计标准逐项自审，不通过项当场修复后再进入 §2.4 原型生成。避免 DES 有问题时原型白做。**自审循环上限**：单项修复超 3 次仍未通过 → 触发 G2 停车信号（可能需要人工澄清方案边界）。

**更新 context.md**：DES 自审通过后，追加一条记录 `{日期} {模块名} DES 完成（review-status: draft，待评审）— last: §2.3 方案设计（下次进入 §2.4 原型生成 或 §2.5 评审）`。确保对话中断后可从 context.md 恢复当前进度。

---

## §2.4 原型生成（仅 feature 类型且涉及前端页面时执行）

> **流程声明**
> - phase: spec
> - step: 4/7
> - prev: §2.3 方案设计
> - next: §2.5 评审
> - gate: none
> - blocking: true

> **触发条件**：仅当本次任务类型 = feature **且**涉及前端页面时执行；bug / refactor / 纯后端 feature 跳过本节（不视为流程违规），跳过时在 §2.5 「上节产物回灌」段中标注 `prev=§2.3，本节跳过原因：{bug / refactor / 纯后端 feature}` 即可。一旦触发条件满足，blocking=true，跳过 = 流程错误（违反 G2 路由不确定信号），执行自审会回滚到本节重做。

> **「涉及前端」客观判据（三条满足任一即视为涉及前端，AI 不得自行判定为"纯后端"）**：
> 1. DES（`.project/specs/master/design/DES-*.md`）含「前端方案」/「UI 设计」/「页面结构」/「组件」/「路由」等章节标题或关键字
> 2. task.md 当前模块的子任务清单中含「前端」/「页面」/「组件」/「联调」类型条目
> 3. project-profile.md「技术栈」声明含前端框架（Vue / React / Angular / Svelte / WAP / 小程序 / Flutter Web 等）且本次任务范围未明确限定为"仅后端"
>
> 三条均不满足时方可标注"纯后端 feature 跳过"。AI 必须在 §2.5 回灌段中**列出三条判据的检查结果**作为可见凭证。

**产出位置**：`.project/specs/master/prototypes/{模块编号}-{模块名}/`

**产出物**（所有模块必须产出 `prototype-spec.md`；HTML 线框图仅在 PRD 无任何视觉内容时生成）：

| 产出 | 生成条件 |
|---|---|
| `prototype-spec.md` | 所有情况都生成（整合基准来源 + 交互流程 + 页面结构） |
| `{页面名}.html` | 仅当 .docs/prd/ 无任一视觉内容时生成 |

**HTML 线框图生成条件**（三类视觉内容均缺失时才生成）：

- □ 无 `.docs/prd/prototype/` 或为空 + 根目录无原型图类图片
- □ 无 `.docs/prd/ui/` 或为空 + 根目录无 UI 设计稿类图片
- □ 无 `.docs/prd/ui-spec/` 或为空 + 根目录无 UI 解析 md

→ 三项都满足 → 从 DES 前端方案生成 HTML 线框图
→ 任一视觉内容存在 → 跳过 HTML 生成（避免冗余），只产出 prototype-spec.md

> **"无任一视觉内容"判断范围**：指 `.docs/prd/` 根目录 + 三个子目录合计，无任何 png/jpg/jpeg/pdf/svg/webp/md（非需求类）文件。

**prototype-spec.md 内容结构**：

```markdown
# {模块编号}-{模块名} 原型规格

## 基准来源（按页面粒度标注）

| 页面 | 基准类型 | 基准文件 | 优先级 |
| --- | --- | --- | --- |
| {页面名} | UI 解析 md | .docs/prd/ui-spec/{文件名}.md | 1 |
|         | UI 设计稿 | .docs/prd/ui/{文件名}.png | 2（补充视觉细节） |
|         | 原型图 | .docs/prd/prototype/{文件名}.png | 3（流程参考） |
| {页面名} | HTML 原型 | ./{页面名}.html | 4（PRD 无视觉稿时 AI 生成） |

> **优先级对应关系**：本表仅列出 prototype-spec.md 可能列的基准类型（页面级 1~4 级）。
> 编码时完整的 UI 基准优先级（含 5. DES 方案 / 6. frontend-context 样式体系）见 §3.1.4。
> 本表优先级 1~4 与 §3.1.4 优先级 1~4 一一对应。
> 同一页面可有多个来源，按优先级递进使用（高优先级为主，低优先级为补充）。

## 交互流程图
（整合各页面跳转/动作/状态切换路径）

## 页面结构说明

### {页面名}
- **基准**：（见上方基准来源表中该页面条目）
- **区域划分**：{从最高优先级基准提取的区域布局}
- **组件清单**：{输入框×N / 按钮×N / 表格 / 弹窗 / ...}
- **页面状态**：{默认 / 加载中 / 空状态 / 错误 / 成功}
- **交互/校验**：{按钮动作 / 字段校验规则 / 错误文案}（从 PRD 文字描述 + DES 推导）
- **对应 DES**：DES-{xx} > {章节名}
- **对应 PRD**：{关联的 PRD 文字需求章节}
```

**PRD 含视觉内容时的整合原则**：
- 优先以 UI 解析 md 的精确参数为主，UI 设计稿作为视觉细节补充
- 原型图提供交互流程（PRD 文字未覆盖时）
- prototype-spec.md 不复制视觉稿内容，只做**结构化索引 + 推导出的交互/状态/校验信息**

**PRD 无视觉内容时的 HTML 生成原则**：
- 以 DES 前端方案为依据，生成低保真 HTML 线框图
- 每个页面一个 HTML 文件
- prototype-spec.md 的"基准来源"列标注为"HTML 原型"（优先级 4）

**出口产物 schema（强制）**：

§2.4 完成后必须产出以下文件，§2.5 进入时按 gated 规约回灌校验：

| 产物 | 路径 | 校验点 |
|---|---|---|
| 原型规格 | `.project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md` | 文件存在；含 `# {模块编号}-{模块名} 原型规格` 一级标题；含「## 基准来源」「## 交互流程图」「## 页面结构说明」三个二级标题；至少 1 个页面条目 |
| HTML 线框图（条件性） | `.project/specs/master/prototypes/{模块编号}-{模块名}/*.html` | 仅 PRD 无任何视觉内容时生成；存在时每个页面一个文件 |

**更新 context.md**：prototype-spec.md 生成完成后，追加一条记录：

```
{日期} {模块名} 原型规格完成（{HTML 已生成 / 跳过 HTML（已有视觉内容）}）— last: §2.4 原型生成（下次进入 §2.5 评审）
produced: .project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md {SHA-256 前 8 位}
```

> `produced` 字段为 blocking=true 章节的强制字段（见 AGENTS.md「编号与流程声明规约」第 7 条 + G0.4 状态恢复）。哈希通过 `shasum -a 256 <文件路径> | cut -c1-8` 计算。

> bug / refactor 类型 → 跳过此步，直接进入 §2.5 评审；context.md 不写入 produced 字段，在 §2.5 回灌段中标注跳过原因。

---

## §2.5 评审（人工）

> **流程声明**
> - phase: spec
> - step: 5/7
> - prev: §2.4 原型生成（feature 含前端）/ §2.3 方案设计（bug、refactor 或纯后端 feature）
> - next: §2.7 功能测试用例设计
> - gate: none
> - blocking: gated

**【上节产物回灌】（gated 章节强制，进入 §2.5 时立即输出）**

声明头之后必须立即输出以下回灌段，否则违反凭证，开局自审会回滚到 §2.4 重做：

- **若 prev = §2.4（feature 含前端）**：
  ```
  执行 Bash: ls .project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md \
            && head -30 .project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md \
            && shasum -a 256 .project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md | cut -c1-8
  粘贴实际输出：
  """
  <工具回显原文，含路径、标题、3 个二级标题、SHA-256 前 8 位>
  """
  本节输入承诺：基于上述 prototype-spec.md 中页面清单 [{页面名 1, 页面名 2, ...}] 进行评审，重点核对基准来源准确性与交互流程完整性。
  ```
  → 校验：文件存在 + 含 3 个必备二级标题 + 哈希与 context.md `produced` 字段一致。任一不通过 → 回滚 §2.4。

- **若 prev = §2.3（bug / refactor / 纯后端 feature）**：
  ```
  本节跳过 §2.4 回灌，原因：{bug / refactor / 纯后端 feature}（任务类型 = {feature/bug/refactor}）
  
  「涉及前端」客观判据三条检查结果（feature 类型必填）：
    1. DES 含前端方案章节？{✅ / ❌ 检查文件：path:line}
    2. task.md 当前模块子任务含前端 / 页面 / 组件 / 联调？{✅ / ❌ 检查文件：path:line}
    3. project-profile.md 技术栈含前端框架？{✅ / ❌ 检查文件：path:line}
  
  三条均 ❌ → 确认"纯后端"，跳过合法
  任一 ✅ → 实际涉及前端，跳过 §2.4 视为越界违规，回滚到 §2.4 重做
  
  本节输入承诺：基于 REQ + DES 进行评审，无原型规格输入。
  ```
  > **双重校验**：bug / refactor 任务类型直接通过判据；feature 任务必须完整填写三条结果。AI 不得简化为"feature 但纯后端"一句话——必须有 path:line 证据。

- 人工确认方案和原型
- 不通过 → AI 根据反馈修改，重新设计
- 通过 → AI 在对应 REQ + DES 文件头部标记 `review-status: approved`
- **更新 context.md**：追加一条记录 `{日期} {模块名} 评审通过（review-status: approved）— last: §2.5 评审（下次进入 §2.7 功能测试用例设计）`
- 进入 §2.7 功能测试用例设计

---

## §2.7 功能测试用例设计（feature/bug/refactor 均执行）

> **流程声明**
> - phase: spec
> - step: 7/7
> - prev: §2.5 评审
> - next: §3.0 通道判断
> - gate: none
> - blocking: true

> **blocking=true 理由**：§2.7 产出的 TC-F-*.md 是 §3.6 代码审计 S-08 功能完整性检查的输入。跳过 §2.7 → §3.6 S-08 失效 → 编码完成但场景覆盖未验证。**Skill 缺失场景的兜底**：仍要写入手工 TC-F 大纲（至少列出 P0 场景的预期行为），文件存在但内容简略不视为违规；触发 G2 由用户决定是否真跳过。

**`.test-env.md` 按需生成 + 自动检测**（调用 test-case-design Skill 前必须完成）：

§2.7 是首次消费 `.test-env.md` 的章节，进入时**按以下流程确保配置完整可用**：

1. **检查文件**：`ls .test-env.md`（项目根）
2. **文件不存在 → 创建 + 自动扫描**：
   - Read 权威模板：`{SKILL_DIR}/tools/test-case-design/references/test-env-template.md` 的「## 一、完整模板」代码块
   - 按下方"配置字段检测来源参考表"逐字段扫描项目实际配置
   - 用真实值替换模板默认值；AI 确实无法检测的字段保留模板默认值并标注 `  # TODO 用户填写`
   - 写入项目根 `.test-env.md`
3. **文件已存在 → 检查 TODO 字段**：
   - `grep '# TODO' .test-env.md`
   - 有 TODO → 按上方检测表针对仍为 TODO 的字段扫描补全
4. **vars 类账号字段无法自动检测时**：触发 G2 停车询问用户（详见下方"用户决策路径"）

**配置字段检测来源参考表**：

| 字段类别 | 检测来源 | 示例 |
|---|---|---|
| `test_db.type` / `test_db.dsn` | `application.yml` / `application.properties` / `.env` / `docker-compose.yml`；后端 `package.json` 依赖（pg / mysql2 / better-sqlite3 等） | MySQL / PostgreSQL / SQLite |
| `test_commands.frontend` | 前端 `package.json` 的 `scripts.test`（`pnpm-lock.yaml` → pnpm test；`yarn.lock` → yarn test；否则 npm test）| `npm test` / `pnpm test` / `yarn test` |
| `test_commands.backend` | `pom.xml` → mvn test；`build.gradle` → gradle test；`go.mod` → go test ./...；`pyproject.toml` / `setup.py` → pytest | `mvn test` / `gradle test` / `go test` |
| `test_dirs.frontend_unit` | Glob `src/**/__tests__` / `**/*.test.{ts,js}` / `**/*.spec.{ts,js}` 取最常见 | `src/__tests__` / `tests/` |
| `test_dirs.backend_unit` | Java `src/test/java`；Go 与源码同目录 `*_test.go`；Python `tests/` | `src/test/java` / `tests/` |
| `base_url.local` | 后端启动配置（`server.port` / `package.json start` 端口）；`.docs/tech/` API 文档 | `http://localhost:8080` |
| `MCP 能力声明` | 当前 AI 工具能力（Claude Code 通常 `shell`；其他能力按实际 MCP 装载情况） | shell / http-client / sql-runner / playwright |
| `vars.*` | **AI 不自动填写**（账号密码不应推测）→ 留 TODO，进入"用户决策路径" | — |

**用户决策路径（仅 vars 类字段无法自动检测时触发）**：

```
【G2 停车 - .test-env.md vars 字段需用户决策】
已自动检测并填充以下字段：
  · test_db: {自动填值} ✅
  · test_commands.frontend/backend: {自动填值} ✅
  · test_dirs.*: {自动填值} ✅
  · base_url.local: {自动填值} ✅
  · MCP 能力声明: {自动填值} ✅

但以下账号类字段 AI 无法自动检测：
  · vars.test_user / vars.test_password: 需用户填写实际测试账号
  · 其他 vars.*: ...

请选择：
  A. 我现在编辑 .test-env.md 填好 vars 后回复"填好了"继续（完整测试模式，推荐）
  B. 跳过这些字段（涉及登录测试的用例会自动降级为 manual 或被 Skill 跳过）
  C. 取消本次 §2.7
```

完成上述按需生成 + 检测后，才进入下方 Skill 调用流程。

**调用 test-case-design Skill**：读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程安装并调用。

> 用户也可显式运行 `/sdd-test-case` 触发本步。

**输入**：当前模块的 REQ（approved）+ DES（approved）+ PRD 内容（通过 PRD 内容索引定位）

**SDD 模式参数**：
- `task_type`：从 G0.1 类型映射获取（feature/bug/refactor）
- `output_dir`：`.test/testcases/`
- `csv_template`：`both`（同时输出 detailed + traditional）

> 不传 `channels_filter`——Skill 只支持 3 个功能测试 channel（manual/ui-dom/ui-visual），纯后端项目 Skill 内部自行判断不产出 UI 用例。

**产出**：

```
.test/testcases/
├── TC-F-{模块}-{功能}.md                    ← 功能测试用例文档（按模块分文件）
├── testcases.detailed.csv                   ← CSV 详细版（全局汇总，所有模块追加到同一份）
└── testcases.traditional.csv                ← CSV 传统版（全局汇总，所有模块追加到同一份）
```

> CSV 为全局汇总文件：首次生成时写入表头 + 数据行，后续模块追加数据行（不重复表头）。CSV 的 Module 列标识所属模块。

**用途**：
- QA 手工执行功能测试
- 导入禅道/飞书测试管理平台（CSV 导出）
- 未来 E2E Skill 的输入（§4 全部模块归档后执行）
- §3.1 编码时加载参考（了解"代码需要支持哪些功能场景"，TDD 思路）
- §3.6 代码审计 S-08 功能完整性检查（对照 TC 的 P0/P1 场景检查代码是否有对应实现）

**Skill 文件缺失处理**：Skill 缺失时**不直接跳过**——AI 兜底产出**手工 TC-F 大纲**（至少含 P0 场景的预期行为，结构简化版亦可），写入 `.test/testcases/TC-F-{模块}-{功能}.md`，并触发 G2 停车请用户决定（A. 接受简化版继续 / B. 用户补全后继续 / C. 跳过本节，由用户书面确认风险）。任何决策都必须在 context.md 写入 produced（即便简化版亦计为产物）。

**更新 context.md**：产出完成后，追加一条记录 `{日期} {模块名} 功能测试用例设计完成（{N} 条用例）— last: §2.7 功能测试用例设计（下次进入 §3.0 通道判断）`

---

## §2.6 Spec Sync（人工批注同步 & 需求变更）

> **流程声明**
> - phase: spec
> - step: 6/7
> - prev: none
> - next: none
> - gate: none
> - blocking: true

> **章节性质**：横切动作章节（非线性流程步骤）。用户可在任意阶段（§1~§4）触发，AI 识别触发源后按本节流程处理 spec 一致性和需求变更。执行完毕后返回触发时所在的阶段继续原有流程，不改变阶段路由。

> **返回机制**（执行完毕后的回归策略）：
> 1. AI 读取 `.project/context.md` **倒数第二条记录**（Spec Sync 触发前的最后状态）的 `last` 字段
> 2. 按该 `last` 字段定位返回的章节，继续原流程
> 3. 若倒数第二条记录不存在或无 `last` 字段 → 询问用户返回哪个阶段
> 4. Spec Sync 本次执行的 `last: §2.6` 记录保留在 context.md 末尾作为留痕，不作为下次状态恢复的起点

用户可随时触发 specs 同步。AI 识别触发源后走统一流程。

> 用户也可显式运行 `/sdd-prd-change` 触发本步（专对 PRD 变更，触发源标签 `[prd]`）。其他触发源（specs / tech）目前仅自然语言入口。

**触发识别**：

| 触发源 | 用户说法示例 | 标签 |
| ------ | ------------ | ---- |
| specs 文件变更 | "我改了 XXX" / "重新读取 XXX" / "specs 有更新" / "REQ/DES 有改动" | `specs` |
| PRD 需求变更 | "需求变了" / "PRD 改了" / "新增需求 XXX" / "新增模块 XXX" / "加个功能" / "删掉 XXX 功能" | `prd` |
| 技术文档变更 | "文档更新了" / ".docs 有新文件" / "API 文档改了" / "建表脚本更新了" / "接口变了" | `tech`（AI 按文件位置分流：`.docs/prd/` 下变更转为 `prd`） |

**统一执行流程**：

```
Step 1: 变更识别与审计
  → [prd] 按 PRD 子目录分流识别：
    · .docs/prd/*.md 变更       → 重读需求文档 → 执行 PRD 审计（调用 /prd-audit Skill 或兜底 6 维度），P0 必须解决
    · .docs/prd/prototype/* 变更 → 重读原型图 → 更新交互流程/页面跳转
    · .docs/prd/ui/* 变更        → 重读 UI 设计稿 → 更新视觉规范
    · .docs/prd/ui-spec/* 变更   → 重读 UI 解析 md → 更新精确参数（最高优先级）
  → [tech] 重新扫描 .docs/tech/，与 project-profile.md「外部依赖」索引对比，识别变更内容
  → [specs] 跳过此步

Step 2: 影响分析（所有触发源统一执行）
  → AI 重读变更涉及的文件（[specs] 为用户指定文件；[prd]/[tech] 为 Step 1 识别的变更文件）
  → 识别改动点，定位受影响的模块和 specs 文件
  → 判断变更类型：
    a. 新增模块（仅 [prd]）：
       - index.md 新增行（编号、模块名、类型、优先级、sync-status: pending、coding-skill: pending、audit-skill: pending）
       - 分析依赖关系 → 填入 depends，插入 dev-order
       - 拆子任务（按 §2.1 Step 2 维度）→ 写入 task.md
       - 创建 REQ + DES 文件
    b. 已有模块变更：
       - 定位受影响的 REQ + DES
       - 更新 REQ（需求描述、验收标准）→ `review-status` 重置为 `draft`
       - 更新 DES（技术方案、接口设计）→ `review-status` 重置为 `draft`
       - 可能需要重新拆子任务 → 同步更新 task.md
    c. 仅索引/配置变更（[tech] 新增文档、构建配置变更等）：
       - 更新 project-profile.md 对应区块（「外部依赖」索引 / 「构建与运行」）
       - 不影响 REQ/DES → 跳过后续级联
  → 输出变更摘要，用户确认

Step 3: 级联更新（用户确认后执行）
  → 按级联规则（见下表）更新关联文件
  → [prd] 额外执行：
    - 同步更新 project-profile.md「业务架构」「业务流程」区块（如涉及，仅旧项目）
    - 同步更新 project-profile.md「PRD 内容索引」（新增文件追加，变更文件更新摘要）
    - 涉及视觉内容（prototype/ui/ui-spec）变更 → 更新受影响模块的 `prototype-spec.md`：
      · 更新「基准来源」表中对应页面的条目
      · 更新「页面结构说明」对应页面章节
      · HTML 原型（如存在）若相关页面已有更高优先级视觉内容 → 标注为过时（保留文件但 prototype-spec.md 基准改为新的视觉内容）
    - 增量更新 .outdocs/project-overview.md 受影响的章节（仅更新变更涉及的章节，其余章节保留不动）
    - 同步更新对应 context 文件（如涉及项目架构/内部公共能力调整）
    - **功能测试用例联动**（§2.7 已产出 TC-F-*.md 时执行，否则跳过）：
      · 需求变更影响了 REQ 验收标准 → 重新调用 test-case-design 更新 TC-F 文档
      · 需求变更未影响验收标准 → 不更新
    - **单元测试联动**：标记受影响模块的单测产出为 outdated，下次进入 §3.7 时 unit-test-generator 自动重新生成（因为会重新读源代码）

Step 4: 一致性扫描与状态更新
  → index.md ↔ 实际文件是否对齐（编号、名称、文件存在性）
  → DES → REQ 引用是否一致
  → task.md ↔ index.md 模块一致性（缺失 → 自动拆子任务补入）
  → context 文件 ↔ 实际代码一致性
  → 发现不一致 → 输出清单（含影响说明），等待用户确认后修复
  → 涉及模块已有代码实现 → sync-status 标记为 outdated；未编码 → 保持不变

Step 5: 留痕
  → 写入 change-log-specs.md（用户改动 + AI 级联改动分别记录，标注触发源标签 [prd]/[tech]/[specs]）
  → [prd] 额外写入 .outdocs/prd-change-log.md（追加变更记录，格式见下方）
  → **更新 context.md**：追加一条记录 `{日期} Spec Sync 完成（触发源: [{prd/tech/specs}]，影响模块: {列表}）— last: §2.6 Spec Sync（下次返回触发时所在阶段继续）`

Step 6: 后续处理
  → 检查是否存在 outdated 模块，若有则询问：
```

```
【同步确认】
本次改动导致以下模块 specs 与代码不一致：
  - {模块名}（outdated）
是否现在同步代码？
  A. 立即同步（进入标准通道）
  B. 稍后处理（保持 outdated，下次开发时自动触发）
```

**prd-change-log.md 记录格式**：

```markdown
### 变更 —

- **变更类型**：{新增模块 / 已有模块变更}
- **变更原因**：{为什么改，谁提出}
- **变更内容**：{具体改了什么}
- **影响模块**：{受影响的模块编号和名称}
- **影响范围**：{REQ/DES/代码/api-doc/dev-order/task.md 哪些受影响}
- **进度影响**：{dev-order 是否调整，当前开发是否受阻}
```

**级联规则**：

| 被改文件            | 可能影响的关联文件                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| requirements/REQ-xx | → 对应 design/DES-xx → index.md                                                                          |
| design/DES-xx       | → 对应 requirements/REQ-xx → index.md → context.md → .outdocs/api-doc.md 对应模块章节（如含 API 定义） |
| index.md            | → context.md → task.md（模块状态同步）                                                                   |
| task.md             | → index.md（模块状态同步）                                                                                |
| context.md          | → 无级联（终端文件）                                                                                      |
| project-profile.md  | → 铁律变更时检查所有 DES 是否冲突                                                                         |

**留痕规则**：

所有改动必须记录到 `.project/specs/change-log-specs.md`，格式：

```markdown
| 序号 | 时间 | 操作人 | 触发源 | 改动文件 | 改动摘要 | 级联更新 |
```

- 操作人标注「用户」或「AI」
- 触发源标注 `[prd]` / `[tech]` / `[specs]` / `[bug-fix]` / `[refactor]`
- 用户改动：记录改了什么
- AI 级联改动：记录改了哪些文件、改了什么、为什么改
