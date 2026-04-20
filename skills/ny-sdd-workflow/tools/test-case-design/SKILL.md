---
name: test-case-design
description: >
  以测试工程师视角，为已通过评审的需求/设计生成**功能测试用例集**。
  输入 REQ/DES/PRD 等结构化文档，输出 TC 文档（含元数据、覆盖率矩阵、自审报告、用例正文）+ CSV 导出（禅道/飞书导入）。
  采用 6 种经典测试设计方法论（等价类/边界值/判定表/场景法/状态迁移/错误推测），确保功能测试覆盖完整。
  产出的功能测试用例供 QA 手工执行、导入测试管理平台，或作为未来 E2E 测试 Skill 的输入。
  单元测试用例设计与代码生成由姊妹 Skill unit-test-generator 独立负责。
  中文触发词：生成测试用例、设计测试用例、测试用例设计、出一份测试用例、写测试方案、测试工程师视角、QA 测试用例、从 REQ/DES 生成测试、帮我写测试、按需求生成测试、设计 test case。
  英文触发词：test case design, generate test cases, QA test plan, design test cases, create test plan.
  SDD 工作流触发：§2.5 测试用例设计、方案评审通过后、进入测试用例设计阶段、REQ DES 评审通过。
  不适用：仅样式/文案的快速通道改动、单纯运行已有测试（不是设计阶段）、纯手工探索性测试指引、
  代码审计（用 code-audit skill）、需求审计（用 prd-audit skill）。
---

# 测试用例设计 Skill

以测试工程师视角，接受结构化需求/设计文档，输出一份**既可人工阅读又可 AI 自动执行**的完整测试用例集。

**核心承诺**：生成的 TC 文档每条用例都带 `tc-exec` 执行契约（Markdown-native 格式），后续的自测阶段 AI 可以直接解析并调用工具执行；QA 人工管理可以用并行导出的 CSV 文件直接导入测试管理工具。

**本 Skill 的职责边界**：
- ✅ **测试工程师视角**：从 REQ/DES/PRD 设计测试用例（"测什么"）
- ✅ 应用 6 种方法论（等价类 / 边界值 / 判定表 / 场景法 / 状态迁移 / 错误推测）
- ✅ 生成 TC 文档（Markdown + tc-exec 契约）和 CSV 导出
- ❌ **不生成单元测试代码**（"怎么写"）→ 请用姊妹 Skill `/unit-test-generator`

**两个 Skill 的分工**：
- `test-case-design`（本 Skill）→ 产出功能测试用例文档（manual/ui-dom/ui-visual channel）
- `unit-test-generator` → 独立设计单测用例 + 生成代码 + 执行（unit/api/db channel）
- 两者独立，无上下游依赖

---

## 适用范围

Skill 支持两种使用模式，**首次调用时 Step 0 自动识别**：

| 模式 | 触发条件 | 输入来源 | 输出位置 |
|---|---|---|---|
| **SDD 项目** | 项目含 `.project/specs/master/` + `project-profile.md` | SDD 标准路径（REQ/DES/PRD 从 .project/ 读） | `.test/testcases/` |
| **非 SDD 项目** | 其他所有情况 | 调用方提供的路径或粘贴内容 | 用户指定 `output_dir`，默认 `./test-cases/` |

两种模式共享 Step 1~7 的核心逻辑，仅在**输入加载**和**输出落盘**两端有差异。

---

## 覆盖的测试层级（重要说明）

**本 Skill 生成的是面向 QA 测试工程师的"测试用例库"（功能测试用例为主），不是单元测试代码。**

### TC 文档结构（功能测试聚焦）

| 章节 | 测试类型 | channel | 来源 |
|---|---|---|---|
| 一、业务流程测试 | 正常/异常业务流程验证（场景法 + 状态迁移） | `manual` | REQ 验收标准 |
| 二、UI 交互测试 | 前端 DOM 操作验证（页面跳转/表单提交/状态切换） | `ui-dom` | DES UI 还原 + PRD 视觉内容 |
| 三、视觉回归测试 | 页面视觉一致性验证 | `ui-visual` | PRD 视觉内容 + prototype-spec.md |
| 四、异常与边界测试 | 异常路径/边界条件/错误处理验证 | `manual` | DES 异常分支 + bug 复现 + refactor 等价性 |
| 五、覆盖率矩阵 | REQ 验收标准 ↔ TC 用例交叉比对 | — | 全部 TC 汇总 |

**合法 channel（仅 3 个）**：`manual` / `ui-dom` / `ui-visual`

> 单元测试（unit/api/db channel）由姊妹 Skill `/unit-test-generator` 独立负责，不在本 Skill 范围内。

### 产物定位

- **TC 文档** (`.md`)：主产物，描述"测什么、怎么判断通过"，供 QA 手工执行或未来 E2E Skill 消费
- **CSV 导出** (`.csv`)：QA 人工管理版本，可导入测试管理平台（TestRail/Zephyr/Xray/禅道/飞书多维表格）

### 与 unit-test-generator 的关系

```
test-case-design（本 Skill）→ 功能测试用例（manual/ui-dom/ui-visual）
  · QA 手工执行
  · 导入禅道/飞书
  · 未来 E2E Skill 的输入

unit-test-generator（独立 Skill）→ 单元测试（unit/api/db）
  · 自主设计单测用例 + 生成代码 + 执行 + 报告
  · 两者独立，无上下游依赖
```

**一句话定位**：本 Skill 是 **AI 化的 QA 测试工程师**——从需求/设计文档推导"系统应该做什么"，产出完整的功能测试用例集；它不是"从代码生成单测"的工具。

---

## 输入契约

Skill 通过对话上下文接受以下字段。调用方（SDD workflow 或独立用户）需在调用语句中明确提供：

| 字段 | 必需/可选 | 类型 | 缺失时行为 |
|---|---|---|---|
| `requirement_source` | **必需** | 文件路径 或 完整文本块 | Skill 停止并提示"请提供 REQ / PRD / DES 至少一个结构化文档，≥200 字符" |
| `task_type` | **必需** | `feature` / `bug` / `refactor` | 交互式询问，不接受 AI 猜测 |
| `output_dir` | **必需** | 目录路径 | SDD 项目有默认值，非 SDD 项目交互式询问 |
| `design_source` | 可选 | DES 文件路径 或 文本 | 从 `requirement_source` 推断，TC 头部标注 `inferred-des: true` |
| `prd_source` | 可选 | PRD 文件路径 或 图片（支持 A 档文本 + B 档图片共 13 种格式，详见 `references/prd-format-handlers.md`） | 跳过 UI 测试章节，第四章标"不涉及" |
| `runtime_source` | 可选 | `.test-env.md` 路径 | 按项目根默认路径查找；仍不存在则 Y 警告 + 全 manual 降级 |
| `reverse_scan_hint` | 可选 | 已有代码深度扫描产出目录 | 跳过"已有函数/惯例"检索 |
| `output_format` | 可选 | `md` / `csv` / `md+csv` | 默认 `md+csv`，同时生成 TC 文档和 CSV 导出文件 |
| `csv_template` | 可选 | `detailed` / `traditional` / `both` | 默认 `detailed`。`detailed` = 12 列技术追溯版；`traditional` = 7 列传统 QA 版（禅道/飞书友好）；`both` = 同时产出两份 |
| `csv_headers_lang` | 可选 | `en` / `zh` | 对 detailed 默认英文，对 traditional **默认中文**；显式传值可统一强制两种模板的表头语言 |

> **注意**：本 Skill 不再接受 `framework_hint` 参数。单测代码派生由姊妹 Skill `/unit-test-generator` 负责，它以本 Skill 产出的 TC 文档作为输入。

**最小输入门槛**：

1. `requirement_source` 必须是**可识别的结构化文档**：
   - 有明确章节/段落结构（≥2 段落 或 ≥1 Markdown 标题）
   - 包含至少一条可识别的"功能描述"或"验收条件"语义
   - 字符数 ≥200（排除"做个登录页"之类的一句话指令）
2. `task_type` 必须显式提供或在 Step 1 交互式询问得到
3. `output_dir` 必须显式或通过模式推断出来

任一必需字段不满足 → Skill 立即停止并列出缺失项。

---

## 工作流程

### Step 0: 项目环境检测

**目的**：检测当前是否在 SDD 项目中，自动确定默认输入/输出路径。不影响核心功能（功能测试用例设计），仅影响路径默认值。

**动作**：
1. 检查当前工作目录下：
   - 存在 `.project/specs/master/` 目录 且 `.project/specs/rules/project-profile.md` 存在？
2. 存在 → **SDD 项目**：自动填充默认路径（输入从 `.project/` 读取，输出到 `.test/testcases/`）
3. 不存在 → **非 SDD 项目**：由用户提供输入和指定输出路径

**输出**：

```
【项目环境】
  SDD 项目: {是 / 否}
  默认输入: {.project/specs/master/ / 用户提供}
  默认输出: {.test/testcases/ / 用户指定}
```

### Step 1: 输入契约解析 + 门槛检查 + 加载输入内容

**目的**：解析输入契约，校验最小门槛，加载实际文档内容。

**动作**：

1. **解析契约字段**：从对话上下文中识别 `requirement_source` / `task_type` / `output_dir` / 可选字段
2. **必需字段检查**：
   - `requirement_source` 缺失 → 停止，提示"请提供 REQ / PRD / DES 至少一个结构化文档"
   - `task_type` 缺失 → 交互式询问：

     ```
     【任务类型确认】
     请选择本次测试用例设计的任务类型：
       A. feature - 新增功能
       B. bug - Bug 修复（需要复现用例 + 回归用例）
       C. refactor - 技术重构（需要等价性断言用例）
     ```
   - `output_dir` 缺失：
     - SDD 项目 → 默认 `.test/testcases/`（按 SDD v1.0 规范，文件名含模块编号区分）
     - 非 SDD 项目 → 交互式询问：

       ```
       【输出位置】
       TC 文档和单测骨架将写到哪里？
         A. ./test-cases/（默认，推荐）
         B. 指定其他目录（请提供路径）
         C. 只输出到对话不落盘
       ```

3. **最小门槛校验**（对 `requirement_source`）：
   - 字符数 ≥200？
   - 有章节结构（至少 2 段或 ≥1 Markdown 标题）？
   - 包含可识别的"功能描述"或"验收条件"？
   - 任一不满足 → 停止：

     ```
     【输入不满足最小门槛】
     requirement_source 需要：
       - 字符数 ≥200（当前: {N}）
       - 有章节结构（当前: {有/无}）
       - 含功能描述或验收条件（当前: {有/无}）
     请提供结构化的 REQ / PRD / DES 文档。
     ```

4. **加载输入内容**（多格式处理，按 `references/prd-format-handlers.md` 规则）：

   - **`requirement_source`** 读取：
     - 文件路径 → Read 工具读取；若是 A 档文本格式（`.md`/`.txt`/`.html`）直接解析；其他格式按 prd-format-handlers.md 的降级路径处理
     - 文本块 → 直接使用

   - **`design_source`** 读取（同上规则，若提供）

   - **`prd_source`** 读取（多格式，最复杂）：
     - 支持 A 档（`.md`/`.markdown`/`.mdx`/`.txt`/`.html`/`.htm`）和 B 档（`.png`/`.jpg`/`.jpeg`/`.webp`/`.gif`/`.svg`/`.bmp`/`.tiff`）共 13 种格式
     - A 档文本 → Read 直读，按 prd-format-handlers.md 的 8 类信息提取
     - B 档图片 → Read 加载后 Claude 多模态视觉识别，按 prd-format-handlers.md 的 7 类 UI 信息提取（布局/组件/字段/交互/状态/导航/视觉规格）
     - 多文件混合 → 按 prd-format-handlers.md 的合并规则（文本权威 + 图片补充 + 冲突检测）
     - 不支持格式（C/D/E 档如 PDF/DOCX/XLSX/视频）→ 提示用户转为 A/B 档或跳过
     - 全部 PRD 都不可用 → **触发停车信号**，拒绝在无 PRD 输入下猜测生成用例

   - **`reverse_scan_hint`** 目录（若提供，加载相关知识卡片）

5. **输出加载清单**：

```
【输入加载清单】
  模式: {SDD / 独立}
  任务类型: {feature/bug/refactor}
  输入:
    - requirement_source: ✅ 已加载 {path} ({N} 字符)
    - design_source: ✅ 已加载 {path} / ❌ 未提供，将从 requirement 推断
    - prd_source: ✅ 已加载 {N} 个文件 / ❌ 未提供，跳过 UI 章节
      · A 档文本: {n} 个 ({filename 列表})
      · B 档图片: {n} 个 ({filename 列表})
      · 跳过: {n} 个 (不支持的格式 / 读取失败)
    - reverse_scan_hint: ✅ / ❌
  输出目录: {path}
  输出格式: {md / csv / md+csv}
```

**合并报告**（`prd_source` 含多文件时额外输出，详见 `references/prd-format-handlers.md` 第三章）：

```
【PRD 合并加载报告】
  总文件数: {N}
  按档位分布:
    - A 档（文本）: {n} 个
    - B 档（图片）: {n} 个
  合并策略: {以文本为权威 / 仅文本 / 仅图片}
  冲突: {N} 处
  跳过: {N} 个
  提取到的关键信息:
    - 验收标准条数: {N}
    - API 定义数: {N}
    - 数据模型字段数: {N}
    - UI 组件数: {N} （来自图片）
    - 页面状态数: {N} （来自图片）
```

### Step 2: 加载 runtime + 能力评估

**目的**：读取运行时配置，评估每个 channel 是否可执行。

**动作**：

1. **`.test-env.md` 不需要**：
   - 本 Skill 只产出功能测试用例（manual/ui-dom/ui-visual channel），这些 channel 不涉及代码自动执行
   - `.test-env.md` 是 unit-test-generator 的运行时配置，与本 Skill 无关
   - 跳过 runtime 加载，直接进入 Step 3

4. **能力评估**：基于 `mcp_capabilities` 为每个 channel 打标：

| channel | 说明 |
|---|---|
| `manual` | 人工手工执行（永远可用） |
| `ui-dom` | 前端 DOM 交互（需 Playwright 或未来 E2E Skill 执行） |
| `ui-visual` | 视觉回归（需截图对比工具或人工目视） |
| `ui-dom` | `mcp_capabilities` 含 `playwright` 或 `browser` |
| `ui-visual` | 永远不可自动（永远 `manual` 执行模式） |
| `manual` | 永远不可自动（兜底） |

**输出**：

```
【功能测试 channel】
  合法 channel: manual / ui-dom / ui-visual
  ui-dom 执行方式: 未来 E2E Skill 或 Playwright
  ui-visual 执行方式: 视觉对比工具或人工目视
  manual 执行方式: QA 手工执行
```

### Step 3: 选择策略 + 应用方法论生成用例蓝本

**目的**：按 `task_type` 选择差异化策略，应用 6 种方法论生成用例蓝本（尚未写 tc-exec 块）。

**动作**：

1. **按 task_type 选择策略**（引用 `references/design-rules.md` 第三章）：

   | task_type | 策略 |
   |---|---|
   | feature | 4 章全量（业务流程/UI 交互/视觉回归/异常边界），6 种方法论全套 |
   | bug | 聚焦第五章（复现用例 + 回归用例），其他章节按 bug 影响域补充 |
   | refactor | 聚焦等价性断言（禁止基于实现细节），第五章为核心 |

2. **应用 6 种方法论**（引用 `references/design-rules.md` 第一章）：

   - **场景法** → 主要用于第一章 功能测试用例
   - **等价类划分** → 第一/二章，字段有效/无效分类
   - **边界值分析** → 第二/三章，覆盖 min/max/越界/空/超长/特殊字符
   - **判定表** → 第一/三章，条件数 ≥2 时构造真值表
   - **状态迁移** → 第一章 业务流程测试（状态流转场景）
   - **错误推测** → 第五章 异常与回归用例

3. **生成用例蓝本清单**（每条含以下字段）：

   - 描述（一句话）
   - 关联 REQ 章节
   - 关联 DES 维度
   - 初拟 channel
   - 方法论
   - 优先级（P0/P1/P2）

**输出**：

```
【用例蓝本清单】（共 {N} 条）
  第一章 功能测试: {n} 条
  第二章 接口测试: {n} 条
  第三章 数据/状态: {n} 条
  第四章 UI 测试: {n} 条
  第五章 异常/回归: {n} 条
  
  方法论分布:
    - 场景法: {n}
    - 等价类划分: {n}
    - 边界值分析: {n}
    - 判定表: {n}
    - 状态迁移: {n}
    - 错误推测: {n}
```

### Step 4: 分配 channel + 编写 tc-exec 块

**目的**：为每条蓝本用例最终确定 channel，并按 tc-exec Markdown 格式逐条写执行块。

**动作**：

1. **channel 最终分配**（引用 `references/channel-playbooks.md` 的决策树）：
   - 按用例性质选 channel
   - 对比 Step 2 的可执行性清单
   - 不可执行的 channel 强制降级（降级链：`ui-dom → ui-visual → manual`）

2. **逐条编写功能测试用例**（步骤 + 预期结果格式）：

   ```
   #### TC-F-{module_id}-{seq:03} {描述}

   **channel**: {x} | **priority**: {x} | **exec-mode**: {x} | **source**: REQ-{xx} 验收标准 #{N} 或 DES-{section}（溯源到需求/设计文档）

   **请求**:
   ​```{fence 语言}
   {请求内容}
   ​```

   **前置**:
   - `{动作}`

   **断言**:
   - `{path} {op} {expected}`

   **清理**:
   - `{动作}`
   ```

3. **格式强制规则**：
   - 所有断言操作符必须在 15 个固定枚举内（`==` / `!=` / `>` / `>=` / `<` / `<=` / `exists` / `not_exists` / `type` / `regex` / `contains` / `not_contains` / `length==` / `length>=` / `length<=`）
   - 所有断言用行内反引号 `` `...` `` 包裹
   - 每行一条原子断言，禁止合并
   - 所有 `${env.xxx}` 变量必须在 `.test-env.md` 中存在，否则 Skill 报错并指出具体变量路径

4. **channel 使用示例请参考** `references/channel-playbooks.md`，每个 channel 都有完整模板和"常见错误"清单。

### Step 5: 自审（TC-01 ~ TC-06 + 一致性校验）

**目的**：按 TC-01 ~ TC-06 审计规则逐项检查，同时强制 Markdown 描述与 tc-exec 块的语义对齐。

**动作**：

1. **TC-01 ~ TC-06 逐项自审**（引用 `references/design-rules.md` 第二章）：

   - TC-01 验收标准覆盖
   - TC-02 DES 维度覆盖
   - TC-03 边界值覆盖
   - TC-04 异常路径覆盖
   - TC-05 用例可执行（无模糊描述黑名单词）
   - TC-06 优先级合理（P0 占比 ≤50%）

2. **一致性校验**（强制语义对齐）：
   - 遍历每条用例
   - 检查 Markdown 描述中的"前置条件" ↔ `**前置**` bullet 是否语义一致
   - 检查"测试步骤" ↔ 请求 fence block 是否语义一致
   - 检查"预期结果" ↔ `**断言**` bullet 是否语义一致
   - 任一不一致 → 修复描述或 tc-exec 块，使两者等价

3. **不通过项当场修复**：
   - 单项修复**超 3 次仍未通过** → 触发停车信号，向用户报告

4. **任务类型差异化检查**（引用 `references/design-rules.md` 第三章）：
   - feature: 全量检查 + 前端任务的 UI 章节
   - bug: 额外检查 `affected-module` 字段 + 复现用例 + 回归清单
   - refactor: 额外检查"禁用实现细节"

**输出**：

```
【自审报告】
  TC-01 验收标准覆盖: ✅ / ❌ {详情}
  TC-02 DES 维度覆盖: ✅ / ❌ {详情}
  TC-03 边界值覆盖: ✅ / ❌ {详情}
  TC-04 异常路径覆盖: ✅ / ❌ {详情}
  TC-05 用例可执行: ✅ / ❌ {详情}
  TC-06 优先级合理: ✅ / ❌ {详情}
  一致性校验: ✅ / ❌ {详情}
  修复次数: {总次数}
  结论: PASS / FAIL
```

全部 ✅ 才能进入 Step 6。任一 ❌ 回 Step 3/4 修复。

### Step 6: 组装 TC 文档 + CSV 并行输出 + 写盘 + 回执输出

**目的**：按 `tc-doc-template.md` 的骨架组装 TC 文档；按 `csv-export-schema.md` 并行生成 CSV 导出文件；两份文件一起写盘并输出执行回执。

**动作**：

1. **按 `references/tc-doc-template.md` 第三章的 9 步组装顺序**组装 TC-xx.md：
   1. 计算元数据（total-cases、channel-breakdown、executable-rate）
   2. 组装覆盖率矩阵（4 列）+ 覆盖率统计 + 方法论统计
   3. 粘贴自审报告
   4. 组装用例总览表（6 列）
   5. 组装第一章 业务流程测试（channel=manual，场景法+状态迁移+等价类）
   6. 组装第二章 UI 交互测试（channel=ui-dom，或标"不涉及"）
   7. 组装第三章 视觉回归测试（channel=ui-visual，或标"不涉及"）
   8. 组装第四章 异常与边界测试（channel=manual，错误推测+边界值+回归）
   9. 组装第五章 覆盖率矩阵 + 第六章 不测范围

2. **按 `references/csv-export-schema.md` 并行组装 CSV 文件**（当 `output_format` 含 `csv` 时执行，按 `csv_template` 决定产出模板）：
   - 从 Step 3 的用例蓝本对象列表直接投影（**不解析 TC-xx.md**）
   - 多行字段用方案 C 格式（`1) ... ; 2) ... ; 3) ...`）
   - UTF-8 with BOM 编码（首 3 字节 `EF BB BF`）
   - RFC 4180 引用和转义
   - 行结束 `\r\n`
   
   **按 `csv_template` 参数决定产出**：
   
   | `csv_template` 值 | 产出文件 | 字段数 | 默认表头语言 |
   |---|---|---|---|
   | `detailed`（默认） | `{output_dir}/testcases.detailed.csv` | 12 列 | 英文（受 `csv_headers_lang` 控制） |
   | `traditional` | `{output_dir}/testcases.traditional.csv` | 7 列 | **中文**（受 `csv_headers_lang` 控制） |
   | `both` | `{output_dir}/testcases.detailed.csv` + `{output_dir}/testcases.traditional.csv` | 12 + 7 | detailed 英文 + traditional 中文 |

   > **SDD 模式下 CSV 为全局汇总**：首次生成时写入表头 + 数据行，后续模块追加数据行（不重复表头）。Module 列标识所属模块。
   
   **`both` 模式的重要约束**：两份 CSV 必须基于**同一批用例蓝本**（Step 3 冻结后的蓝本），保证 `TC_ID` / `Priority` / `Module` / `Title` / `Preconditions` / `Test_Steps` / `Expected_Result` 7 个共同字段**值完全一致**。
   
   字段映射表见 `csv-export-schema.md`：
   - detailed 模板：第八章"与 TC 文档的关系"
   - traditional 模板：第 11.5 节"字段映射表"

3. **写入文件**：
   - `{output_dir}/TC-F-{module_id}-{module_name}.md`（若 `output_format` 含 `md`）
   - CSV 文件按 `csv_template` 产出（见上表）
   - 目录不存在则创建
   - 文件已存在则覆盖（SDD 项目下由 workflow 控制；非 SDD 项目下提示用户确认）

4. **组装完成后自检**：
   - TC-xx.md 自检（引用 `tc-doc-template.md` 第六章 12 项）：文件名/元数据/total-cases/channel-breakdown/覆盖率矩阵/变量引用
   - detailed CSV 自检（引用 `csv-export-schema.md` 第十章 12 项）：BOM/表头/列数/必填字段/枚举值/方案 C 格式/行数/与 md 一一对应
   - traditional CSV 自检（引用 `csv-export-schema.md` 第 11.7 节 11 项）：同上 + 与 detailed 共同字段值一致
   - `both` 模式追加"跨模板一致性"校验：两份 CSV 的 TC_ID 顺序和共同字段值必须完全一致

5. **输出执行回执到对话**：

   ```
   【test-case-design 执行回执】
     项目环境: {SDD 项目 / 非 SDD 项目}
     模块: {module_id}-{module_name}
     任务类型: {feature/bug/refactor}
     输出格式: {md / csv / md+csv}
     
     产出文件:
       - TC 文档 (AI 可执行): {绝对路径}/TC-F-{module_id}-{module_name}.md
       - CSV 导出 (detailed, 12 列技术追溯): {output_dir}/testcases.detailed.csv（全局汇总，追加模式）
       - CSV 导出 (traditional, 7 列传统 QA): {output_dir}/testcases.traditional.csv（全局汇总，追加模式）
         （当 csv_template = both 时产出两份，单一模板只产出一份）
     
     覆盖率:
       - REQ 验收标准: {N}/{M} = 100%
       - DES 维度覆盖: 数据✅ / API✅ / 流程✅ / 状态✅ / 权限✅ / UI✅
     
     用例分布:
       - 总数: {N}
       - 按章节: 功能({n}) / 接口({n}) / 数据状态({n}) / UI({n}) / 异常({n})
       - 按通道: manual({n}) / ui-dom({n}) / ui-visual({n})
       - 可执行率: {%}
     
     PRD 来源:
       - A 档文本: {n} 个 ({filename 列表})
       - B 档图片: {n} 个 ({filename 列表})
     
     自审: PASS / FAIL
     
     下一步建议:
       - Markdown TC 文档供 AI 执行或人工评审
       - CSV 可导入 TestRail / Zephyr / Xray / 禅道 / 飞书多维表格（导入指南见 references/csv-export-schema.md 第七章）
       - **派生可跑单测代码**: 如果需要单测骨架代码，用姊妹 Skill `/unit-test-generator` 消费本次生成的 TC 文档：
         `"用 unit-test-generator 读 {tc_path} 生成 {jest/vitest/junit5/pytest/gotest} 单测到 {output_dir}/skeleton/"`
   ```

6. **SDD 项目额外追加 post-processing 提示**：

   ```
   【SDD post-processing 提示】
     请 SDD workflow（§2.5 调用方）执行以下后处理：
       1. 读取 TC 文档头部的元数据，更新 index.md 的 test-case-status 列为 {done / doc-only}
       2. 如需单测代码：继续调用 /unit-test-generator Skill（SDD §2.5 Step 2.5）
          它会消费本 Skill 产出的 TC 文档，派生骨架到 {output_dir}/skeleton/
       3. 在 .project/specs/change-log-specs.md 留痕（触发源 [test-case]）
       4. 在 .project/context.md 追加：{日期} {module} 测试用例设计完成（{N} 条用例）
   ```

---

## 输出回执模板（完整示例）

非 SDD 项目的回执示例：

```
【test-case-design 执行回执】
  模式: 非 SDD 项目
  模块: login
  任务类型: feature
  输出格式: md+csv
  
  产出文件:
    - TC 文档 (AI 可执行): /Users/foo/project/test-cases/TC-F-login-登录.md
    - CSV 导出 (detailed): /Users/foo/project/test-cases/testcases.detailed.csv（追加模式）
    - CSV 导出 (traditional): /Users/foo/project/test-cases/testcases.traditional.csv（追加模式）

  覆盖率:
    - REQ 验收标准: 15/15 = 100%
    - DES 维度覆盖: 数据✅ / API✅ / 流程✅ / 状态✅ / 权限✅ / UI✅

  用例分布:
    - 总数: 20
    - 按章节: 功能(4) / 接口(8) / 数据状态(3) / UI(3) / 异常(2)
    - 按通道: manual(12) / ui-dom(5) / ui-visual(3)
    - 可执行率: 70%

  自审: PASS

  下一步建议: 
    - 查看 TC 文档进行人工评审
    - CSV 导入测试管理工具管理
    - 如需派生单测代码，调用 /unit-test-generator Skill：
      "用 unit-test-generator 读 /Users/foo/project/test-cases/TC-F-login-登录.md 生成 jest 单测"
```

---

## 执行日志格式（SDD 项目）

SDD 项目下，在回执前追加标准 Skill 执行日志（与 ny-sdd-workflow 的 `skill-routing.md` 日志格式一致）：

```
【Skill 执行日志】
  阶段: §2.5 测试用例设计
  Skill: test-case-design
  路径: {SKILL_DIR}/tools/test-case-design/
  安装: 跳过(已存在) / 安装成功 / 安装失败
  执行: 调用 Skill / 内置兜底
  结论: PASS / FAIL
```

---

## 注意事项

1. **职责边界**：本 Skill **不生成单测代码**。Step 6 只组装 TC 文档和 CSV，不调用框架模板。如果需要可跑的单测代码，请用姊妹 Skill `/unit-test-generator` 消费本 Skill 产出的 TC 文档。

2. **Token 预算**：完整执行一次 Skill 对 20 条用例的模块约需 15-30K tokens（拆分后比单一 Skill 少约 20%）。对 50+ 条用例的大模块建议拆分子模块分批生成。

3. **一致性是底线**：Step 5 的一致性校验是 Skill 的质量门禁。宁可回到 Step 3/4 重写，也不能放过"描述和 tc-exec 不等价"的用例——这种用例会让下游 unit-test-generator 派生错误代码。

4. **不要 AI 自由发明操作符**：15 个断言操作符、6 个 mcp 枚举、3 个功能测试 channel（manual/ui-dom/ui-visual）都是**硬约束**。想表达未覆盖的语义，必须用现有组合（比如想表达 `starts_with` 就用 `regex`）。

5. **与 unit-test-generator 独立**：本 Skill 只产出功能测试用例（manual/ui-dom/ui-visual），不使用 tc-exec 的代码执行格式。unit-test-generator 独立处理单元测试（unit/api/db channel）。

6. **非 SDD 项目下的隐式依赖**：用户独立调用时，如果没有 `.test-env.md`，tc-exec 的变量引用会失效。Skill 会在 Step 2 明确警告并提供模板，但不强制用户必须先写（用户可选继续，此时所有用例降级为 manual）。

7. **bug 和 refactor 必须有 `affected-module`**：这是 bug 回归测试和 refactor 等价性断言的起点。缺失时 Skill 会拒绝进入 Step 3，要求用户先定位受影响模块。

8. **refactor 的禁区**：生成 refactor 任务的用例时，禁止断言内部实现细节（如"应该调用了 XX 方法"），只允许断言对外行为（如"给定输入 X，输出应该是 Y"）。这是 refactor 测试的纪律，违反则失去重构的保护价值。

9. **SDD 和非 SDD 项目的切换**：Skill 首次启动时 Step 0 自动识别，不支持在执行中切换模式。如果用户在 SDD 项目里想用非 SDD 项目行为（比如输出到其他目录），通过 `output_dir` 参数覆盖即可，不需要改 Step 0 的识别结果。

---

## 相关规范文件（references/）

本 Skill 的详细规则和模板都在 `references/` 目录下，按需加载：

| 文件 | 何时读取 |
|---|---|
| `references/prd-format-handlers.md` | Step 1（PRD 多格式加载和合并） |
| `references/test-env-template.md` | Step 2（解析 `.test-env.md`） |
| `references/design-rules.md` | Step 3（设计方法论）+ Step 5（自审规则） |
| ~~`references/tc-exec-schema.md`~~ | 已移除（功能测试用例不使用 tc-exec 代码执行格式） |
| `references/channel-playbooks.md` | Step 4（channel 选择 + 模板） |
| `references/tc-doc-template.md` | Step 6（组装 TC 文档） |
| `references/csv-export-schema.md` | Step 6（并行组装 CSV） |

**与 unit-test-generator 的关系**：本 Skill 和 unit-test-generator 完全独立。本 Skill 产出功能测试用例（人工可读格式），unit-test-generator 独立设计和生成单元测试代码。两者无共享文件依赖。

---

## 版本

- **v1.2**: 2026-04-15 CSV 双模板版
  - 新增 `csv_template` 参数（`detailed` / `traditional` / `both`）
  - 新增 traditional 7 列传统 CSV 模板（编号ID/用例等级/功能模块/用例主题/前置条件/执行步骤/预期结果）
  - traditional 模板默认中文表头（更适合 QA 工具和 Excel）
  - detailed 模板保持 12 列 + 默认英文表头（向后兼容）
  - `csv_headers_lang` 可显式强制两种模板的表头语言
  - `both` 模式下两份 CSV 从同一批蓝本派生，保证跨模板一致性

- **v1.1**: 2026-04-14 瘦身版
  - 职责拆分：单测代码派生移到姊妹 Skill `unit-test-generator`
  - 工作流从 8 步瘦身到 7 步（Step 0~6）
  - 移除 `framework_hint` 参数（现由 unit-test-generator 接收）
  - 移除 `references/framework-adapters.md`（搬到 unit-test-generator）
  - 移除 tc-exec-schema.md（功能测试用例不再使用代码执行格式）
  
- **v1.1**: 2026-04-17 功能测试聚焦版
  - 定位明确为"功能测试用例设计"（单元测试交由 unit-test-generator）
  - 去掉多模式概念，改为"项目环境检测"（自动判断 SDD 项目并填充默认路径）
  - TC 用例元数据新增 source 字段（REQ/DES 溯源）
  - SDD 项目默认输出路径改为 `.test/testcases/`
  - .test-env.md 在功能测试层不再必需

- **v1.0**: 2026-04-14 初版
  - 8 步工作流（含单测派生）
  - Markdown-native tc-exec 格式（15 固定操作符）
  - 5 章 TC 文档结构（功能/接口/数据状态/UI/异常）→ v1.1 收窄为 4 章（业务流程/UI 交互/视觉回归/异常边界）
  - PRD 多格式支持（A 档文本 6 种 + B 档图片 7 种，共 13 种扩展名）
  - 并行 CSV 导出（12 列精简 Schema，UTF-8 BOM，兼容 TestRail/Zephyr/Xray/禅道/飞书）
