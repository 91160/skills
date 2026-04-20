# test-case-design

> **测试工程师视角的 AI 测试用例设计 Skill**
> 从需求/设计文档生成 AI-executable 的测试用例集（Markdown + tc-exec 契约 + CSV 导出）。

---

## 这是什么

`test-case-design` 是一个**独立的 AI Skill**，把 QA 测试工程师的工作流程编码进 AI——给它一份 REQ/DES/PRD，它就能产出一份完整的、面向 AI 自动执行的测试用例文档。

**核心承诺**：

1. **AI 友好**：每条用例自带 `tc-exec` 执行契约（Markdown-native 双层结构），下游工具可直接解析执行
2. **QA 友好**：并行输出 12 列 CSV 导出文件，可直接导入 TestRail / Zephyr / Xray / 禅道 / 飞书多维表格
3. **完全独立**：不依赖任何特定工作流，可在任意项目、任意 AI 编码工具中使用

---

## 解决什么问题

传统测试用例设计的痛点：

| 痛点 | 本 Skill 的解法 |
|---|---|
| 测试用例写完就成"死文档"，AI 看不懂 | 双层结构：人类描述 + tc-exec 执行契约（Markdown-native） |
| 设计方法论靠经验，覆盖度不一致 | 6 种经典方法论强制应用（等价类/边界值/判定表/场景法/状态迁移/错误推测） |
| 用例写完没法直接跑 | 配套 `unit-test-generator` Skill 把 tc-exec 契约转成可跑代码 |
| QA 工具导入需要重新整理 | 自动并行生成 CSV，符合主流测试平台 Schema |
| 图片 PRD 难处理 | 支持 13 种 PRD 格式（A 档文本 + B 档图片 AI 视觉分析） |
| 不知道怎么从 REQ 推导用例 | 6 种方法论 + REQ↔TC 双向追溯矩阵 + TC-01~TC-06 自审 |

---

## 覆盖的测试层级（重要说明）

**本 Skill 生成的是面向 QA 测试工程师的"测试用例库"，主产物是功能测试用例，不是单元测试代码。**

生成的 TC 文档按 4 章 + 覆盖率矩阵组织，聚焦功能测试：

| 章节 | 测试类型 | channel | 来源 |
|---|---|---|---|
| **一、业务流程测试** | 正常/异常流程 + 状态流转 | `manual` | REQ 验收标准 |
| **二、UI 交互测试** | 前端 DOM 操作验证 | `ui-dom` | DES UI 还原 + PRD 视觉内容 |
| **三、视觉回归测试** | 页面视觉一致性 | `ui-visual` | PRD 视觉内容 |
| **四、异常与边界测试** | 异常路径 + 边界条件 + 错误推测 | `manual` | DES 异常分支 + bug 复现 + refactor 等价性 |
| **五、覆盖率矩阵** | REQ 验收标准 ↔ TC 用例交叉 | — | 全部 TC 汇总 |

**合法 channel 仅 3 个**：`manual` / `ui-dom` / `ui-visual`

**产物定位**：
- TC 文档（`.md`）— 功能测试用例集，供 QA 手工执行或未来 E2E Skill 消费
- CSV 导出（`.csv`）— QA 人工管理版本，导入测试管理平台（TestRail/Zephyr/Xray/禅道）

### 与 unit-test-generator 的关系

```
test-case-design（本 Skill）→ 功能测试用例（manual/ui-dom/ui-visual）
unit-test-generator（独立 Skill）→ 单元测试（unit/api/db），自主设计+生成+执行
两者独立，无上下游依赖。
```

### 一句话定位

> **本 Skill 是 AI 化的 QA 测试工程师**——给它 REQ/DES/PRD，它产出完整的**功能测试用例集**（4 章结构 + 覆盖率矩阵 + CSV 导出），供 QA 手工执行、导入测试管理平台，或作为未来 E2E Skill 的输入。单元测试由独立 Skill unit-test-generator 负责。

---

## 核心特性

### 🎯 测试用例设计

- **6 种经典方法论**：等价类划分 / 边界值分析 / 判定表 / 场景法 / 状态迁移 / 错误推测
- **4 章 TC 文档结构**：业务流程 / UI 交互 / 视觉回归 / 异常边界 + 覆盖率矩阵
- **任务类型差异化**：feature 全量 / bug 复现+回归 / refactor 等价性断言
- **TC-01~TC-06 自审**：6 项强制审计规则保证质量

### 📝 PRD 多格式支持（13 种扩展名）

**A 档：文本类（6 种）**
- `.md` / `.markdown` / `.mdx` / `.txt` / `.html` / `.htm`

**B 档：图片类（7 种）**
- `.png` / `.jpg` / `.jpeg` / `.webp` / `.gif` / `.svg` / `.bmp` / `.tiff`
- 通过 Claude 多模态视觉识别，提取 7 类 UI 信息（布局/组件/字段/交互/状态/导航/视觉规格）

### 🤖 AI 可执行的 tc-exec 格式

每条用例自带执行契约：

````markdown
#### TC-F-login-003 登录 - 密码错误

**channel**: api | **priority**: P0 | **exec-mode**: auto

**请求**:
```http
POST ${env.base_url.local}/api/auth/login
Content-Type: application/json

{"username": "zhangsan", "password": "wrong"}
```

**前置**:
- `db.seed users/zhangsan.yaml`

**断言**:
- `http.status == 401`
- `json.code == 10001`
- `json.msg == "用户名或密码错误"`
- `json.data.token not_exists`
````

特性：
- **15 个固定断言操作符**（==/!=/>/exists/regex/contains/length 等）
- **3 个功能测试 channel**（manual/ui-dom/ui-visual）
- **JSONPath 简化路径**（`json.data.token` / `db[users][id=1].status`）
- **变量引用**（`${env.base_url}` 从 `.test-env.md` 解析）

### 📊 CSV 并行导出（双模板）

**两种 CSV 模板并存**，通过 `csv_template` 参数选择：

#### detailed 模板（12 列，技术追溯版）

```csv
TC_ID,Module,Title,Priority,Type,Channel,Preconditions,Test_Steps,Expected_Result,Related_REQ,Skeleton_File,Generated_Date
TC-F-login-001,01-登录,正常登录,P0,接口测试,api,...,1) POST ; 2) ...,1) HTTP 200 ; 2) ...,REQ §2.1,TC-F-login-001.jest.ts,2026-04-15
```

- **12 列**：含 Channel / Skeleton_File / Related_REQ 等技术追溯字段
- **目标用户**：开发 + AI 消费 + 现代测试平台（TestRail / Zephyr / Xray）
- **默认表头**：英文 snake_case
- **文件名**：`testcases.detailed.csv`（全局汇总，多模块追加到同一份）

#### traditional 模板（7 列，传统 QA 版）

```csv
编号ID,用例等级,功能模块,用例主题,前置条件,执行步骤,预期结果
TC-F-login-001,P0,01-登录,正常登录流程,1) 用户已注册,1) 打开登录页 ; 2) 输入用户名和密码 ; 3) 点击登录,1) 跳转首页 ; 2) 显示用户名
```

- **7 列**：编号ID / 用例等级 / 功能模块 / 用例主题 / 前置条件 / 执行步骤 / 预期结果
- **目标用户**：QA 团队 + Excel 模板 + 禅道 / 飞书多维表格 / TAPD / TestLink
- **默认表头**：**中文**（符合 QA 习惯）
- **文件名**：`testcases.traditional.csv`（全局汇总）

#### csv_template 参数

| 值 | 产出 |
|---|---|
| `detailed`（默认） | 只产 12 列技术版 → `testcases.detailed.csv` |
| `traditional` | 只产 7 列传统版 → `testcases.traditional.csv` |
| `both` | 两种同时产出 → `testcases.detailed.csv` + `testcases.traditional.csv` |

**共享特性**（两种模板都有）：
- **UTF-8 with BOM**（中文 Excel 兼容）
- **RFC 4180 引用规则**
- **方案 C 多行格式**：`1) 步骤一 ; 2) 步骤二 ; 3) 步骤三`
- **中英文双表头**可选（`csv_headers_lang` 参数强制统一）

支持导入的测试管理工具：
- **detailed**: TestRail / Zephyr / Xray
- **traditional**: 禅道 / 飞书多维表格 / TAPD / Excel / TestLink

---

## 安装

**已内置在 ny-sdd-workflow 的 `tools/test-case-design/` 目录下**，安装 ny-sdd-workflow 后即可使用，无需单独安装。

---

## 快速开始

### 场景 1：独立使用（任意项目）

在任意项目对话中说：

```
"用 test-case-design 帮我按 ./docs/login-spec.md 生成测试用例
任务类型: feature
输出目录: ./test-cases/"
```

Skill 会自动：
1. 读取 `./docs/login-spec.md`
2. 提示是否有 `.test-env.md`（缺失则降级 manual）
3. 应用 6 种方法论生成用例
4. 输出 `./test-cases/TC-F-login.md` + `./test-cases/TC-F-login.csv`

### 场景 2：含图片 PRD

```
"用 test-case-design 生成测试用例
- ./docs/login-spec.md
- ./docs/design/login-page.png
- ./docs/design/login-error.png
任务类型: feature
输出目录: ./test-cases/"
```

Skill 会：
1. 文本 PRD 作为权威，提取验收标准 + API 定义
2. 图片 PRD 通过 Claude 视觉分析，提取 UI 布局/组件/状态
3. 文本 + 图片合并，冲突时向用户询问
4. 生成的 TC 文档第四章 UI 测试用例**含视觉对比项**

### 场景 3：SDD 工作流集成

如果项目使用 ny-sdd-workflow，本 Skill 会被 SDD 的 §2.7 功能测试用例设计阶段自动调用，无需手动触发。SDD 默认传 `csv_template: both`，同时产出两份 CSV。详见 SDD workflow 的 `phase-spec.md`。

### 场景 4：只要传统 QA 版 CSV

```
"用 test-case-design 从 ./docs/REQ-login.md 生成 TC 文档
- 任务类型: feature
- 输出目录: ./test-cases/
- csv_template: traditional"
```

Skill 产出：
- `./test-cases/TC-F-login-登录.md`（TC 文档，AI 可执行）
- `./test-cases/TC-F-login-登录.csv`（**7 列传统 QA 版**，中文表头，可直接导入禅道/飞书）

**没有 detailed 版**（因为你没要）。

### 场景 5：同时要两种 CSV（最常见的 QA+Dev 协作场景）

```
"用 test-case-design 从 ./docs/REQ-login.md 生成 TC 文档
- 任务类型: feature
- 输出目录: ./test-cases/
- csv_template: both"
```

Skill 产出：
- `./test-cases/TC-F-login-登录.md`（TC 文档）
- `./test-cases/TC-F-login-登录.csv`（detailed 12 列，给 Dev / CI）
- `./test-cases/TC-F-login-登录.traditional.csv`（traditional 7 列，给 QA / 禅道）

**好处**：开发拿 detailed 做 AI 可执行追溯，QA 拿 traditional 导入管理工具，两份文件基于同一批蓝本派生，**共同字段值完全一致**，保证数据同步。

---

## 输入契约

| 字段 | 必需/可选 | 说明 |
|---|---|---|
| `requirement_source` | **必需** | REQ / PRD / DES 文件路径或文本块（≥200 字符 + 有结构） |
| `task_type` | **必需** | `feature` / `bug` / `refactor` |
| `output_dir` | **必需** | 输出目录路径 |
| `design_source` | 可选 | DES 文件路径或文本 |
| `prd_source` | 可选 | PRD 文件路径或图片（13 种格式） |
| `runtime_source` | 可选 | `.test-env.md` 路径（运行时配置） |
| `reverse_scan_hint` | 可选 | 已有代码深度扫描产出目录 |
| `output_format` | 可选 | `md` / `csv` / `md+csv`（默认 `md+csv`） |
| `csv_template` | 可选 | `detailed` / `traditional` / `both`（默认 `detailed`） |
| `csv_headers_lang` | 可选 | `en` / `zh`（对 detailed 默认英文，对 traditional 默认中文） |

**最小输入**：`requirement_source` + `task_type` + `output_dir`

详见 [SKILL.md](./SKILL.md) 的「输入契约」章节。

---

## 输出产物

```
{output_dir}/
├── TC-F-{module_id}-{module_name}.md   ← 主产物：含元数据/覆盖率矩阵/自审报告/4 章功能测试用例
├── testcases.detailed.csv               ← 全局汇总：12 列 CSV（所有模块追加）
└── testcases.traditional.csv            ← 全局汇总：7 列 CSV（所有模块追加）
```

**TC 文档结构**：
- 元数据 bullet（12 字段）
- 覆盖率矩阵（4 列：REQ ↔ DES ↔ TC ↔ channel）
- 自审报告（TC-01~TC-06）
- 用例总览表（6 列）
- 一、业务流程测试
- 二、UI 交互测试
- 三、视觉回归测试
- 四、异常与边界测试
- 五、覆盖率矩阵
- 六、不测范围与理由

**注意**：本 Skill **不生成单测代码**。如需可跑的单测，请使用姊妹 Skill `/unit-test-generator`。

---

## 与其他 Skill 的关系

### 与 `unit-test-generator` 的关系（强相关）

两个 Skill **协作**完成"设计 → 执行"闭环，但**完全独立**：

| Skill | 职责 | 输入 | 输出 |
|---|---|---|---|
| `test-case-design`（本 Skill） | 测试用例**设计**（"测什么"） | REQ/DES/PRD | TC 文档 + CSV |
| `unit-test-generator` | 单测代码**派生**（"怎么写"） | TC 文档 | Jest/JUnit/pytest 等代码 |

**串联使用**：
```
"先用 test-case-design 从 REQ.md 生成 TC，
然后用 unit-test-generator 把 TC 转成 Jest 单测"
```

**共享契约**：两个 Skill 各有一份 `references/tc-exec-schema.md` 副本（方案 A），双份**逐字节一致**。
- **权威版本**：本 Skill 的 `references/tc-exec-schema.md`
- **副本**：`unit-test-generator/references/tc-exec-schema.md`（从权威版本复制）

详见 SKILL.md 的「相关规范文件」章节。

### 与 `prd-audit` 的关系（弱相关）

`prd-audit` 审计 PRD 的完整性和质量。如果 PRD 本身有问题（缺章节、模糊描述），先用 `prd-audit` 修复 PRD，再用 `test-case-design` 生成测试用例。

---

## 文件结构

```
test-case-design/
├── README.md                          ← 本文档
├── SKILL.md                           ← Skill 入口（frontmatter + 8 步工作流）
└── references/
    ├── prd-format-handlers.md         ← PRD 多格式加载和合并规则
    ├── design-rules.md                ← 6 种设计方法论 + TC-01~TC-06 审计规则
    ├── tc-exec-schema.md              ← tc-exec 格式契约（共享，权威版本）
    ├── channel-playbooks.md           ← channel 写法指南（本 Skill 仅用 manual/ui-dom/ui-visual）
    ├── tc-doc-template.md             ← TC 文档骨架模板
    ├── csv-export-schema.md           ← CSV 12 列 Schema 和导入指南
    └── test-env-template.md           ← .test-env.md 模板和字段说明
```

---

## 工作流程（8 步）

| Step | 内容 |
|---|---|
| **Step 0** | 模式自检（SDD / 独立） |
| **Step 1** | 输入契约解析 + 门槛检查 + 加载输入内容（多格式 PRD 处理） |
| **Step 2** | 加载 runtime（`.test-env.md`） + channel 能力评估 |
| **Step 3** | 选择策略 + 应用 6 种方法论生成用例蓝本 |
| **Step 4** | 分配 channel + 编写 tc-exec 块 |
| **Step 5** | 自审（TC-01~TC-06 + 一致性校验） |
| **Step 6**（v1.1 已移除） | ~~派生单测骨架~~ → 已拆分到 `unit-test-generator` Skill |
| **Step 6** | 组装 TC 文档 + CSV 并行输出 + 写盘 + 回执输出 |

详见 [SKILL.md](./SKILL.md) 的「工作流程」章节。

---

## 配置文件 `.test-env.md`（可选）

如果要让生成的测试用例 AI 可执行（而不是全部降级 manual），需要在项目根创建 `.test-env.md`：

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

## MCP 能力声明
- `http-client`
- `sql-runner`
- `shell`
- `playwright`

## 单测目录约定
- `test_dirs.frontend_unit = src/__tests__`
- `test_dirs.backend_unit = src/test/java`

## 全局变量
- `vars.test_user = zhangsan`
- `vars.test_password = "YOUR_PASSWORD"`
```

完整模板见 [`references/test-env-template.md`](./references/test-env-template.md)。

不创建也不阻断流程，但所有 tc-exec 块的 channel 会强制降级为 `manual`，可执行率为 0%。

---

## 常见问题

### Q：必须配 `.test-env.md` 才能用吗？

不必须。没有 `.test-env.md` 时所有用例标记为 `manual`，TC 文档结构和 CSV 都正常生成，只是失去 "AI 可执行" 的承诺。适合 QA 团队仅做用例设计、手工执行的场景。

### Q：生成的 TC 文档怎么用？

- **AI 自动执行**：交给下游 `unit-test-generator` Skill 派生为可跑单测代码
- **QA 人工评审**：直接读 TC-F-xx.md，4 章功能测试结构清晰
- **测试平台导入**：用并行生成的 TC-xx.csv，导入 TestRail/Zephyr/Xray/禅道/飞书

### Q：图片 PRD 真的能识别？

是的。本 Skill 通过 Claude 多模态视觉能力直接"看"图片，提取 7 类 UI 信息：布局/组件/字段/交互/状态/导航/视觉规格。详见 `references/prd-format-handlers.md` 第二章。

### Q：怎么扩展支持新框架/新 channel？

- **新 channel**：编辑 `references/channel-playbooks.md`，加新 channel 段落
- **新断言操作符**：编辑 `references/tc-exec-schema.md` 第四章；同时同步 `unit-test-generator` 的副本（详见 ny-sdd-workflow 的 `CHANGELOG-v3.7.md` 第十章「维护者同步指南」）
- **新 PRD 格式**：编辑 `references/prd-format-handlers.md`

### Q：和测试管理平台（TestRail/Zephyr）的关系？

本 Skill 不取代测试管理平台，而是**为它们提供高质量的输入**。生成的 TC-xx.csv 可以一键导入主流平台，详见 `references/csv-export-schema.md` 第七章「主流测试平台导入指南」。

---

## 设计原则

1. **独立性优先**：不依赖任何特定工作流，任何项目任何 AI 工具都能用
2. **契约驱动**：通过 SKILL.md 的输入契约与调用方解耦
3. **格式严格**：15 操作符 / 3 功能测试 channel / 6 方法论都是冻结枚举，禁止 AI 自由扩展
4. **质量门禁**：TC-01~TC-06 强制自审，单项修复 ≥3 次失败 → 停车信号
5. **降级友好**：`.test-env.md` 缺失、PRD 格式不支持、Skill 安装失败都有明确降级路径
6. **可被独立消费**：产出的 TC 文档可以被 `unit-test-generator` 或人工测试团队任意使用

---

## 版本

- **v1.2**（2026-04-15）— CSV 双模板版
  - 新增 `csv_template` 参数（`detailed` / `traditional` / `both`）
  - 新增 traditional 7 列传统 QA 模板（编号ID/用例等级/功能模块/用例主题/前置条件/执行步骤/预期结果）
  - traditional 默认中文表头（符合 QA 习惯）
  - detailed 保持 12 列 + 默认英文（向后兼容）
  - SDD 工作流 v3.7 同步升级为默认 `csv_template: both`
  - 两份 CSV 从同一批蓝本派生，保证跨模板一致性

- **v1.1**（2026-04-14）— 瘦身版
  - 职责拆分：单测代码派生移到姊妹 Skill `unit-test-generator`
  - 工作流从 8 步瘦身到 7 步
  - 移除 `framework_hint` 参数和 `framework-adapters.md` 文件
  - 保留 `tc-exec-schema.md` 副本（方案 A 共享契约）

- **v1.0**（2026-04-14）— 初版
  - 8 步工作流（含单测派生）
  - Markdown-native tc-exec 格式（15 固定操作符）
  - 4 章 TC 文档结构（业务流程/UI 交互/视觉回归/异常边界）
  - SDD + 独立双模式
  - PRD 多格式支持（A 档文本 6 种 + B 档图片 7 种）
  - 并行 CSV 导出（12 列精简 Schema）

---

## 许可

MIT

---

## 相关资源

- [SKILL.md](./SKILL.md) — Skill 完整定义（工作流程 + 输入契约 + 输出回执）
- [references/](./references/) — 详细规范文件（按 SKILL.md Step 引用）
