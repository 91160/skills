# 阶段：编码变更通道（§3）

> 本文件在编码开发阶段加载。包含标准通道 Step 0-8 完整步骤。

---

## 通道判断

每次开发任务，必须先判断变更类型：

| 通道           | 触发条件                     | 执行路径                                             |
| -------------- | ---------------------------- | ---------------------------------------------------- |
| **直通** | 不涉及代码（讨论/解释/运行） | 直接回答，完成后更新 context.md                      |
| **快速** | 仅样式/文案，不改变逻辑      | Step 0 → 直接改代码 → Step 7 → Step 7.5 → Step 8 |
| **标准** | 涉及业务逻辑/接口/数据       | 执行 Step 0-8 完整步骤（含 Step 6.5 task.md 联动）   |

**通道判断不确定时** → 触发停车信号（说明两种判断及理由，请用户选择）。

---

## 标准通道执行步骤

**Step 0：加载项目规范 + 检查铁律**

**一、铁律检查（细查，补充门禁 #6 的粗查）**

> 门禁 #6 在任务描述层面粗查铁律冲突；此处加载完编码上下文后，结合具体实现方案逐条细查。

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

**一半、已有代码认知加载**（`.project/reverse-scan/` 存在时执行，不存在则跳过）：

从深度扫描产出中加载当前模块相关的编码上下文：
- 读取当前模块涉及的知识卡片（函数级业务语义 + 调用关系 + 数据操作）
- 读取 `.project/reverse-scan/call-graph.md` 中当前模块的调用链路
- 读取 `.project/reverse-scan/specs/design/DES-*.md` 中相关模块的技术方案

加载后输出追加到下方编码上下文中：
```
  - 已有函数复用：{从知识卡片匹配的可复用函数列表，精确到 类名.方法名}
  - 已有调用链路：{当前模块的关键调用路径}
```

**二、编码上下文加载（遵循但不阻断）**

从 project-profile.md + 前后端 context 文件 + `.outdocs/api-doc.md`，加载本次编码的约束上下文：

**始终加载（project-profile.md）**：

| 区块                 | 编码时的约束作用                                 |
| -------------------- | ------------------------------------------------ |
| 项目铁律             | 一、铁律检查已处理                               |
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

**三、UI 上下文加载（前端改动时）**

查 project-profile.md「PRD 内容索引」+ DES 前端部分，加载 UI 编码约束：

1. **PRD 视觉内容**：读取当前任务涉及的 `.docs/prd/` 图片文件（通过索引定位，实际读取原始图片）
2. **DES UI 方案**：读取 DES 中的 UI 还原维度（布局/组件选择/交互还原/字段映射）
3. **样式体系**：读取 frontend-context.md「样式体系」（CSS 变量/主题/公共样式）
4. **组件库**：读取 frontend-context.md「公共组件」（已有组件清单 + 用法）

- PRD 无视觉内容且 DES 无 UI 还原维度 → 跳过此步

加载后输出：

```
【编码上下文】
  - 遵循规范：{context 文件中的项目规范关键点}
  - 复用已有：{context 文件中的内部公共能力 + 已有接口}
  - 架构约束：{分层/路由注册/数据库访问方式}
  - 禁止事项：{context 文件中的禁止行为}
  - UI 基准：{PRD 视觉内容文件名 + 页面核心布局}（前端改动时）
  - 组件映射：{PRD UI 元素 → 使用的组件库组件}（前端改动时）
  - 样式约束：{遵循的 CSS 变量/主题/间距体系}（前端改动时）
```

**Step 1：加载 Spec**

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
| `pending`  | 尚未开始（Code Gate 未拦截成功的情况下） | 回退到 §2.1 补写 spec |

**Skill 状态（index.md 两列独立管理）**：

| 列名 | 值 | 含义 | 处理 |
| --- | --- | --- | --- |
| coding-skill | `pending` | 未处理 | Step 4 按下方规则判断是否需要调用编码 Skill |
| coding-skill | `done` | 已处理（Skill 已执行 或 有 context 文件无需 Skill） | Step 4 跳过 Skill，直接编码 |
| coding-skill | `fallback` | Skill 安装失败，用户确认兜底 | Step 4 使用内置规约 C-01~C-10 |
| audit-skill | `pending` | 未处理 | Step 5 按下方规则判断是否需要调用审计 Skill |
| audit-skill | `done` | 审计 Skill 已执行 | Step 5 跳过 Skill |
| audit-skill | `fallback` | Skill 安装失败，用户确认兜底 | Step 5 使用内置规约 S-01~S-07 |

**Step 2：文档学习（按需）**

先查 project-profile.md「外部依赖」和对应 context 文件（前端 → frontend-context.md；后端 → backend-context.md）的「构建与运行」「项目架构」「内部公共能力」，已覆盖则跳过。涉及数据库操作时，加载 `.project/reverse-scan/db-schema.md`（存在时）确认相关表结构和字段约束。未覆盖时，优先从 `.docs/` 中查找。`.docs/` 也未覆盖且涉及未记录的 API / 库时触发：

```
【文档学习确认】
本次任务涉及 {API/库名}，是否有文档需要我先学习？
支持：A. 在线链接  B. PDF  C. 粘贴内容  D. 放入 .docs/tech/ 目录
```

学习后输出摘要，反填 `project-profile.md`「外部依赖」区块。

**Step 3：评估影响面**

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
  结论：{影响范围可控，继续 / 影响面超出当前通道预期，触发停车信号}
```

**Step 4：执行代码变更**

- **task.md 联动（feature 类型，或 refactor 有 task.md 时）**：编码开始前，将当前子任务 status 更新为 `in-progress`
- 符合 `.project/specs/` 规范
- **编码 Skill 调用判断**：检查 index.md 当前模块的 `coding-skill` + context 文件是否存在：
  - `coding-skill` 为 `done` 或 `fallback` → 已处理，跳过
  - `coding-skill` 为 `pending` 且对应 context 文件已存在（frontend-context.md / backend-context.md）→ **跳过编码 Skill**，以 context 文件为编码规范，更新 `coding-skill` 为 `done`
  - `coding-skill` 为 `pending` 且 context 文件不存在（新项目脚手架刚建好）→ 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用编码 Skill（前端 /frontend-coding，后端 /java-coding），**必须输出 Skill 执行日志**，完成后更新 `coding-skill` 为 `done` 或 `fallback`
  - **Bug / Refactor 无 affected-module 时**：跳过 index.md 状态检查，仅按 context 文件是否存在决定（有 → 以 context 为规范编码；无 → 调用编码 Skill），Skill 执行后不更新 index.md
- 编码时必须遵循 Step 0 加载的编码上下文（铁律 + context 文件规范 + 内部公共能力 + 架构约束 + 知识卡片中的已有函数），复用已有能力，禁止重复封装
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

| #    | 规约             | 要求                                          |
| ---- | ---------------- | --------------------------------------------- |
| U-01 | 布局还原         | 页面结构必须与 PRD 视觉内容一致（区域划分/层级/排列方式）|
| U-02 | 组件还原         | 使用 DES 指定的组件库组件，禁止自行替换       |
| U-03 | 交互还原         | 按钮/表单/跳转行为必须与 PRD + DES 定义一致   |
| U-04 | 字段还原         | 字段名称/顺序/必填标记必须与 PRD 内容一致     |
| U-05 | 状态还原         | 加载中/空状态/错误状态/成功状态必须按 DES 实现 |
| U-06 | 样式遵循         | 使用项目已有 CSS 变量/主题/公共样式，禁止硬编码颜色/字号 |

**Step 5：代码审计**

- 检查 index.md 当前模块的 `audit-skill`：
  - `audit-skill` 为 `done` 或 `fallback` → 已处理，跳过 Skill 流程
  - `audit-skill` 为 `pending` → 读取 {SKILL_DIR}/rules/skill-routing.md，按 Skill 执行流程调用 /code-audit Skill，**必须输出 Skill 执行日志**，完成后更新 `audit-skill` 为 `done`（或 `fallback`）
  - **Bug / Refactor 无 affected-module 时**：跳过 index.md 状态检查，直接调用 /code-audit Skill（或已执行则跳过），Skill 执行后不更新 index.md
- **融合优先级**：
  - 有 context 文件时：project-profile.md 铁律 > context 文件 > {SKILL_DIR}/rules/quality-standards.md 代码审计标准
  - 无 context 文件时（新项目）：project-profile.md 铁律 > Skill(/code-audit) 规范 > {SKILL_DIR}/rules/quality-standards.md 代码审计标准
- 按 S-01~S-07 逐项检查（标准见 {SKILL_DIR}/rules/quality-standards.md），不通过项当场修复，修复后重新检查该项，直到全部通过。单项修复超 3 次仍未通过 → 触发停车信号（列出未通过项，请用户判断）
- 全部通过后输出审计报告，并以模块章节形式追加到 `.outdocs/audit-report.md`：

```
【代码审计报告】
结论：PASS
检查项：{N}/7 通过 | 修复：{N} 项

- S-01 空值防御：✅
- S-02 前端输入信任：✅（已修复：{修复内容}）
- S-03 Spec 一致性：✅
- S-04 性能回归：✅
- S-05 权限校验：✅
- S-06 能力复用：✅
- S-07 UI 还原度：✅（前端改动时检查）

[UI 审计]（前端改动时附加）
- U-01 布局还原：✅
- U-02 组件还原：✅
- U-03 交互还原：✅
- U-04 字段还原：✅
- U-05 状态还原：✅
- U-06 样式遵循：✅
```

**Step 6：开发自测**

- 优先读取 .project/specs/rules/unit-test-base.md（团队自定义自测规则）
- 文件不存在 → 使用 {SKILL_DIR}/rules/quality-standards.md 中开发自测标准（T-01~T-06）
- 逐项验证，不通过项回 Step 4 修复代码，修复后重新执行 Step 5 + Step 6
- **自愈循环上限**：Step 4→5→6 的修复循环累计不超过 5 次。超过 5 次 → 触发停车信号（报告错误模式，建议检查 Spec）
- 全部通过后输出自测报告，并以模块章节形式追加到 `.outdocs/test-report.md`：

```
【开发自测报告】
结论：PASS
检查项：{N}/7 通过 | 修复：{N} 项 | 回归次数：{N}

[前端验证]
- T-01 交互逻辑：✅ 验证页面：{页面列表}
- T-02 页面跳转：✅ 验证路径：{路径列表}
- T-03 页面渲染：✅

[后端验证]
- T-04 接口可用性：✅ 验证接口：{接口列表}
- T-05 边界覆盖：✅ 覆盖场景：{场景列表}
- T-06 返回值正确性：✅
```

**Step 6.5：更新 task.md（feature 类型，或 refactor 有 task.md 时，AI 自动执行）**

- 将当前子任务 status 更新为 `done`
- 更新 task.md 模块总览表的计数
- 检查当前模块是否还有 pending 子任务：
  - 有 → 回到门禁自检，自动定位下一个子任务，继续编码循环
  - 无 → 继续 Step 7，进入归档

**Step 7：生成 Changelog**

文件路径：`.project/changelog/{YYYY-MM-DD}-{xx}-{简述}.md`

```markdown
### [{Bug/Feature/Refactor}] {描述} - {YYYY-MM-DD HH:mm}
- **背景**: {需求背景或 Bug 表现}
- **解决方案**: {技术实现}
- **影响模块**: {模块列表}
- **影响代码**: {核心文件}
```

**Step 7.5：更新 specs 状态（AI 自动执行）**

- 更新 index.md 中对应模块的 sync-status 为 `synced`（feature 类型）
- 写入 change-log-specs.md 记录本次变更（操作人: AI，触发源: `[specs]`）
- **Bug / Refactor 类型文档级联**（REQ 头部有 `affected-module` 时执行，否则跳过）：
  a. 读取 DES 的「受影响 Spec 变更清单」，定位受影响模块的已有 DES 文件
  b. 按变更清单更新受影响模块 DES 的对应部分（核心流程 / 异常处理 / API 定义 / 状态管理 / 数据模型），在变更处标注 `<!-- {Bug fix / Refactor}: {REQ 编号} {日期} -->`
  c. DES 含 API 行为变更 → 同步更新 `.outdocs/api-doc.md` 对应章节
  d. 更新 index.md 受影响模块的 sync-status 为 `synced`（DES 已同步更新）
  e. 写入 change-log-specs.md：记录受影响模块 DES 的级联更新（操作人: AI，触发源: `[bug-fix]` 或 `[refactor]`）

> 快速通道和标准通道共用此步骤。

**Step 8：写入 context.md（AI 自动执行）**

```markdown
### {YYYY-MM-DD} {任务简述}
- **完成内容**: {具体到文件级别}
- **遗留问题**: {如有，否则填"无"}
- **下一步建议**: {方向}
```

完成后 → 进入 {SKILL_DIR}/rules/phase-archive.md 归档检查。
