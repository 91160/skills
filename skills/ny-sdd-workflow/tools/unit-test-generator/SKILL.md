---
name: unit-test-generator
description: >
  单元测试全链路工具：支持两种工作模式。
  翻译模式：从 TC 测试用例文档（含 tc-exec 执行契约的 Markdown）派生完整可跑的单元测试代码。
  自主��计模式（SDD 集成）：从 REQ/DES + 实际源代码直接设计单测用例 + 生成代码 + 执行 + 输出报告。
  输出对应框架的单测文件，含 import、describe/test、请求代码、断言、setup/cleanup、fixture。
  支持 Jest / Vitest / JUnit5 / pytest / go test 五种主流框架；支持 inline/external/auto 三种 fixture 策略。
  SDD 模式下自动从 project-profile.md 推断框架，全栈项目一次调用同时生成前后端单测，exec_mode=true 自动执行并输出 report.md。

  两种模式都可独立使用：
    翻译模式：任何遵守 tc-exec-schema 规范的 TC 文档都可作为输入。
    自主设计模式：只需源代码即可运行（有需求文档/REQ/DES 则质量更高）。在 SDD 中于 §3.7 自动调用。

  适用场景：
    1. 已有 TC 文档（任何来源），想快速获得可跑单测代码
    2. 测试栈迁移：把一批现有用例从 Jest 迁到 Vitest、从 JUnit4 迁到 JUnit5
    3. 批量生成单测骨架：从一个 TC 文档一次性派生十几个测试文件
    4. 作为更大工作流的子环节：SDD §2.5 Step 2.5、CI 流水线的一部分、QA 平台集成

  中文触发词：生成单元测试、派生单测、从 TC 生成单测、把测试用例变成代码、
    生成 Jest 测试、生成 JUnit 测试、生成 pytest 测试、生成 go test、
    单测骨架、框架单测、test 代码生成、tc-exec 转单测代码
  英文触发词：unit test generator, generate unit tests from test cases, derive unit tests,
    test skeleton generator, tc to unit test, tc-exec to code

  不适用：
    - 集成测试 / E2E 测试的代码生成（本 Skill 聚焦单元测试）
    - 运行现有测试（这是 test runner 的职责）
    - 复杂测试逻辑（需要深度业务理解的测试请人工写）
---

# 单元测试代码派生 Skill

从符合 `tc-exec-schema` 规范的 TC 测试用例文档中，按目标测试框架**派生完整可跑**的单元测试代码。

**核心定位**：**独立工具**。只要你给我一份带 tc-exec 块的 TC 文档 + 告诉我用什么框架，我就能产出可直接跑的测试文件。

**和 `test-case-design` Skill 的关系**：
- test-case-design 生成 TC 文档（设计层，"测什么"）
- unit-test-generator 消费 TC 文档生成单测代码（执行层，"怎么写"）
- 两个 Skill 独立使用，通过 `tc-exec-schema.md` 共享契约
- **消费不等于依赖**：本 Skill 也能读取人工手写的 TC 文档（只要符合 tc-exec 格式）

---

## 覆盖的测试层级（重要说明）

**命名澄清**：虽然 Skill 叫 `unit-test-generator`，它生成的**代码形式**是单元测试框架（Jest / Vitest / JUnit5 / pytest / go test），但**测试内容**覆盖多个层级，不全是严格意义的单元测试。

### 本 Skill 按 channel 覆盖的测试层级

| channel | 代码形式 | 实际测试层级 | 生成状态 |
|---|---|---|---|
| `unit` | `it('纯函数')` | 严格单元测试（无外部依赖） | ✅ 生成 |
| `api` | `request(app).post(...)` (supertest/MockMvc/httpx/httptest) | API 级功能测试 / 组件级集成测试 | ✅ 生成（进程内注入） |
| `db` | `db.prepare(...).run()` + in-memory | 数据层集成测试 | ✅ 生成（in-memory DB 降级） |
| `cli` | `execSync('./bin/cli ...')` | CLI 级功能测试 | ✅ 生成 |
| `ui-dom` | Playwright `page.click(...)` | UI 自动化测试 | ⚠️ 可生成（需 Playwright MCP，在 channels_filter 显式声明） |
| `ui-visual` | — | 视觉回归测试 | ❌ **永远不生成** |
| `manual` | — | 跨系统联调 / 物理设备 | ❌ **永远不生成** |

### 关键约束

1. **所有生成的代码都是"进程内测试"**：
   - HTTP 请求 → `supertest(app)` / `MockMvc` / `httpx.AsyncClient(app=app)` / `httptest.NewRecorder()` 进程内注入
   - 数据库 → `better-sqlite3` / H2 / `sqlite:///:memory:` / `go-sqlmock` 内存模式
   - CLI → `execSync` / `ProcessBuilder` / `subprocess` 子进程
2. **都能在 CI 的 `unit test` 阶段跑完**：速度快、独立、可重复
3. **不生成需要真实环境的测试**：
   - ❌ Cypress / Selenium（真实浏览器启动）
   - ❌ Testcontainers / Docker 启动的真实数据库
   - ❌ 部署到预发环境的真实服务

### 与测试金字塔的对应

```
         /\
        /E2E\             ← 真实浏览器 / 真实服务 ❌ 不生成
       /------\
      / 集成   \          ← 真实数据库 / Docker  ❌ 不生成
     /----------\
    / API 功能   \        ← supertest 等          ✅ channel=api
   /--------------\
  /  数据层集成    \       ← in-memory DB          ✅ channel=db
 /------------------\
/   单元测试         \    ← 纯函数                 ✅ channel=unit
----------------------
```

本 Skill 覆盖底部三层 + CLI 功能测试，**不包括**顶部的 E2E 和真实环境集成测试。

### "unit test" 在本 Skill 中的宽泛定义

业界对 unit test 有两派定义，本 Skill 采用**宽泛定义**（与 Jest/JUnit/pytest 生态一致）：

- **严格定义**（学术派）：纯函数，禁止任何外部依赖
- **宽泛定义**（业界主流）：允许 in-memory DB、supertest、mocks，只要"快、独立、可重复"

**名字里的 "unit" 指"测试代码的形式"（单测框架），不是"测试内容的层级"（严格单元测试）。**

### 给 AI 的执行约束

- 收到用户要求生成某种测试代码时，判断 channel 是否在可生成列表内
- `channel=ui-visual` / `manual` 的用例**永远跳过**，在回执中明确标注"跳过原因"
- `channel=ui-dom` 默认不生成（除非用户显式 `channels_filter` 包含）
- 遇到 `channel=api/db` 时，若 `.test-env.md` 没有配置真实服务，**自动降级**到 in-memory / supertest 模式

---

## 使用场景

### 场景 A：独立批量生成（最常见）

你已经有一份 `login-cases.md`，里面有 15 条测试用例，每条都有 tc-exec 块。你想要一次性生成 Jest 测试文件：

```
"读 ./tests/login-cases.md 生成 Jest 单测骨架到 ./tests/generated/"
```

Skill 输出 15 个 `.jest.ts` 文件 + 必要的 fixture 文件。

### 场景 B：测试框架迁移

你想把一批从 Jest 迁到 Vitest：

```
"把 ./test-cases/ 下所有 TC 文档用 vitest 重新生成骨架"
```

Skill 对每个 TC 文档调用一次，产出 vitest 版本。

### 场景 C：SDD 工作流子环节

SDD 的 §3.7 开发自测阶段，自动调用本 Skill：

```
SDD §3.7.1:
  tc_source: .test/testcases/TC-F-01-登录.md
  framework_hint: jest
  output_dir: .test/unit/
```

Skill 把骨架写到 `{output_dir}/skeleton/`，SDD 负责后续迁移到项目源码树。

### 场景 D：CI 流水线集成

CI 触发时，从 Git 仓库拉最新 TC 文档，自动调用 Skill 生成单测，确保测试代码与 TC 设计同步：

```yaml
# CI 配置片段（示意）
- name: Generate unit tests from TC docs
  run: claude-cli invoke unit-test-generator \
    --tc_source ./test-cases/*.md \
    --framework_hint jest \
    --output_dir ./src/__tests__/generated
```

---

## 输入契约

Skill 通过对话上下文接受以下字段：

| 字段 | 必需/可选 | 类型 | 缺失时行为 |
|---|---|---|---|
| `tc_source` | 翻译模式**必需** / 自主设计模式可选 | TC 文件路径 或 完整 Markdown 文本 | 翻译模式停止并提示；自主设计模式从 REQ/DES + 源代码自动设计 |
| `framework_hint` | 翻译模式**必需** / SDD 模式可选 | `jest` / `vitest` / `junit5` / `pytest` / `gotest` | SDD 模式自动从 project-profile.md 技术栈推断；翻译模式交互式询问 |
| `output_dir` | **必需** | 目录路径 | SDD 模式默认 `.test/unit/`，独立模式交互式询问 |
| `runtime_source` | 可选 | `.test-env.md` 路径 | 按项目根默认查找；仍不存在则 in-memory DB + mock server 降级 |
| `channels_filter` | 可选 | channel 列表 | 翻译模式默认 `["unit"]`；SDD 自主设计模式默认 `["unit","api","db"]` |
| `fixture_strategy` | 可选 | `auto` / `inline` / `external` / `hybrid` | 默认 `auto`（按字段数 + 复用度自动判定） |
| `exec_mode` | 可选 | `true` / `false` | SDD 模式默认 `true`（执行测试 + 输出 report.md）；翻译模式默认 `false`（仅生成代码） |

**翻译模式最小输入**：`tc_source` + `framework_hint` + `output_dir`。

**SDD 自主设计模式最小输入**：REQ + DES + 源代码路径（从 SDD 上下文自动获取）。framework_hint/output_dir/channels_filter/exec_mode 均有 SDD 默认值。

**SDD 模式特殊行为**：
1. **自动推断框架**：从 `.project/specs/rules/project-profile.md` 读取技术栈（前端→vitest/jest，后端→junit5/pytest/gotest）
2. **全栈项目**：自动检测前后端，一次调用同时生成两套单测
3. **自动执行**：exec_mode=true，生成后将骨架复制到项目测试目录 → 执行 test runner → 输出 report.md → 清理复制文件（原件保留）
4. **输出路径**：默认 `.test/unit/`

**最小输入门槛**：

1. `tc_source` 必须是**符合 tc-exec-schema 规范的 TC 文档**：
   - 有 `## 一、功能测试用例` / `## 二、接口测试用例` / ... 等章节（至少 1 章有内容）
   - 有 `#### TC-xxx-xxx` 形式的用例标题
   - 至少 1 条用例有完整的 tc-exec 块（元数据行 + 请求 fence + 断言 bullet）
2. `framework_hint` 必须是 5 个固定枚举之一（可扩展但需要用户提供对应模板）
3. `output_dir` 必须显式或通过模式推断出来

任一不满足 → Skill 立即停止并列出缺失项。

---

## 工作流程

### Step 0: 模式自检

**目的**：识别工作模式（翻译模式 / SDD 自主设计模式）；SDD 模式下同时检测全栈架构和自动推断框架。

**动作**：
1. 检查当前工作目录：
   - 存在 `.project/specs/master/` 目录 且 `.project/specs/rules/project-profile.md` 存在？
2. 两者都存在 → **SDD 自主设计模式**
   - 默认 output_dir：`.test/unit/`
   - 读取 project-profile.md 技术栈 → 自动推断 framework_hint
   - 检测是否全栈（前端+后端）→ 一次调用同时生成
   - exec_mode 默认 true
   - channels_filter 默认 `["unit","api","db"]`
3. 不满足条件 → **独立翻译模式**
   - output_dir 由用户指定，默认 `./test-cases/skeleton/`
   - framework_hint 必需（交互式询问）
   - exec_mode 默认 false
4. 用户提供了 `tc_source` → 无论哪种环境，优先走**翻译模式**（消费 TC 文档）
5. 用户未提供 `tc_source` → 走**自主设计模式**（从需求文档/REQ/DES + 源代码设计单测；最少只需源代码）

**输出**：

```
【模式识别】
  工作模式: 独立翻译模式 / SDD 自主设计模式
  默认 output_dir: {path}
  框架推断: {frontend: vitest, backend: junit5}（SDD 模式）
  全栈检测: {是/否}
  exec_mode: {true/false}
```

**注意**：翻译模式是完全独立的工具，不依赖 SDD。自主设计模式需要 SDD 上下文（REQ/DES/源代码/project-profile.md）。

### Step 0.5: 自主设计单测用例（仅自主设计模式执行，翻译模式跳过）

**目的**：从 REQ/DES + 实际源代码分析并设计单测用例，生成内部 tc-exec 表示 + 单测用例文档（UT-*.md）。

**前置条件**：Step 0 判断为"自主设计模式"（无 tc_source 输入）。SDD 项目和非 SDD 项目均可执行。

**动作**：

1. **加载输入**（按可用性逐级降级）：
   - **SDD 项目**：读取当前模块的 REQ（验收标准）+ DES（技术方案）+ 实际源代码文件
   - **非 SDD 项目**：用户提供需求文档（任意格式的需求描述/PRD/口头说明）+ 源代码路径
   - **最小输入**：只有源代码，无任何需求文档 → 仍可执行（从代码结构推导测试，但缺少需求层面的场景覆盖）
   
   > 输入越丰富，单测质量越高：REQ+DES+源代码 > 需求文档+源代码 > 仅源代码

2. **分析源代码结构**：
   - **函数/方法层**：扫描 export 的函数、public 方法、工具函数 → 识别输入参数和返回值类型
   - **API 接口层**：扫描路由定义（Express router / Spring @RequestMapping / Flask route）→ 提取 HTTP 方法 + 路径 + 参数 + 响应格式
   - **数据操作层**：扫描数据库操作（ORM 查询 / SQL 语句 / Repository 方法）→ 提取涉及的表和字段
   - **分支路径**：识别 if/else / switch / try-catch 的分支数量，确保每个分支至少 1 条用例覆盖

3. **按 channel 分类设计用例**：

   | channel | 设计来源 | 用例内容 | 最低数量 |
   |---|---|---|---|
   | `unit` | 源代码的纯函数/工具方法 + 被调用的内部函数 | 输入→输出验证 + 边界值 + 异常输入（null/空/类型错误/超时） | 每函数至少 3 条 |
   | `api` | 源代码的路由/控制器 + DES API 定义 | 正常请求/缺参/越界/权限/错误码 | 每接口至少 5 条 |
   | `db` | 源代码的数据操作 + DES 数据模型 | CRUD 验证/约束检查/状态流转/级联操作 | 每表/操作至少 3 条 |

   **分支覆盖要求**：对于 if/else/switch/try-catch，每个条件的真/假路径都至少 1 条用例覆盖（N 个独立条件至少 2N 条用例）。
   
   **隐式异常覆盖**：除了显式分支，还需覆盖隐式异常场景：
   - null / undefined 输入
   - 空数组 / 空字符串
   - 类型不匹配（string 传 number）
   - 超长文本 / 超大数值
   - 并发场景（如涉及共享状态）

4. **为每条用例生成 tc-exec 格式**：
   - 按 `references/tc-exec-schema.md` 规范生成标题 + 元数据 + 请求 + 前置 + 断言 + 清理
   - channel=api → 生成 HTTP fence block（方法 + 路径 + 请求体）
   - channel=db → 生成 SQL fence block 或 ORM 操作
   - channel=unit → 生成函数调用 fence block
   - 断言使用 15 个固定操作符

5. **生成单测用例文档**（UT-{模块}-{功能}.md）：
   - 输出到 `{output_dir}/UT-{模块}-{功能}.md`
   - 包含：元数据 + 用例总览 + 所有用例的 tc-exec 块
   - 格式与 tc-exec-schema.md 一致，可被后续 Step 1 直接解析

6. **设计质量自检**（目标：行覆盖率 ≥ 70%，分支覆盖率 ≥ 60%）：
   - 每个 API 接口至少 5 条用例（正常/缺参/越界/权限/错误码）
   - 每个函数至少 3 条用例（正常/边界/异常）
   - 每个条件分支的真/假路径各至少 1 条用例
   - 隐式异常场景（null/空/类型错误/超时）至少覆盖
   - 有需求文档/REQ 时：验收标准的每个"可测试项"至少 1 条用例对应
   - 无需求文档时：基于代码结构确保 export/public 函数 + 被调用的 internal 函数全覆盖
   - 不通过 → 补充后重检，单项超 3 次 → 跳过并标注"人工补充"

**输出**：UT-*.md 文件 + 内部 tc-exec 结构化对象列表 → 传递给 Step 1 解析管道

---

### Step 1: 加载 TC 文档 + 解析 tc-exec 块

**目的**：从 tc_source（翻译模式）或 Step 0.5 产出的 UT-*.md（自主设计模式）中提取所有 tc-exec 块，转成结构化对象列表。

**动作**：

1. **读取输入**：
   - **翻译模式**：从 tc_source 读取（文件路径或完整文本）
   - **自主设计模式**：从 Step 0.5 产出的 UT-*.md 读取（已在 output_dir 中）
   - 文件不存在 → 停止报错

2. **格式校验**（按 `references/tc-exec-schema.md` 规范）：
   - 有至少 1 个 `#### TC-xxx` 标题？
   - 有至少 1 个 tc-exec 块（元数据行 + 请求 + 断言）？
   - 任一失败 → 停止并报告"TC 文档不符合 tc-exec-schema 规范"

3. **解析每个 tc-exec 块**为结构化对象：
   - 从标题行提取 `TC-ID` 和描述
   - 从元数据行提取 `channel` / `priority` / `exec-mode`
   - 从请求 fence block 提取请求内容和语言类型
   - 从前置 bullet 提取 setup 动作列表
   - 从断言 bullet 提取断言列表（每条 `{path} {op} {expected}` 解析为三元组）
   - 从清理 bullet 提取 cleanup 动作列表

4. **输出解析报告**：

```
【TC 文档解析报告】
  文件: {path}
  总用例数: {N}
  按章节分布:
    - 功能测试: {n}
    - 接口测试: {n}
    - 数据/状态: {n}
    - UI 测试: {n}
    - 异常: {n}
  按通道分布:
    - api: {n}
    - db: {n}
    - unit: {n}
    - cli: {n}
    - ui-dom: {n}
    - ui-visual: {n}
    - manual: {n}
  含 tc-exec 块: {N}
  跳过: {N}（ui-visual / manual 不可派生代码）
```

### Step 2: 加载 framework_hint + runtime + fixture 策略

**目的**：确定目标测试框架、运行环境、fixture 策略，为 Step 4 的翻译做准备。

**动作**：

1. **解析 framework_hint**：
   - 值在 5 个固定枚举内（`jest` / `vitest` / `junit5` / `pytest` / `gotest`）
   - 不在枚举内 → 停止并提示支持的框架
2. **读 `.test-env.md`**（若存在）：
   - 解析 `test_db` / `test_dirs` / `vars`（详见 tc-exec-schema.md 第七章"变量引用"）
   - 文件不存在 → 不阻断，继续使用 in-memory DB 降级
3. **确定 fixture 策略**（详见 `references/fixture-strategies.md`）：
   - `fixture_strategy: auto` → 按字段数和复用度自动判定
   - 显式指定 `inline` / `external` / `hybrid` → 遵从
4. **按 channels_filter 筛选用例**：
   - 默认 `["unit"]` → 只处理 channel=unit 的用例
   - 扩展到 `["unit","api","db"]` → 对 api/db 用例也生成单测代码（派生 supertest/MockMvc 等风格）
   - `ui-visual` / `manual` channel **永远跳过**（不可派生）

**输出**：

```
【Step 2 配置】
  目标框架: {framework}
  运行环境: {.test-env.md 已加载 / 使用 in-memory 降级}
  fixture 策略: {auto / inline / external}
  待派生用例: {N} 条 (按 channels_filter 筛选后)
  跳过: {N} 条 (channel 不在 filter 内或是 ui-visual/manual)
```

### Step 3: 按 channels_filter 筛选用例

**目的**：从 Step 1 解析的全部用例中筛选出需要派生代码的子集。

**筛选规则**：
- 保留 `channel` 在 `channels_filter` 列表内的用例
- 永远排除 `ui-visual` 和 `manual`（不可派生）
- 筛选结果为空 → 触发停车信号，提示用户调整 `channels_filter` 或检查 TC 文档

**输出**：

```
【Step 3 筛选结果】
  筛选条件: channels_filter = {list}
  筛选前: {N} 条
  筛选后: {M} 条
  跳过原因分布:
    - channel 不在 filter 内: {n}
    - ui-visual (不可派生): {n}
    - manual (不可派生): {n}
```

### Step 4: 逐条翻译（核心）

**目的**：为每条筛选后的用例生成一个完整可跑的测试文件。

**动作**（对每条用例）：

1. **读 `references/framework-adapters.md`** 找到对应框架的完整模板：
   - Jest / Vitest → channel=api 用 supertest，channel=db 用 better-sqlite3
   - JUnit5 → channel=api 用 MockMvc，channel=db 用 @DataJpaTest + H2
   - pytest → channel=api 用 httpx，channel=db 用 sqlalchemy + sqlite in-memory
   - go test → channel=api 用 httptest，channel=db 用 sqlmock

2. **按模板生成代码**：
   - 文件头：`// @TC-{TC-ID}` 注释 + 派生自来源说明
   - Import 语句：完整（含 request / db / fixture 加载等）
   - describe / test / it 结构：名称与用例描述一致
   - Before/After hooks：按 fixture 策略生成 setup/cleanup
   - 测试主体：
     - 请求部分：从 tc-exec 的 fence block **直译**（HTTP/SQL/shell/DOM 操作）
     - 断言部分：按 `framework-adapters.md` 第一章的**映射表**把 DSL 操作符翻译到框架 matcher

3. **fixture 处理**（详见 `references/fixture-strategies.md`）：
   - inline 策略 → 在 beforeEach 中插入 fixture 代码
   - external 策略 → 生成 `{output_dir}/skeleton/fixtures/{TC-ID}.json` + 代码中加载

4. **变量展开**：
   - tc-exec 中的 `${env.xxx}` → 从 `.test-env.md` 查到实际值替换
   - `.test-env.md` 缺失 → 保留 `${env.xxx}` 占位 + 回执中提示

5. **文件命名**：
   - `{output_dir}/skeleton/{TC-ID}.{framework}.{ext}`
   - `TC-login-001.jest.ts` / `TC-order-007.junit.java` / `TC-pay-012.pytest.py` / `TC-api-003.gotest.go`

### Step 5: 写盘 + 自检 + 回执输出

**目的**：将生成的代码写入 `{output_dir}/skeleton/`，自检后输出执行回执。

**动作**：

1. **创建目录**：`{output_dir}/skeleton/` 和 `{output_dir}/skeleton/fixtures/`
2. **写入骨架文件**：
   - 每条用例一个文件
   - 已存在则覆盖（独立模式下询问用户）
3. **写入 fixture 文件**（external 策略时）：
   - 到 `{output_dir}/skeleton/fixtures/{TC-ID}.json`
4. **派生质量自检**（引用 `references/framework-adapters.md` 第十章 10 项 + `references/fixture-strategies.md` 第八章 10 项）：
   - 文件名格式
   - import 语句完整
   - describe/test 结构
   - 请求代码直译正确
   - 断言 matcher 映射正确
   - setup/cleanup 有实现
   - fixture 合法
   - 代码基本语法正确
5. **输出执行回执到对话**：

```
【unit-test-generator 执行回执】
  模式: 独立模式 / SDD 集成模式
  源 TC 文档: {tc_source}
  目标框架: {framework}
  派生成功: {M} / {N} 条
  未派生: {K} 条 (原因: 非 unit channel / ui-visual / manual)
  
  产出文件:
    - 骨架代码: {M} 个 → {output_dir}/skeleton/
      · TC-login-001.jest.ts
      · TC-login-003.jest.ts
      · ...
    - Fixture 文件: {F} 个 → {output_dir}/skeleton/fixtures/
      · TC-login-001.json (external 策略)
      · ...
    - Inline fixture 数: {I} 条用例
  
  fixture 策略: auto (inline: {I} / external: {F})
  runtime 配置: {.test-env.md 已加载 / in-memory 降级}
  
  依赖提示:
    请确保项目已安装以下依赖才能跑通生成的单测：
    - {依赖清单，根据框架动态生成}
    例如 Jest：
      npm i -D jest supertest @types/supertest better-sqlite3
  
  下一步:
    1. 将生成的骨架文件迁移到项目的测试目录
       - Jest/Vitest → {frontend_unit_dir}
       - JUnit5 → {backend_unit_dir}
       - pytest → {backend_unit_dir}
       - go test → {backend_unit_dir}
    2. 安装缺少的依赖
    3. 运行测试：{test_command}
```

**SDD 集成模式额外提示**：

```
【SDD 集成提示】
  本次运行检测到 SDD 工作流（.project/specs/master/ 存在）
  建议后续动作:
    1. 迁移 skeleton/ 下文件到项目源码树（参考 SDD §2.5 Step 5）
    2. 更新 index.md 的 test-case-status 列
    3. 在 change-log-specs.md 留痕（触发源 [unit-test]）
```

---

## 输出回执模板（完整示例）

独立模式的回执示例：

```
【unit-test-generator 执行回执】
  模式: 独立模式
  源 TC 文档: /Users/foo/project/test-cases/TC-login-登录.md
  目标框架: jest
  派生成功: 12 / 20 条
  未派生: 8 条 (ui-visual: 3, manual: 2, channel 不在 filter: 3)
  
  产出文件:
    - 骨架代码: 12 个 → /Users/foo/project/test-cases/skeleton/
      · TC-login-001.jest.ts  (channel=api)
      · TC-login-003.jest.ts  (channel=api)
      · TC-login-007.jest.ts  (channel=db)
      · ... (9 个)
    - Fixture 文件: 3 个 → .../skeleton/fixtures/
      · zhangsan-active.json (复用，被 3 条用例引用)
      · locked-user.json
      · vip-user.json
    - Inline fixture 数: 9 条用例 (≤5 字段，内联)
  
  fixture 策略: auto (inline: 9 / external: 3)
  runtime 配置: .test-env.md 已加载
  
  依赖提示:
    请确保项目已安装：
    - jest
    - supertest (npm i -D supertest)
    - @types/supertest (npm i -D @types/supertest)
    - better-sqlite3 (npm i -D better-sqlite3)
  
  下一步:
    1. 迁移 skeleton/ 下的 .jest.ts 到项目测试目录（如 src/__tests__/）
    2. 迁移 fixtures/ 到测试目录对应位置
    3. 运行 npm test 验证
    
  提示:
    - 若单测失败，检查 tc-exec 块的变量引用是否在 .test-env.md 中都有定义
    - 若需派生 channel=cli 或 ui-dom 的测试代码，调用时传 channels_filter: ["unit","api","db","cli","ui-dom"]
```

---

## 执行日志格式（SDD 集成模式）

SDD 集成模式下，追加标准 Skill 执行日志：

```
【Skill 执行日志】
  阶段: §2.5 Step 2.5 单测派生
  Skill: unit-test-generator
  路径: {SKILL_DIR}/tools/unit-test-generator/
  执行: 调用 Skill / 内置兜底
  结论: PASS / FAIL
```

---

## 注意事项

1. **完全独立使用**：本 Skill 不依赖 `test-case-design` 或任何其他 Skill。只要 TC 文档符合 `tc-exec-schema` 规范，就能工作。这包括人工手写的 TC、其他 Skill 产出的 TC、历史项目中积累的 TC。

2. **tc-exec-schema 是共享契约**：本 Skill 和 `test-case-design` 都有一份 `tc-exec-schema.md` 副本（见 `references/tc-exec-schema.md`）。两边同步维护，升级 15 操作符或 7 channel 时要**双份更新**。

3. **不做测试用例设计**：本 Skill 只做"代码翻译"，不做"用例设计"。输入的 TC 文档必须已经经过测试工程师或 test-case-design Skill 的设计。如果你给我一份空白 Markdown 说"帮我生成测试"，我会拒绝。

4. **完整可跑的承诺**：生成的代码包含 import / setup / 请求 / 断言 / cleanup，可以直接 `npm test` / `mvn test` / `pytest` 跑通（前提是项目装了依赖）。不是骨架占位符，不是 TODO 注释。

5. **不生成 E2E / 集成测试**：本 Skill 聚焦单元测试（`channel=unit`）和可派生代码的 channel（api/db/cli）。E2E 测试请用专门的 E2E 生成工具。

6. **framework_hint 不在 5 枚举内**：当前支持 Jest / Vitest / JUnit5 / pytest / go test。如果你用的是 Mocha / TestNG / unittest / Ginkgo 等，Skill 会拒绝并建议你：
   - A. 在 `references/framework-adapters.md` 中追加新框架模板
   - B. 手工按照 15 操作符映射关系翻译
   - C. 先转用上述 5 个框架之一

7. **变量展开失败时**：tc-exec 中的 `${env.xxx}` 变量在 `.test-env.md` 中找不到时，Skill 保留原始占位符 + 在回执中列出未解析变量清单。用户可选择忽略或补充 `.test-env.md` 后重跑。

8. **fixture 生成**：auto 策略下，字段数 ≤5 内联、>5 外联。如果你觉得判定不符合需求，用 `fixture_strategy: inline` 或 `external` 强制覆盖。

9. **channel=api 的降级为 channel=unit**：如果 `.test-env.md` 没有 `base_url` 或 MCP `http-client` 能力，channel=api 的单测会自动降级用 `supertest(app)` / `httptest` 等"进程内注入"方式。这需要项目代码里能 import 被测的 app/handler 实例。

10. **重复执行**：多次对同一 TC 文档运行本 Skill 是**幂等**的——除非 TC 文档本身变了，否则生成的骨架代码内容一致。可以安全地在 CI 流水线或 pre-commit hook 里自动运行。

---

## 相关规范文件（references/）

本 Skill 的详细规则都在 `references/` 目录下：

| 文件 | 何时读取 |
|---|---|
| `references/tc-exec-schema.md` | Step 1（解析 tc-exec 块）+ Step 4（变量引用和路径语法） |
| `references/framework-adapters.md` | Step 4（按框架翻译代码） |
| `references/fixture-strategies.md` | Step 2（确定策略）+ Step 4（生成 fixture） |

**共享契约同步注意**：
- `references/tc-exec-schema.md` 是从 `test-case-design` Skill 复制的副本（方案 A）
- 两边的文件必须保持一致
- 任何对 15 操作符、7 channel、tc-exec 格式的修改都要**同时更新两个 Skill**

---

## 版本

- **v1**: 2026-04-14 初版
  - 5 步工作流
  - 支持 5 个测试框架（Jest / Vitest / JUnit5 / pytest / go test）
  - 3 种 fixture 策略（inline / external / auto）
  - 可扩展 channels_filter（默认 unit，可到 api/db/cli）
  - 独立使用 + SDD 集成双模式
  - 从 test-case-design Skill 拆分而来（framework-adapters.md 原属 test-case-design，现搬到本 Skill 为权威版本）
