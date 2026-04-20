# unit-test-generator

> **从 TC 测试用例文档派生完整可跑单测代码的 AI Skill**
> 输入符合 tc-exec-schema 规范的 TC 文档 + 测试框架声明，输出对应框架的可跑单测代码（Jest / Vitest / JUnit5 / pytest / go test）。

---

## 这是什么

`unit-test-generator` 是一个**独立的 AI Skill**，把测试用例文档（TC 文档）转换成对应测试框架的**完整可跑**单测代码。

它消费符合 `tc-exec-schema` 规范的 Markdown TC 文档，按指定测试框架翻译成可直接 `npm test` / `mvn test` / `pytest` 跑通的代码。

**核心定位**：**独立工具**。只要你给一份带 tc-exec 块的 TC 文档 + 告诉它用什么框架，它就能产出可直接跑的测试文件。**TC 文档来源不限**——可以是 `test-case-design` Skill 自动生成的，也可以是 QA 人工撰写的，只要符合 tc-exec 格式。

---

## 解决什么问题

| 痛点 | 本 Skill 的解法 |
|---|---|
| 测试用例写完手工翻译成代码很费时 | 从 tc-exec 块**自动翻译**到框架代码（DSL 操作符 → matcher 映射） |
| 不同框架语法不熟，写出来不规范 | 5 个主流框架的**完整代码模板库**，照抄即可 |
| 测试数据准备繁琐 | 3 种 fixture 策略（inline / external / auto），按字段数自动判定 |
| 没有真实测试数据库就跑不了 | 自动降级 in-memory DB（sqlite / H2 / sqlmock） |
| 测试栈迁移成本高（Jest → Vitest） | 改 framework_hint 重跑即可，无需手写 |
| 用例和代码容易不同步 | 每条单测顶部加 `// @TC-{ID}` 注释反向追溯 |

---

## 覆盖的测试层级（重要说明）

**命名澄清**：虽然 Skill 叫 `unit-test-generator`，它生成的**代码形式**是单元测试框架（Jest / Vitest / JUnit5 / pytest / go test），但**测试内容**覆盖多个层级，不全是严格意义的单元测试。

### 测试金字塔中的位置

```
         /\
        /E2E\             ← 真实浏览器 / Cypress / Selenium ❌ 不生成
       /------\
      / 集成   \          ← 真实数据库 / Testcontainers    ❌ 不生成
     /----------\
    / API 功能   \        ← supertest / MockMvc / httpx    ✅ channel=api
   /--------------\
  /  数据层集成    \       ← in-memory sqlite / H2 / sqlmock ✅ channel=db
 /------------------\
/   单元测试（纯函数）  \   ← 严格单测                       ✅ channel=unit
----------------------
```

本 Skill 覆盖**底部三层 + CLI**，都是"进程内、快速、CI 友好"的测试。

### 按 channel 分类

| channel | 代码形式 | 实际测试层级 | 严格分类 |
|---|---|---|---|
| `unit` | `it('纯函数')` | 无外部依赖的纯函数逻辑 | ✅ **严格单元测试** |
| `api` | `request(app).post(...)` | HTTP 接口行为（Express/Spring 等路由） | ⚠️ **API 级功能测试 / 组件级集成测试** |
| `db` | `db.prepare(...).run()` + in-memory | 数据持久化 + 业务规则 | ⚠️ **数据层集成测试** |
| `cli` | `execSync('./bin/cli ...')` | 命令行工具输出 | ⚠️ **CLI 级功能测试** |
| `ui-dom` | Playwright `page.click(...)` | 前端 DOM 交互 | ⚠️ **UI 自动化测试**（需 Playwright MCP） |
| `ui-visual` | — | 视觉回归 | ❌ **不生成**（仅 test-case-design 保留描述） |
| `manual` | — | 跨系统联调 / 物理设备 | ❌ **不生成**（仅 test-case-design 保留描述） |

### 关键特点

1. **所有生成的代码都是"进程内测试"**：不依赖外部真实服务
   - HTTP 请求 → `supertest(app)` 进程内注入
   - 数据库 → in-memory DB（sqlite / H2 / sqlmock）
   - CLI → `execSync` / `ProcessBuilder` / `subprocess` 子进程
2. **都可以在 CI 的 unit test 阶段跑完**：`npm test` / `mvn test` / `pytest` / `go test` 一条命令
3. **不生成需要真实环境的测试**：
   - ❌ Cypress / Selenium / Playwright（真实浏览器）- 除非显式 `channels_filter` 带 ui-dom
   - ❌ Testcontainers / Docker 启动的真实数据库
   - ❌ 真实 HTTP 请求到部署的服务
   - ❌ 性能测试 / 压力测试 / 安全测试

### 命名里的 "unit" 是宽泛定义

业界对"unit test"的定义有两派：

| 定义 | 代表人物 | 范围 |
|---|---|---|
| **严格单元测试**（Solitary Unit Test） | Kent Beck, Martin Fowler | 纯函数，禁止任何外部依赖 |
| **宽泛单元测试**（Sociable Unit Test） | Google Testing Blog, ThoughtWorks | 允许 in-memory DB、supertest、mocks，只要"快、独立、可重复" |

**本 Skill 采用宽泛定义**——与 Jest/JUnit/pytest 生态一致，把所有"用单测框架写的、能在 CI unit test 阶段跑完的代码"都叫 unit test。

### 与 test-case-design 的分工

```
test-case-design（上游）
  ↓ 产出：TC 文档（功能测试用例为主）
  ↓ 定位：QA 视角的"测什么"
  ↓ 用户：测试工程师

unit-test-generator（本 Skill，下游）
  ↓ 消费：TC 文档的 tc-exec 块（channel=unit/api/db/cli/ui-dom）
  ↓ 产出：Jest/JUnit5/pytest/go test 代码
  ↓ 定位：开发视角的"怎么写代码跑这些用例"
  ↓ 用户：开发工程师 + CI 流水线
```

### 一句话定位

> **本 Skill 把 TC 文档翻译成"可在 CI 单测阶段快速跑完的进程内测试代码"**，覆盖 4 个层级：纯函数单元测试 + API 功能测试 + 数据层集成测试 + CLI 功能测试。不包括真实浏览器/真实服务的 E2E 测试。

---

## 核心特性

### 🚀 5 个测试框架支持

| 框架 | 适用场景 | 默认 channel 映射 |
|---|---|---|
| **Jest** | TypeScript / JavaScript 前后端 | api → supertest，db → better-sqlite3 |
| **Vitest** | 现代 JS/TS 项目 | api → supertest，db → better-sqlite3 |
| **JUnit5** | Java + Spring Boot | api → MockMvc，db → @DataJpaTest + H2 |
| **pytest** | Python | api → httpx，db → sqlalchemy + sqlite in-memory |
| **go test** | Go | api → httptest，db → go-sqlmock |

每个框架都有：
- import / boilerplate 模板
- DSL 操作符 → 框架 matcher 完整映射表
- channel=api 用例完整模板
- channel=db 用例完整模板
- 降级策略（无 test_db / 无 base_url 时的 fallback）

### 🎯 完整可跑（不是骨架）

生成的代码**不是 TODO 占位符**，而是**完整可编译可运行的测试文件**：

- ✅ import 语句完整
- ✅ describe / test / it 结构 + 名称与用例一致
- ✅ 请求代码从 tc-exec fence block **直译**
- ✅ 断言代码按映射表**逐条翻译** DSL → matcher
- ✅ setup / cleanup 实现（基于 fixture 策略）
- ✅ 文件头 `// @TC-{TC-ID}` 注释追溯

### 🗂️ 3 种 Fixture 策略

| 策略 | 何时用 | 优点 |
|---|---|---|
| **inline** | 字段数 ≤5 且不复用 | 测试代码自包含，零外部依赖 |
| **external** | 字段数 >5 或被多条用例复用 | 数据和代码分离，可复用 |
| **auto**（默认） | Skill 自动判定 | 无需用户决策 |

详见 [`references/fixture-strategies.md`](./references/fixture-strategies.md)。

### 📋 共享 tc-exec 契约

本 Skill 和 `test-case-design` Skill 共享同一份 `tc-exec-schema.md` 契约：

- **15 个固定断言操作符**：`==` / `!=` / `>` / `>=` / `<` / `<=` / `exists` / `not_exists` / `type` / `regex` / `contains` / `not_contains` / `length==` / `length>=` / `length<=`
- **7 个 channel**：api / db / unit / cli / ui-dom / ui-visual / manual
- **JSONPath 简化路径**：`json.data.token` / `db[users][id=1].status` / `stdout` / `dom[.btn].text`
- **变量引用**：`${env.base_url}` 从 `.test-env.md` 解析

详见 [`references/tc-exec-schema.md`](./references/tc-exec-schema.md)（本 Skill 的副本，**权威版本在 test-case-design Skill**）。

---

## 安装

**已内置在 ny-sdd-workflow 的 `tools/unit-test-generator/` 目录下**，安装 ny-sdd-workflow 后即可使用，无需单独安装。

---

## 快速开始

### 场景 A：独立批量生成（最常见）

你已经有一份 `login-cases.md`，里面有 15 条测试用例，每条都有 tc-exec 块。一键生成 Jest 单测：

```
"用 unit-test-generator 读 ./tests/login-cases.md 生成 jest 单测到 ./tests/generated/"
```

Skill 输出：
- `./tests/generated/skeleton/TC-login-001.jest.ts`
- `./tests/generated/skeleton/TC-login-002.jest.ts`
- ...（15 个完整可跑单测文件）
- `./tests/generated/skeleton/fixtures/`（外部 fixture，按需）

### 场景 B：测试框架迁移

把一批从 Jest 迁到 Vitest：

```
"用 unit-test-generator 把 ./test-cases/ 下所有 TC 文档用 vitest 重新生成"
```

Skill 对每个 TC 文档调用一次，产出 vitest 版本。

### 场景 C：与 test-case-design 串联

完整流程：从 REQ 到可跑代码

```
"先用 test-case-design 从 ./docs/REQ.md 生成 TC 文档，
然后用 unit-test-generator 把生成的 TC 文档转成 jest 单测"
```

Skill 链：
1. test-case-design 读 REQ.md → 输出 `./test-cases/TC-{module}.md`
2. unit-test-generator 读 TC-{module}.md → 输出 `./test-cases/skeleton/`

### 场景 D：SDD 工作流集成

在 ny-sdd-workflow 的 §3.7 开发自测阶段自动调用，无需手动触发。详见 SDD workflow 的 `phase-coding.md`。

### 场景 E：CI 流水线集成

```yaml
# CI 配置示例
- name: 从 TC 文档自动生成单测
  run: |
    claude-cli invoke unit-test-generator \
      --tc_source ./test-cases/*.md \
      --framework_hint jest \
      --output_dir ./src/__tests__/generated
```

---

## 输入契约

| 字段 | 必需/可选 | 说明 |
|---|---|---|
| `tc_source` | **必需** | TC 文档文件路径 或 完整 Markdown 文本 |
| `framework_hint` | **必需** | `jest` / `vitest` / `junit5` / `pytest` / `gotest` |
| `output_dir` | **必需** | 骨架输出目录 |
| `runtime_source` | 可选 | `.test-env.md` 路径（含 test_db / test_dirs / vars） |
| `channels_filter` | 可选 | channel 列表，默认 `["unit"]`，可扩展到 `["unit","api","db"]` |
| `fixture_strategy` | 可选 | `auto` / `inline` / `external` / `hybrid`，默认 `auto` |

**最小输入**：`tc_source` + `framework_hint` + `output_dir`

详见 [SKILL.md](./SKILL.md) 的「输入契约」章节。

---

## 输出产物

```
{output_dir}/skeleton/
├── {TC-ID}.{framework}.{ext}        ← 单测文件，框架后缀标注
├── {TC-ID}.{framework}.{ext}
├── ...
└── fixtures/                        ← 外部 fixture（仅 external 策略）
    ├── {TC-ID}.json
    └── ...
```

**单测文件命名规则**：

| 框架 | 文件名示例 |
|---|---|
| Jest | `TC-login-001.jest.ts` |
| Vitest | `TC-login-001.vitest.ts` |
| JUnit5 | `TC-login-001.junit.java` |
| pytest | `TC-login-001.pytest.py` |
| go test | `TC-login-001.gotest.go` |

**为什么带框架后缀？** 方便 SDD post-processing 按后缀路由到不同源码目录，迁移后再去掉后缀（如 `TC-login-001.jest.ts` → `TC-login-001.test.ts`）。

---

## 与其他 Skill 的关系

### 与 `test-case-design` 的关系（强相关）

两个 Skill **协作**完成"设计 → 执行"闭环，但**完全独立**：

| Skill | 职责 | 输入 | 输出 |
|---|---|---|---|
| `test-case-design` | 测试用例**设计**（"测什么"） | REQ/DES/PRD | TC 文档 + CSV |
| `unit-test-generator`（本 Skill） | 单测代码**派生**（"怎么写"） | TC 文档 | Jest/JUnit/pytest 等代码 |

**关键独立性**：
- 本 Skill 不依赖 `test-case-design` 的存在
- 任何符合 `tc-exec-schema` 规范的 TC 文档都能被消费——可以是 `test-case-design` 生成的，也可以是 QA 人工手写的
- 本 Skill 也可以单独发布、单独安装、单独使用

**共享契约**：两个 Skill 各有一份 `references/tc-exec-schema.md` 副本（方案 A），双份**逐字节一致**。
- **权威版本**：`test-case-design/references/tc-exec-schema.md`
- **副本（本 Skill）**：`unit-test-generator/references/tc-exec-schema.md`

⚠️ **不要直接修改本 Skill 的 tc-exec-schema.md**。需要修改时请先改权威版本，再用 `cp` 同步到本副本。详见 [SKILL.md](./SKILL.md) 的「相关规范文件」和 `references/tc-exec-schema.md` 头部的同步注意。

### 与 `code-audit` 的关系（弱相关）

`code-audit` 审计已写好的代码。本 Skill **生成**新的测试代码——是上下游关系：

```
test-case-design → unit-test-generator → 用户跑通单测 → code-audit 审计被测代码
```

---

## 文件结构

```
unit-test-generator/
├── README.md                       ← 本文档
├── SKILL.md                        ← Skill 入口（frontmatter + 5 步工作流）
└── references/
    ├── tc-exec-schema.md           ← 共享契约（权威版本在 test-case-design）
    ├── framework-adapters.md       ← 5 框架完整代码模板库（最大文件）
    └── fixture-strategies.md       ← inline/external/auto 三种 fixture 策略
```

---

## 工作流程（5 步）

| Step | 内容 |
|---|---|
| **Step 0** | 模式自检（SDD / 独立） |
| **Step 1** | 加载 TC 文档 + 解析 tc-exec 块 |
| **Step 2** | 加载 framework_hint + runtime + 确定 fixture 策略 |
| **Step 3** | 按 channels_filter 筛选用例（默认仅 `unit`） |
| **Step 4** | 逐条翻译（DSL 操作符 → 框架 matcher，请求代码 → 可跑代码） |
| **Step 5** | 写盘 + 自检 + 回执输出 |

详见 [SKILL.md](./SKILL.md) 的「工作流程」章节。

---

## 翻译示例

### 输入：tc-exec 块（从 TC 文档读取）

````markdown
#### TC-login-003 登录 - 密码错误

**channel**: api | **priority**: P0 | **exec-mode**: auto

**请求**:
```http
POST ${env.base_url.local}/api/auth/login
Content-Type: application/json

{"username": "zhangsan", "password": "wrong"}
```

**断言**:
- `http.status == 401`
- `json.code == 10001`
- `json.msg == "用户名或密码错误"`
- `json.data.token not_exists`
````

### 输出：Jest 单测代码（完整可跑）

```typescript
// @TC-login-003
// 派生自 TC-login-登录.md · channel=api → jest
// 执行契约原文见对应 TC 文档的 tc-exec 块
import request from 'supertest';
import { app } from '../src/app';
import Database from 'better-sqlite3';

describe('TC-login-003 登录 - 密码错误', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        status TEXT DEFAULT 'active'
      );
      INSERT INTO users (username, password_hash) VALUES
        ('zhangsan', '$2b$10$abc...');
    `);
  });

  afterEach(() => {
    db.close();
  });

  it('密码错误返回 401 with code 10001', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'zhangsan', password: 'wrong' });

    // http.status == 401
    expect(res.status).toBe(401);
    // json.code == 10001
    expect(res.body.code).toBe(10001);
    // json.msg == "用户名或密码错误"
    expect(res.body.msg).toBe('用户名或密码错误');
    // json.data.token not_exists
    expect(res.body.data?.token).toBeUndefined();
  });
});
```

直接 `npm test` 即可跑通。

---

## DSL 操作符 → 框架 matcher 映射表

15 个固定操作符到 5 个框架的完整映射（节选）：

| DSL | Jest | Vitest | JUnit5 | pytest | go test |
|---|---|---|---|---|---|
| `==` | `toBe` / `toEqual` | `toBe` / `toEqual` | `assertEquals` | `assert ==` | `if x != v` |
| `!=` | `not.toBe` | `not.toBe` | `assertNotEquals` | `assert !=` | `if x == v` |
| `>` | `toBeGreaterThan` | `toBeGreaterThan` | `assertTrue(>)` | `assert >` | `if x <= v` |
| `exists` | `toBeDefined` | `toBeDefined` | `assertNotNull` | `is not None` | `!= nil` |
| `regex` | `toMatch` | `toMatch` | `assertTrue(matches)` | `re.match` | `regexp.MatchString` |
| `contains` | `toContain` | `toContain` | `assertTrue(.contains)` | `in` | `strings.Contains` |
| `length==` | `toHaveLength` | `toHaveLength` | `assertEquals(.size())` | `len() ==` | `len() ==` |

完整映射表见 [`references/framework-adapters.md`](./references/framework-adapters.md) 第一章。

---

## 配置文件 `.test-env.md`（可选但推荐）

如果项目有真实的测试数据库和服务，提供 `.test-env.md` 让生成的代码使用真实环境：

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
```

不提供 `.test-env.md` 也能用，本 Skill 会自动降级到 in-memory DB + mock server 模式：

| 框架 | test_db 缺失时 | base_url 缺失时 |
|---|---|---|
| Jest / Vitest | `better-sqlite3` in-memory | `request(app)` 注入 |
| JUnit5 | H2 in-memory | `MockMvc` |
| pytest | sqlite in-memory | `httpx.AsyncClient(app=app)` |
| go test | `go-sqlmock` | `httptest.NewRecorder()` |

---

## 常见问题

### Q：必须用 `test-case-design` Skill 生成 TC 文档吗？

不必须。本 Skill 消费**任何符合 tc-exec-schema 规范的 TC 文档**——可以是 `test-case-design` 生成的，也可以是 QA 人工手写的，甚至可以是其他工具产出的。只要符合 `references/tc-exec-schema.md` 定义的格式。

### Q：生成的代码能直接 `npm test` 跑吗？

可以。但前提是项目已安装对应依赖。本 Skill 在回执中会列出依赖清单，例如：

```
依赖提示：请确保项目已安装：
  - jest
  - supertest (npm i -D supertest)
  - @types/supertest (npm i -D @types/supertest)
  - better-sqlite3 (npm i -D better-sqlite3)
```

### Q：支持的框架列表外的框架（Mocha / TestNG / unittest）怎么办？

当前不支持。可以：
- A. 在 `references/framework-adapters.md` 中追加新框架模板
- B. 手工按照 15 操作符映射表翻译
- C. 先转用支持的 5 个框架之一

### Q：channel=ui-dom / ui-visual / manual 的用例会被派生吗？

不会。本 Skill 默认只处理 `channel=unit` 的用例。`ui-visual` 和 `manual` 永远不可派生。`api` / `db` / `cli` / `ui-dom` 用例如果想派生（例如生成 supertest / sqlmock / Playwright 代码），可以通过 `channels_filter: ["unit","api","db"]` 扩展。

### Q：fixture 策略怎么选？

默认 `auto` 即可——Skill 按字段数（≤5 inline / >5 external）和复用度（被 ≥2 用例引用 → external）自动判定。如果想强制：
- 全 inline：`fixture_strategy: inline`
- 全 external：`fixture_strategy: external`

详见 [`references/fixture-strategies.md`](./references/fixture-strategies.md)。

### Q：怎么把生成的骨架文件迁到项目源码树？

如果在 SDD 工作流中，§2.5 Step 5 会按文件名后缀自动迁移。

如果独立使用，需要手动迁移。建议：
1. 看回执的"下一步"提示，里面有具体目标目录
2. 用 `cp` / `mv` 把骨架文件迁到 `src/__tests__/` 或 `src/test/java/` 等
3. 重命名时去掉 `.{framework}` 中缀，如 `TC-login-001.jest.ts` → `TC-login-001.test.ts`

### Q：生成的代码被覆盖怎么办？

本 Skill 是**幂等**的——多次对同一 TC 文档运行，生成的骨架内容一致。如果你修改了骨架代码（例如手工补充 setup helper），重新运行会**询问是否覆盖**。建议：
- 把生成的代码作为**起点**，手工修改后保留
- 或者把 setup helper 抽到独立文件，generated 文件保持纯净

---

## 设计原则

1. **完全独立**：不依赖 `test-case-design` 或任何其他 Skill。可独立发布、独立使用
2. **完整可跑**：生成的不是骨架占位符，而是可直接 `npm test` 跑通的代码
3. **格式严格**：15 操作符 / 7 channel / 5 框架都是冻结枚举，禁止 AI 自由扩展
4. **降级友好**：`.test-env.md` 缺失自动降级 in-memory DB；framework_hint 缺失整步跳过
5. **追溯清晰**：每条单测顶部 `// @TC-{ID}` 注释反向追溯到 TC 文档源用例
6. **幂等可靠**：多次执行同一输入产出一致，可在 CI 流水线安全重复运行

---

## 版本

- **v1**（2026-04-14）— 初版
  - 5 步工作流（Step 0~5）
  - 支持 5 个测试框架（Jest / Vitest / JUnit5 / pytest / go test）
  - 3 种 fixture 策略（inline / external / auto）
  - 可扩展 channels_filter（默认 unit，可到 api/db/cli）
  - 独立使用 + SDD 集成双模式
  - 从 test-case-design Skill 拆分而来（framework-adapters.md 原属 test-case-design，现搬到本 Skill 为权威版本）

---

## 许可

MIT

---

## 相关资源

- [SKILL.md](./SKILL.md) — Skill 完整定义（工作流程 + 输入契约 + 输出回执）
- [references/](./references/) — 详细规范文件（tc-exec 契约 + 框架适配器 + fixture 策略）
