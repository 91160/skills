# §3 编码变更通道

> 本文件在编码开发阶段加载。包含标准通道 §3.1~§3.11 完整步骤。
>
> 本文件所有 §N.N 章节顶部均带有「流程声明」引用块，AI 进入任何章节前必须先读声明头。

---

## §3.0 通道判断

> **流程声明**
> - phase: coding
> - step: 0/11
> - prev: §2.7 功能测试用例设计 / G0.5 阶段路由（已有 approved spec）/ G0.4.1 bug 意图二次判定（当前需求 bug）
> - next: §3.1 加载规范 + 铁律（快速/标准通道）/ 直接回答（直通通道）
> - gate: none
> - blocking: false

每次开发任务，必须先判断变更类型：

| 通道           | 触发条件                     | 执行路径                                             |
| -------------- | ---------------------------- | ---------------------------------------------------- |
| **直通** | 不涉及代码（讨论/解释/运行） | 直接回答；追加 context.md 记录 `{日期} 直通通道：{问题简述} — last: {触发前的阶段}`（不改变当前阶段） |
| **快速** | 仅样式/文案，不改变逻辑      | §3.1 → 直接改代码 → §3.9 → §3.10 → §3.11 |
| **标准** | 涉及业务逻辑/接口/数据       | 执行 §3.1~§3.11 完整步骤（含 §3.8 task.md 联动） |

**通道判断不确定时** → 触发 G2 停车信号（说明两种判断及理由，请用户选择）。

**直通通道的后续路由**：直通结束后当前阶段保持不变（context.md 的 last 字段仍是触发前的阶段）。用户后续若要继续原任务或提新任务，由下次对话的 G0.4.1 任务意图推断处理，不在 §3.0 内自动跳转。

---

### Bug 修复回环（从 G0.4.1 二次判定进入）

当 G0.4.1 判定为「当前需求 bug」时，直接进入本节 §3.0，按上方通道判断表选择通道。**通道选择规则与正常开发完全一致**（样式/文案 bug → 快速；逻辑/接口/数据 bug → 标准；只是询问报错原因 → 直通），后续 §3.1~§3.11 正常执行。

**与正常开发的差异仅在文档留痕**（§3.10 执行时生效）：

- **不新建 REQ/DES**：当前需求已有 approved 的 REQ/DES，bug 修复复用现有文档
- **REQ 追加 bug 修复记录**：在当前模块的 REQ 末尾追加 bug 修复段落（详见 §3.10）
- **DES 标注变更处**：在 DES 受影响的设计段落标注修复注释（详见 §3.10）
- **G1 门禁正常通过**：当前需求的 REQ/DES 已 approved，门禁不受影响

---

## §3.1 加载规范 + 铁律

> **流程声明**
> - phase: coding
> - step: 1/11
> - prev: §3.0 通道判断 / §3.8 更新 task.md（循环编码）
> - next: §3.2 加载 Spec（标准通道）/ §3.9 生成 Changelog（快速通道，省略 §3.2~§3.8）
> - gate: none
> - blocking: false

本章节包含 4 个子步骤：§3.1.1 铁律检查 → §3.1.2 已有代码认知加载 → §3.1.3 编码上下文加载 → §3.1.4 UI 上下文加载（前端改动时）。

### §3.1.1 铁律检查（细查，补充 G1 门禁 #6 的粗查）

> G1 门禁 #6 在任务描述层面粗查铁律冲突；此处加载完编码上下文后，结合具体实现方案逐条细查。

读取 `project-profile.md` 的「项目铁律」区块，逐条检查本次变更是否违反。

- 铁律区块为空或文件不存在 → 视为无铁律约束，继续
- 无冲突 → 继续
- 有冲突 → 立即停止，输出：

```
【铁律冲突】
本次变更违反了以下铁律：
  - {具体铁律条目}
建议方案：{符合铁律的替代实现方式}
请确认如何处理后继续。
```

### §3.1.2 已有代码认知加载（`.project/reverse-scan/` 存在时执行，不存在则跳过）

从深度扫描产出（§1.4 产出）中加载当前模块相关的编码上下文：
- 读取当前模块涉及的知识卡片（函数级业务语义 + 调用关系 + 数据操作）
- 读取 `.project/reverse-scan/call-graph.md` 中当前模块的调用链路
- 读取 `.project/reverse-scan/specs/design/DES-*.md` 中相关模块的技术方案

**功能测试场景加载**（`.test/testcases/TC-F-*.md` 存在时执行，不存在则跳过）：

读取当前模块的 TC-F-*.md（§2.7 产出），了解本模块的功能场景边界：
- 正常流程有几条路径？（第一章业务流程测试）
- 异常/边界场景有哪些？（第四章异常边界测试）
- 状态流转的完整路径？（状态迁移场景）
- UI 交互的预期行为？（第二章 UI 交互测试）

> 目的：编码时确保实现覆盖 TC 描述的所有 P0/P1 场景。TC 不规定"怎么写代码"，只告知"代码需要支持哪些功能场景"。无 TC 文档时跳过，不影响编码。

加载后输出追加到下方编码上下文中：
```
  - 已有函数复用：{从知识卡片匹配的可复用函数列表，精确到 类名.方法名}
  - 已有调用链路：{当前模块的关键调用路径}
  - 功能测试场景：{TC-F 文档路径}，P0 场景 {N} 条 / P1 场景 {N} 条（如有 TC 文档）
```

### §3.1.3 编码上下文加载（遵循但不阻断）

从 project-profile.md + 前后端 context 文件 + `.outdocs/api-doc.md`，加载本次编码的约束上下文：

**始终加载（project-profile.md）**：

| 区块                 | 编码时的约束作用                                 |
| -------------------- | ------------------------------------------------ |
| 项目铁律             | §3.1.1 铁律检查已处理                            |
| 外部依赖             | 已有的外部 API/服务必须按已有方式调用            |
| 业务架构（仅旧项目） | 模块间调用必须走已有的依赖路径                   |
| 业务流程（仅旧项目） | 不得破坏已有流程的正常/异常路径                  |
| api-doc.md           | 已完成模块的接口清单，跨模块调用必须复用已有接口 |

**按改动类型加载 context 文件**：

- 前端改动 → 读取 `.project/specs/rules/frontend-context.md`
- 后端改动 → 读取 `.project/specs/rules/backend-context.md`
- 联调 → 两个都读取

context 文件中的以下区块作为编码约束：

| 区块         | 编码时的约束作用                                           |
| ------------ | ---------------------------------------------------------- |
| 构建与运行   | 新文件必须在现有构建体系内                                 |
| 项目架构     | 新代码必须符合现有架构模式（如分层、路由注册方式）         |
| 项目规范     | 命名约定、目录结构、代码风格必须遵循                       |
| 内部公共能力 | 已有的工具/组件/中间件/枚举/通用模式必须复用，禁止重复封装 |
| 禁止事项     | context 文件中列出的禁止行为必须遵守                       |

### §3.1.4 UI 上下文加载（前端改动时）

查 project-profile.md「PRD 内容索引」+ 当前模块的 prototype-spec.md「基准来源」表 + DES 前端部分，按以下 **6 级优先级** 加载 UI 编码约束：

| 优先级 | 类别 | 来源 | 说明 |
|---|---|---|---|
| **1** | UI 解析 md | `.docs/prd/ui-spec/*.md` | 精确参数（像素值/组件名/字段清单/状态标注），最高权威 |
| **2** | UI 设计稿 | `.docs/prd/ui/*.png/jpg/pdf` | 视觉真相源，补充 md 未覆盖的视觉细节 |
| **3** | 原型图 | `.docs/prd/prototype/*.png/jpg` | 功能流程 + 页面跳转 + 布局骨架 |
| **4** | HTML 原型 | `.project/specs/master/prototypes/{模块}/*.html` | 仅 PRD 无视觉内容时由 AI 生成（§2.4 兜底） |
| **5** | DES 前端方案 | `.project/specs/master/design/DES-*.md` | 文字方案，上面都没有时的推导依据 |
| **6** | 样式体系 | `.project/specs/rules/frontend-context.md` | CSS 变量/主题/公共组件/样式体系 |

**读取流程**：

1. 读取当前模块的 `prototype-spec.md`「基准来源」表，按页面查询该页面的基准优先级列表
2. 按该页面基准从高到低逐项读取原始文件（通过索引定位，实际读原始文件不依赖记忆）
3. 补充读取 frontend-context.md 的「样式体系」和「公共组件」（所有前端编码都要遵守）

- PRD 无视觉内容且无 HTML 原型且 DES 无 UI 还原维度 → 跳过此步（纯后端改动或无 UI 需求）

---

**多源冲突处理规则**：

| 冲突场景 | 处理 |
|---|---|
| **UI 解析 md vs UI 设计稿** | 以 UI 解析 md 为主（精度更高，带像素值/组件名等可编码参数）；设计稿作为 md 未覆盖的视觉细节补充 |
| md 与设计稿**明显矛盾**（如同一字段的像素值差 ≥20% / 组件类型不同） | 触发 G2 停车（可能 md 解析过时或设计稿更新未同步），请用户裁决 |
| **UI 设计稿 vs 原型图** | 互补不冲突（视觉取设计稿，流程取原型图）；**若布局显著差异**（主区域划分/层级不同）→ 以 UI 设计稿为视觉基准，原型图仅保留流程参考，并触发 G2 停车请用户确认偏离原因 |
| **任何 PRD 内容 vs frontend-context.md 样式** | PRD 优先（需求覆盖项目默认约束） |
| PRD 视觉 vs DES 文字描述 | PRD 视觉优先，DES 偏离处必须在 DES 中标注原因 |
| **多个 UI 解析 md 同一页面** | 按文件修改时间取最新；若并列最新或用户指定了主 spec（文件名含 main/primary）→ 以主 spec 为准；仍无法确定 → 触发 G2 停车 |
| 多源冲突无法自动判断 | 触发 G2 停车，请用户裁决 |

---

**bug/refactor 类型引用规则**：

bug/refactor 不走 §2.4，当前模块可能无 prototype-spec.md。涉及 UI 改动时按以下顺序查找基准：

1. **当前模块有 prototype-spec.md**（历史 feature 已产出）→ 读该模块的 prototype-spec.md
2. **REQ 头部有 `affected-module`** → 读 affected-module 对应的 prototype-spec.md（其他模块的历史产出）
3. **都没有** → 直接按 6 级优先级读 `.docs/prd/` 下的原始视觉内容 + DES 推导

若 bug/refactor 导致 UI 行为变更 → §3.10 Bug/Refactor 级联更新 f 项同步更新 prototype-spec.md

---

加载后输出：

```
【编码上下文】
  - 遵循规范：{context 文件中的项目规范关键点}
  - 复用已有：{context 文件中的内部公共能力 + 已有接口}
  - 架构约束：{分层/路由注册/数据库访问方式}
  - 禁止事项：{context 文件中的禁止行为}
  - UI 基准（按页面）：{页面名}→{基准类型 + 基准文件}（前端改动时）
  - 精确参数来源：{UI 解析 md 文件路径}（若存在）
  - 视觉补充来源：{UI 设计稿文件路径}（若存在）
  - 组件映射：{PRD UI 元素 → 使用的组件库组件}（前端改动时）
  - 样式约束：{遵循的 CSS 变量/主题/间距体系}（前端改动时）
```

---

## §3.2 加载 Spec

> **流程声明**
> - phase: coding
> - step: 2/11
> - prev: §3.1 加载规范 + 铁律
> - next: §3.3 文档学习
> - gate: none
> - blocking: false

**feature 类型**：
```
读取 .project/specs/master/index.md
  → 路由表匹配目标模块（含类型列：feature / bug / refactor）
  → 读取 master/requirements/REQ-xx + master/design/DES-xx
  → 检查 sync-status
  → 检查 coding-skill / audit-skill 状态
  → 读取 .project/task.md，定位当前子任务（feature 类型，或 refactor 有 task.md 时）
```

**Bug / Refactor 类型**：不经 index.md 路由，直接按文件名读取自身 REQ / DES：
```
读取 master/requirements/REQ-{任务名} + master/design/DES-{任务名}
  → Skill 状态检查：按 REQ 中 affected-module 对应的 index.md 条目执行
    （无 affected-module 则跳过 Skill 状态检查）
  → 读取 .project/task.md（refactor 有 task.md 时定位当前子任务）
```

| sync-status  | 含义                                     | 处理                   |
| ------------ | ---------------------------------------- | ---------------------- |
| `synced`   | spec 与代码一致                          | 正常执行               |
| `outdated` | 代码已变更 spec 未同步                   | 先对齐再执行           |
| `pending`  | 尚未开始（G1 门禁未拦截成功的情况下）    | 回退到 §2.2 补写 spec |

**Skill 状态（index.md 两列独立管理）**：

| 列名 | 值 | 含义 | 处理 |
| --- | --- | --- | --- |
| coding-skill | `pending` | 未处理 | §3.5 按下方规则判断是否需要调用编码 Skill |
| coding-skill | `done` | 已处理（Skill 已执行 或 有 context 文件无需 Skill） | §3.5 跳过 Skill，直接编码 |
| coding-skill | `fallback` | Skill 文件缺失，使用兜底 | §3.5 使用内置规约 C-01~C-10 |
| audit-skill | `pending` | 未处理 | §3.6 按下方规则判断是否需要调用审计 Skill |
| audit-skill | `done` | 审计 Skill 已执行 | §3.6 跳过 Skill |
| audit-skill | `fallback` | Skill 文件缺失，使用兜底 | §3.6 使用内置规约 S-01~S-08 |

---

## §3.3 文档学习（按需）

> **流程声明**
> - phase: coding
> - step: 3/11
> - prev: §3.2 加载 Spec
> - next: §3.4 影响面评估
> - gate: none
> - blocking: true

先查 project-profile.md「外部依赖」和对应 context 文件（前端 → frontend-context.md；后端 → backend-context.md）的「构建与运行」「项目架构」「内部公共能力」，已覆盖则跳过。涉及数据库操作时，加载 `.project/reverse-scan/db-schema.md`（存在时）确认相关表结构和字段约束。未覆盖时，优先从 `.docs/` 中查找。`.docs/` 也未覆盖且涉及未记录的 API / 库时触发：

```
【文档学习确认】
本次任务涉及 {API/库名}，是否有文档需要我先学习？
支持：A. 在线链接  B. PDF  C. 粘贴内容  D. 放入 .docs/tech/ 目录
```

学习后输出摘要，反填 `project-profile.md`「外部依赖」区块。

---

## §3.4 影响面评估

> **流程声明**
> - phase: coding
> - step: 4/11
> - prev: §3.3 文档学习
> - next: §3.5 代码变更
> - gate: none
> - blocking: false

- 判断本次改动波及哪些模块
- 识别潜在风险点
- 按以下维度输出影响面清单：

| 维度     | 检查内容                                                        |
| -------- | --------------------------------------------------------------- |
| 功能关联 | 其他模块是否依赖或调用被修改的功能（`.project/reverse-scan/call-graph.md` 的"被多方调用的关键节点"表为优先数据源，不存在时从代码分析） |
| 数据关联 | 是否涉及共享数据模型/表/缓存（`.project/reverse-scan/db-schema.md` 为优先数据源，不存在时从代码分析） |
| 业务流程 | 是否影响 project-profile.md「业务流程」中的现有流程（仅旧项目） |
| 项目架构 | 是否影响 context 文件中已有的项目架构/内部公共能力             |
| 安全影响 | 是否涉及认证/授权/脱敏/校验                                     |
| 性能影响 | 是否影响查询性能/并发/内存                                      |

输出格式：
```
【影响面评估】
  - 功能关联：{无 / 影响 XXX 模块的 XXX 功能}
  - 数据关联：{无 / 涉及 XXX 表}
  - 业务流程：{无 / 影响 XXX 流程}
  - 项目架构：{无 / 影响 XXX 的架构/公共能力}
  - 安全影响：{无 / 涉及 XXX}
  - 性能影响：{无 / 可能影响 XXX}
  结论：{影响范围可控，继续 / 影响面超出当前通道预期，触发 G2 停车信号}
```

---

## §3.5 代码变更

> **流程声明**
> - phase: coding
> - step: 5/11
> - prev: §3.4 影响面评估
> - next: §3.6 代码审计
> - gate: G1 写码门禁
> - blocking: true

- **task.md 联动（feature 类型，或 refactor 有 task.md 时）**：编码开始前，将当前子任务 status 更新为 `in-progress`
- 符合 `.project/specs/` 规范
- **编码 Skill 调用判断**：检查 index.md 当前模块的 `coding-skill` + context 文件是否存在：
  - `coding-skill` 为 `done` 或 `fallback` → 已处理，跳过
  - `coding-skill` 为 `pending` 且对应 context 文件已存在（frontend-context.md / backend-context.md）→ **跳过编码 Skill**，以 context 文件为编码规范，更新 `coding-skill` 为 `done`
  - `coding-skill` 为 `pending` 且 context 文件不存在（新项目脚手架刚建好）→ 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用编码 Skill（前端 /frontend-coding；后端无内置编码 Skill，直接使用 C-01~C-10 内置规约），**必须输出 Skill 执行日志**，完成后更新 `coding-skill` 为 `done` 或 `fallback`
  - **Bug / Refactor 无 affected-module 时**：跳过 index.md 状态检查，仅按 context 文件是否存在决定（有 → 以 context 为规范编码；无 → 前端调用 /frontend-coding，后端使用 C-01~C-10），Skill 执行后不更新 index.md
- 编码时必须遵循 §3.1 加载的编码上下文（铁律 + context 文件规范 + 内部公共能力 + 架构约束 + 知识卡片中的已有函数），复用已有能力，禁止重复封装
- `.project/reverse-scan/` 存在时：优先从知识卡片中查找可复用的已有函数（精确到 类名.方法名 + 业务语义），而非仅从 context 文件的公共能力列表粗匹配。知识卡片为初始化时的快照，编码过程中不回写更新（如需刷新，用户说"重新扫描"）
- 编码过程中新增公共工具/组件/枚举 → 追加到对应 context 文件（前端 → frontend-context.md；后端 → backend-context.md）的「内部公共能力」章节
- **融合优先级**：
  - 有 context 文件时：project-profile.md 铁律 > context 文件 > C-01~C-10 / U-01~U-06
  - 无 context 文件时（新项目）：project-profile.md 铁律 > Skill 规范 > C-01~C-10 / U-01~U-06
- 逐项遵守编码规约：

| #    | 规约             | 要求                                          |
| ---- | ---------------- | --------------------------------------------- |
| C-01 | 异常路径完整     | 每个 try-catch 有错误分类、用户提示、日志记录 |
| C-02 | 输入校验双重防线 | 前端校验+后端校验，后端不可省                 |
| C-03 | 幂等与并发安全   | 写操作幂等（Token/唯一键），并发敏感加锁      |
| C-04 | 配置外部化       | 所有环境配置走环境变量，零硬编码              |
| C-05 | 结构化日志       | 关键路径有结构化日志，错误日志含上下文        |
| C-06 | 超时与降级       | 所有外部调用设超时，超时有降级方案            |
| C-07 | 数据边界处理     | null/空数组/超长文本/特殊字符有防御           |
| C-08 | 安全基线         | SQL参数化、XSS转义、敏感数据不进日志          |
| C-09 | 错误码体系       | 业务错误有明确错误码                          |
| C-10 | 资源释放         | 连接/句柄/定时器用完必释放                    |

- **UI 还原规则**（前端改动时，与 C-01~C-10 并列执行）：

**基准查询**：每条 U 规约都以**该页面的最高优先级基准**为准（见 §3.1.4 6 级优先级 + prototype-spec.md「基准来源」表）。示例：某页面基准 = UI 解析 md（优先级 1）→ U-01/U-04/U-06 对照 md 的精确参数检查。

| #    | 规约             | 要求                                          |
| ---- | ---------------- | --------------------------------------------- |
| U-01 | 布局还原         | 页面结构必须与**该页面基准**一致（区域划分/层级/排列方式）|
| U-02 | 组件还原         | 使用 DES 指定的组件库组件，禁止自行替换       |
| U-03 | 交互还原         | 按钮/表单/跳转行为必须与**该页面基准** + DES 定义一致 |
| U-04 | 字段还原         | 字段名称/顺序/必填标记必须与**该页面基准**一致（UI 解析 md 存在时以其字段清单为准） |
| U-05 | 状态还原         | 加载中/空状态/错误状态/成功状态必须按**该页面基准** + DES 实现 |
| U-06 | 样式遵循         | UI 解析 md / UI 设计稿中指定的精确参数优先；其次使用项目 CSS 变量/主题/公共样式；禁止硬编码颜色/字号 |

---

## §3.6 代码审计

> **流程声明**
> - phase: coding
> - step: 6/11
> - prev: §3.5 代码变更
> - next: §3.7 开发自测
> - gate: none
> - blocking: false

- 无内置代码审计 Skill，直接使用 {SKILL_DIR}/rules/quality-standards.md 中 S-01~S-08 标准
- index.md `audit-skill` 状态处理：
  - `audit-skill` 为 `done` 或 `fallback` → 已处理，跳过
  - `audit-skill` 为 `pending` → 执行 S-01~S-08 审计，完成后更新 `audit-skill` 为 `done`
  - **Bug / Refactor 无 affected-module 时**：跳过 index.md 状态检查，直接执行审计，不更新 index.md
- **融合优先级**：
  - 有 context 文件时：project-profile.md 铁律 > context 文件 > {SKILL_DIR}/rules/quality-standards.md 代码审计标准
  - 无 context 文件时（新项目）：project-profile.md 铁律 > {SKILL_DIR}/rules/quality-standards.md 代码审计标准
- 按 S-01~S-08 逐项检查（标准见 {SKILL_DIR}/rules/quality-standards.md），不通过项当场修复，修复后重新检查该项，直到全部通过。单项修复超 3 次仍未通过 → 触发 G2 停车信号（列出未通过项，请用户判断）
- 全部通过后输出审计报告，并以模块章节形式追加到 `.outdocs/audit-report.md`：

```
【代码审计报告】
结论：PASS
检查项：{N}/8 通过 | 修复：{N} 项

- S-01 空值防御：✅
- S-02 前端输入信任：✅（已修复：{修复内容}）
- S-03 Spec 一致性：✅
- S-04 性能回归：✅
- S-05 权限校验：✅
- S-06 能力复用：✅
- S-07 UI 还原度：✅（前端改动时检查）
- S-08 功能完整性：✅（TC-F 存在时检查）

[UI 审计]（前端改动时附加）
- U-01 布局还原：✅
- U-02 组件还原：✅
- U-03 交互还原：✅
- U-04 字段还原：✅
- U-05 状态还原：✅
- U-06 样式遵循：✅
```

---

## §3.7 开发自测

> **流程声明**
> - phase: coding
> - step: 7/11
> - prev: §3.6 代码审计
> - next: §3.8 更新 task.md
> - gate: none
> - blocking: false

本步骤分两部分执行：**自动化单测**（unit-test-generator）+ **人工补充验证**（T-01~T-06）。

---

### §3.7.1 自动化单测（调用 unit-test-generator）

**前置清理**（中断恢复机制）：

```
检查项目测试目录是否存在 generated/ 临时子目录？
  ├─ 存在 → 上次 §3.7.1 执行中断（对话断开/token 耗尽），有未清理的残留
  │   1. 删除 generated/ 目录及其所有内容
  │   2. 检查 .test/unit/report.md 是否存在
  │      ├─ 存在且结论为 PASS → 上次已执行成功但未清理，跳过本次 §3.7.1，直接进入 §3.7.2
  │      └─ 不存在或结论非 PASS → 上次执行未完成，正常重新执行 §3.7.1
  └─ 不存在 → 无残留，正常执行
```

读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程安装并调用 /unit-test-generator。

**工作模式**：自主设计模式（从 REQ/DES + 实际源代码 → 设计单测用例 + 生成代码 + 执行 + 报告）

**SDD 模式参数**：
- `input`：当前模块的 REQ + DES + 实际源代码文件
- `frameworks`：从 project-profile.md 技术栈自动推断（前端→vitest/jest，后端→junit5/pytest/gotest）；全栈项目一次调用同时生成
- `exec_mode`：`true`（SDD 模式默认开启，生成后自动执行）
- `output_dir`：`.test/unit/`

**执行流程**：

```
1. unit-test-generator 分析源代码 + REQ/DES
   → 设计单测用例（unit/api/db channel）
   → 输出 UT-{模块}-{功能}.md（单测用例文档）
   → 生成单测代码骨架 → skeleton/{TC-ID}.{framework}.{ext}

2. 将 skeleton/ 下文件复制到项目测试目录
   （从 frontend-context.md / backend-context.md 的"运行测试"配置推断目录）

3. 执行 test runner（带覆盖率参数）：
   · Jest:   npx jest --coverage {测试目录}/generated/
   · Vitest: npx vitest run --coverage {测试目录}/generated/
   · JUnit5: mvn test -Djacoco（需 jacoco 插件）
   · pytest: python -m pytest --cov={源码目录} {测试目录}/generated/
   · go test: go test -cover ./{测试目录}/generated/...

4. 收集结果 → 写入两处：
   · .test/unit/report.md（模块级报告）
   · .outdocs/unit-test-report.md（追加，全局汇总）

5. 覆盖率检查：
   · 行覆盖率 ≥ 70% 且 分支覆盖率 ≥ 60% → 达标，继续
   · 不达标 → 分析未覆盖的代码行/分支，自动补充用例（追加到 skeleton/），重新执行
   · 补充循环上限 2 次，超过则报告当前覆盖率 + 未覆盖清单，继续流程（不阻断）

6. 清理：删除复制到项目测试目录的单测文件和 fixture
   （skeleton/ 原件保留，作为设计产出归档）
```

**执行结果处理**：
- 全部通过 → 继续 §3.7.2 自动补充验证
- 断言失败（代码 bug）→ 回 §3.5 修复代码，重新 §3.6 + §3.7
- 依赖缺失 → AI 尝试安装后重跑；安装失败 → **降级处理**
- 环境配置问题 → **降级处理**
- **自愈循环上限**：§3.5→§3.6→§3.7 的修复循环累计不超过 5 次。超过 5 次 → 触发 G2 停车信号；用户决策后若选择跳过单测 → **降级处理**

**降级处理**（依赖缺失安装失败 / 环境配置问题 / 自愈超限用户选择跳过 / 无 Bash 能力 / Skill 文件缺失，统一出口）：

```
降级流程：
  1. report.md 写入结论 SKIP，记录跳过原因：
     · 依赖缺失：「{依赖名} 安装失败，跳过单测执行」
     · 环境配置：「{具体问题}，需修复 .test/.test-env.md 后重跑」
     · 自愈超限：「修复循环超 5 次，用户选择跳过」
     · 无 Bash：「当前工具无 Bash 能力，单测代码已生成待手动执行」
     · Skill 缺失：「unit-test-generator Skill 不可用」
  2. 单测代码骨架正常保留（skeleton/，已生成的不删除）
  3. 输出提示用户可手动修复后说"重跑单测"触发重新执行 §3.7.1
  4. 继续 §3.7.2 T-01~T-06 全量验证（不跳过任何 T 项，补充覆盖）
  5. 不阻断流程
```

**执行环境降级**（无 Bash 能力时的额外处理）：

```
exec_mode=true 时，AI 尝试执行 test runner：
  ├─ 有 Bash 能力（Claude Code / Codex）→ 正常执行 npm test / mvn test / pytest
  │
  └─ 无 Bash 能力（Cursor / Copilot / 其他）→ 进入上方降级处理，额外执行：
      1. exec_mode 自动降为 false（只生成代码，不执行）
      2. 不复制到项目测试目录（无需清理）
      3. 输出提示：
         「单测代码已生成到 {output_dir}/skeleton/，请手动执行：
           前端：{test_commands.frontend}（如 npm test）
           后端：{test_commands.backend}（如 mvn test）
           执行后将结果反馈给 AI，或直接进入补充验证。」
```

---

### §3.7.2 自动补充验证（T-01~T-06，AI 自动执行能做的项，不等待用户）

- 优先读取 .project/specs/rules/unit-test-base.md（团队自定义自测规则）
- 文件不存在 → 使用 {SKILL_DIR}/rules/quality-standards.md 中开发自测标准（T-01~T-06）

**执行策略**：AI 能做的自动执行，做不了的直接跳过，不阻塞流程。

```
Step 1：判断每项的执行方式

  [前端验证]（涉及前端时）
  T-01 交互逻辑 → ⏭ 跳过（需浏览器点击，AI 无法执行，待人工或未来 E2E）
  T-02 页面跳转 → ⏭ 跳过（需浏览器跳转，AI 无法执行，待人工或未来 E2E）
  T-03 页面渲染 → 🤖 AI 自动执行（HTTP 状态检查 + 错误关键词扫描）
  不涉及前端 → T-01/T-02/T-03 全部标记"不涉及"

  [后端验证]
  T-04 接口可用性 → §3.7.1 单测 PASS？✅ 标记"单测已覆盖" : 🤖 AI 自动 curl 验证
  T-05 边界覆盖   → §3.7.1 单测 PASS？✅ 标记"单测已覆盖" : 🤖 AI 自动 curl 验证
  T-06 返回值正确 → §3.7.1 单测 PASS？✅ 标记"单测已覆盖" : 🤖 AI 自动 curl 验证

Step 2：AI 自动执行

  T-03 页面渲染（AI 能力范围内）：
    1. 确认 dev server 已启动（或尝试启动）
    2. curl 请求改动涉及的页面 URL
    3. 检查 HTTP 状态码（200/301/302 = 正常，4xx/5xx = 异常）
    4. 扫描 HTML 响应中的 error / exception / stack trace 关键词
    → ✅ 通过 / ❌ 不通过（记录具体 URL + 错误）

  T-04/T-05/T-06（单测未覆盖时，AI 用 curl 验证）：
    T-04：curl 调用每个改动涉及的接口 → 检查状态码 + 响应结构
    T-05：curl 传入 null/空字符串/超长文本/特殊字符 → 检查返回错误码
    T-06：curl 调用接口 → 解析 JSON 逐字段对比 DES 定义
    → 每项 ✅ / ❌

Step 3：输出结果（通知用户，不等待回复）
```

**结果输出格式**：

```
【§3.7.2 自测补充结果】
[前端验证]
- T-01 交互逻辑：⏭ 跳过（需浏览器，待人工或 E2E）
- T-02 页面跳转：⏭ 跳过（需浏览器，待人工或 E2E）
- T-03 页面渲染：✅ / ❌（HTTP 检查：{涉及 URL 列表}）

[后端验证]
- T-04 接口可用性：✅ 单测已覆盖 / ✅ curl 验证通过 / ❌ {错误详情}
- T-05 边界覆盖：✅ 单测已覆盖 / ✅ curl 验证通过 / ❌ {错误详情}
- T-06 返回值正确：✅ 单测已覆盖 / ✅ curl 验证通过 / ❌ {错误详情}

结论：{PASS / FAIL}
  ✅ 通过：{N} 项 | ⏭ 跳过：{N} 项 | ❌ 不通过：{N} 项
```

**不通过处理**：
- 有 ❌ → 回 §3.5 修复代码，重新 §3.6 + §3.7（自愈循环计数 +1）
- 全部 ✅ 或 ⏭ → 继续 §3.8

**综合自测报告**（§3.7.1 + §3.7.2 合并追加到 `.outdocs/unit-test-report.md`）：

```
## {模块编号}-{模块名} 开发自测报告

### 自动化单测（§3.7.1 unit-test-generator）
- **框架**：{Jest / JUnit5 / ...}
- **用例总数**：{N}
- **通过**：{N} | **失败**：{N} | **跳过**：{N}
- **覆盖 channel**：unit / api / db
- **执行命令**：{npm test --coverage / mvn test / ...}
- **覆盖率**：
  - 行覆盖率：{N}%（阈值 ≥ 70%）{达标 ✅ / 未达标 ⚠️}
  - 分支覆盖率：{N}%（阈值 ≥ 60%）{达标 ✅ / 未达标 ⚠️}
  - 函数覆盖率：{N}%
  - 补充轮次：{0/1/2}

| TC-ID | 用例描述 | channel | 结果 | 备注 |
|---|---|---|---|---|
| UT-login-001 | 正常登录返回 token | api | ✅ PASS | |
| UT-login-002 | 密码错误返回 401 | api | ✅ PASS | |

### 补充验证（§3.7.2 T-01~T-06）
[前端验证]
- T-01 交互逻辑：⏭ 跳过（需浏览器，待人工或 E2E）
- T-02 页面跳转：⏭ 跳过（需浏览器，待人工或 E2E）
- T-03 页面渲染：✅ HTTP 200 + 无 error 关键词

[后端验证]
- T-04 接口可用性：✅ 单测已覆盖
- T-05 边界覆盖：✅ 单测已覆盖
- T-06 返回值正确：✅ 单测已覆盖

结论：PASS | 修复：{N} 项 | 回归次数：{N} | 跳过：{N} 项（待人工或 E2E）
```

---

## §3.8 更新 task.md（feature 类型，或 refactor 有 task.md 时，AI 自动执行）

> **流程声明**
> - phase: coding
> - step: 8/11
> - prev: §3.7 开发自测
> - next: §3.9 生成 Changelog（当前模块无 pending）/ §3.1 加载规范 + 铁律（当前模块还有 pending，回到循环；进入 §3.5 时会重新触发 G1 门禁）
> - gate: none
> - blocking: false

- 将当前子任务 status 更新为 `done`
- 更新 task.md 模块总览表的计数
- 检查当前模块是否还有 pending 子任务：
  - 有 → 回到 G1 门禁自检，自动定位下一个子任务，继续编码循环
  - 无 → 继续 §3.9，进入归档

---

## §3.9 生成 Changelog

> **流程声明**
> - phase: coding
> - step: 9/11
> - prev: §3.8 更新 task.md（标准通道）/ §3.1 加载规范 + 铁律（快速通道，省略 §3.2~§3.8）
> - next: §3.10 Spec 状态同步
> - gate: none
> - blocking: false

文件路径：`.project/changelog/{YYYY-MM-DD}-{xx}-{简述}.md`

```markdown
### [{Bug/Feature/Refactor}] {描述} - {YYYY-MM-DD HH:mm}
- **背景**: {需求背景或 Bug 表现}
- **解决方案**: {技术实现}
- **影响模块**: {模块列表}
- **影响代码**: {核心文件}
```

---

## §3.10 Spec 状态同步（AI 自动执行）

> **流程声明**
> - phase: coding
> - step: 10/11
> - prev: §3.9 生成 Changelog
> - next: §3.11 写入 context.md
> - gate: none
> - blocking: false

- 更新 index.md 中对应模块的 sync-status 为 `synced`（feature 类型）
- 写入 change-log-specs.md 记录本次变更（操作人: AI，触发源: `[specs]`）
- **Bug / Refactor 类型文档级联**（REQ 头部有 `affected-module` 时执行，否则跳过）：
  a. 读取 DES 的「受影响 Spec 变更清单」，定位受影响模块的已有 DES 文件
  b. 按变更清单更新受影响模块 DES 的对应部分（核心流程 / 异常处理 / API 定义 / 状态管理 / 数据模型），在变更处标注 `<!-- {Bug fix / Refactor}: {REQ 编号} {日期} -->`
  c. DES 含 API 行为变更 → 同步更新 `.outdocs/api-doc.md` 对应章节
  d. 更新 index.md 受影响模块的 sync-status 为 `synced`（DES 已同步更新）
  e. 写入 change-log-specs.md：记录受影响模块 DES 的级联更新（操作人: AI，触发源: `[bug-fix]` 或 `[refactor]`）
  f. **涉及 UI 或视觉内容变更时** → 同步更新受影响模块的 `prototype-spec.md`：
     - 基准文件本身变更（如设计稿更新）→ 更新「基准来源」表对应页面的条目
     - 页面实际呈现变化（如组件替换/布局调整）→ 更新「页面结构说明」对应页面的区域/组件/状态描述
     - 无 UI 变更 → 跳过本步
- **Bug 修复回环文档留痕**（从 G0.4.1 二次判定 → §3.0 进入的当前需求 bug，执行以下步骤）：
  a. **REQ 追加 bug 修复记录**：在当前模块的 REQ 文件末尾追加：
     ```markdown
     ---
     ### Bug 修复记录 — {YYYY-MM-DD}
     - **现象**: {用户描述的 bug 表现}
     - **根因**: {定位到的根本原因}
     - **修复方案**: {实际修改内容}
     - **验收标准**: {修复后预期行为}
     - **涉及文件**: {修改的文件列表}
     ```
  b. **DES 标注变更处**：在 DES 中受 bug 影响的设计段落末尾追加注释 `<!-- Bug fix: {bug 现象简述} {日期} —— {修改说明} -->`
  c. DES 含 API 行为变更 → 同步更新 `.outdocs/api-doc.md` 对应章节
  d. 写入 change-log-specs.md：记录本次 bug 修复的文档更新（操作人: AI，触发源: `[bug-fix-loop]`）
  e. 涉及 UI 变更时 → 同步更新 prototype-spec.md（规则同上方 f 项）

> 快速通道、标准通道、bug 修复回环共用此步骤。

---

## §3.11 写入 context.md（AI 自动执行）

> **流程声明**
> - phase: coding
> - step: 11/11
> - prev: §3.10 Spec 状态同步
> - next: §4 归档（正常开发 / bug 修复回环且原始 last 在 §4）/ 回到原位继续开发（bug 修复回环且原始 last 在 §3.x）
> - gate: none
> - blocking: false

**正常开发**（非 bug 修复回环）：

```markdown
### {YYYY-MM-DD} {任务简述}
- **完成内容**: {具体到文件级别}
- **遗留问题**: {如有，否则填"无"}
- **下一步建议**: {方向}
- **last**: §3.11 写入 context.md（下次进入 §4 归档）
```

完成后 → 进入 {SKILL_DIR}/rules/phase-archive.md（§4 归档）。

**Bug 修复回环**（从 G0.4.1 二次判定进入 §3.0 的当前需求 bug）：

```markdown
### {YYYY-MM-DD} [Bug fix loop] {bug 现象简述}
- **完成内容**: {具体到文件级别}
- **修复通道**: {标准 / 快速 / 直通}
- **遗留问题**: {如有，否则填"无"}
- **last**: {见下方路由规则}
```

**Bug 修复回环完成后的路由规则**（根据触发前的原始 `last` 决定）：

| 原始 last | 含义 | 修复后路由 | context.md last 写入 |
|----------|------|----------|---------------------|
| §3.x（§3.0~§3.11） | 开发中途修 bug | 回到原始 last 位置继续开发 | `last: {原始 last 值}（bug 修复回环完成，继续原开发流程）` |
| §4 | 归档后修 bug | 重新进入 §4 归档验证 | `last: §3.11 写入 context.md（bug 修复回环完成，下次进入 §4 重新归档）` |

> **原始 last 的获取方式**：bug 修复回环进入 §3.0 前，AI 已在 G0.4 读取了 context.md 的 `last` 字段。此值在整个回环过程中保持不变，作为回环完成后的路由依据。
