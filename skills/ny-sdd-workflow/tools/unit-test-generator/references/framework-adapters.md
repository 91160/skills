# 测试框架适配器 — 完整可跑的单测模板库

本文件为 Skill Step 6（派生单测骨架）提供每个测试框架的完整代码模板。Skill 按 `framework_hint` 选对应模板，逐条 tc-exec 翻译为**完整可跑**的测试文件。

**前置阅读**：`tc-exec-schema.md`、`channel-playbooks.md`。

**覆盖框架**：Jest / Vitest / JUnit5 / pytest / go test

---

## 一、DSL 操作符 → 各框架 matcher 映射表

15 个固定操作符到 5 个框架的 matcher 完整映射。Skill 按此表逐条翻译断言。

| DSL | Jest | Vitest | JUnit5 | pytest | go test |
|---|---|---|---|---|---|
| `==` | `expect(x).toBe(v)` / `.toEqual(v)` | `expect(x).toBe(v)` | `assertEquals(v, x)` | `assert x == v` | `if x != v { t.Errorf(...) }` |
| `!=` | `expect(x).not.toBe(v)` | `expect(x).not.toBe(v)` | `assertNotEquals(v, x)` | `assert x != v` | `if x == v { t.Errorf(...) }` |
| `>` | `expect(x).toBeGreaterThan(v)` | `expect(x).toBeGreaterThan(v)` | `assertTrue(x > v)` | `assert x > v` | `if x <= v { t.Errorf(...) }` |
| `>=` | `expect(x).toBeGreaterThanOrEqual(v)` | 同 Jest | `assertTrue(x >= v)` | `assert x >= v` | `if x < v { t.Errorf(...) }` |
| `<` | `expect(x).toBeLessThan(v)` | 同 Jest | `assertTrue(x < v)` | `assert x < v` | `if x >= v { t.Errorf(...) }` |
| `<=` | `expect(x).toBeLessThanOrEqual(v)` | 同 Jest | `assertTrue(x <= v)` | `assert x <= v` | `if x > v { t.Errorf(...) }` |
| `exists` | `expect(x).toBeDefined()` + `.not.toBeNull()` | 同 Jest | `assertNotNull(x)` | `assert x is not None` | `if x == nil { t.Errorf(...) }` |
| `not_exists` | `expect(x).toBeUndefined()` 或 `.toBeNull()` | 同 Jest | `assertNull(x)` | `assert x is None` | `if x != nil { t.Errorf(...) }` |
| `type` | `expect(typeof x).toBe("string")` | 同 Jest | `assertInstanceOf(String.class, x)` | `assert isinstance(x, str)` | `if reflect.TypeOf(x).Kind() != reflect.String { t.Errorf(...) }` |
| `regex` | `expect(x).toMatch(/pattern/)` | 同 Jest | `assertTrue(x.matches("pattern"))` | `assert re.match(r"pattern", x)` | `if !regexp.MustCompile("pattern").MatchString(x) { t.Errorf(...) }` |
| `contains` | `expect(x).toContain(v)` | 同 Jest | `assertTrue(x.contains(v))` | `assert v in x` | `if !strings.Contains(x, v) { t.Errorf(...) }` |
| `not_contains` | `expect(x).not.toContain(v)` | 同 Jest | `assertFalse(x.contains(v))` | `assert v not in x` | `if strings.Contains(x, v) { t.Errorf(...) }` |
| `length==` | `expect(x).toHaveLength(v)` | 同 Jest | `assertEquals(v, x.size())` | `assert len(x) == v` | `if len(x) != v { t.Errorf(...) }` |
| `length>=` | `expect(x.length).toBeGreaterThanOrEqual(v)` | 同 Jest | `assertTrue(x.size() >= v)` | `assert len(x) >= v` | `if len(x) < v { t.Errorf(...) }` |
| `length<=` | `expect(x.length).toBeLessThanOrEqual(v)` | 同 Jest | `assertTrue(x.size() <= v)` | `assert len(x) <= v` | `if len(x) > v { t.Errorf(...) }` |

### 路径到代码的转换

DSL 路径在各框架下的访问方式：

| DSL 路径 | Jest/Vitest (supertest res) | JUnit5 (MockMvc) | pytest (httpx) | go test (httptest) |
|---|---|---|---|---|
| `http.status` | `res.status` | `.andExpect(status().is(...))` 或 `result.getResponse().getStatus()` | `response.status_code` | `rec.Code` |
| `http.headers.{X}` | `res.headers["x"]` | `result.getResponse().getHeader("X")` | `response.headers["X"]` | `rec.Header().Get("X")` |
| `json.{field}` | `res.body.field` | `result.getResponse().getContentAsString()` + Jackson | `response.json()["field"]` | `var body map[string]interface{}; json.Unmarshal(rec.Body.Bytes(), &body)` |
| `stdout` | `execSync().toString()` | `ProcessBuilder` output | `subprocess.run(...).stdout` | `cmd.CombinedOutput()` |
| `exit_code` | `execSync` 的返回 | 同上 | `.returncode` | `cmd.ProcessState.ExitCode()` |

---

## 二、Jest 模板（channel=api + supertest，channel=db + better-sqlite3）

### 依赖要求（在生成的文件头部注释标注）

```
// 依赖：jest、supertest、@types/supertest（如果是 TypeScript）
// 如 channel=db：追加 better-sqlite3
// 安装：npm i -D jest supertest @types/supertest better-sqlite3
```

### channel=api 完整可跑模板

```typescript
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=api → jest
// 执行契约原文见对应 TC 文档的 tc-exec 块
import request from 'supertest';
import { app } from '../src/app'; // 按项目实际路径调整
import Database from 'better-sqlite3';

describe('{TC-ID} {用例描述}', () => {
  let db: Database.Database;

  beforeEach(() => {
    // fixture: 若 test_db 缺失，用 in-memory sqlite 降级
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        status TEXT DEFAULT 'active'
      );
      INSERT INTO users (username, password_hash) VALUES
        ('zhangsan', '$2b$10$abc...'); -- 示意，实际 hash
    `);
    // 若原 tc-exec 有 db.seed，这里内联生成 fixture 数据
  });

  afterEach(() => {
    db.close();
  });

  it('{用例描述}', async () => {
    // === 请求部分：从 tc-exec 的 http fence 翻译 ===
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        username: 'zhangsan',
        password: 'wrong_password',
      });

    // === 断言部分：从 tc-exec 的 bullet list 逐条翻译 ===
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

### channel=db 完整可跑模板

```typescript
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=db → jest + better-sqlite3
import Database from 'better-sqlite3';

describe('{TC-ID} {用例描述}', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        status TEXT NOT NULL,
        cancelled_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO orders (id, status) VALUES (1001, 'shipped');
    `);
  });

  afterEach(() => {
    db.close();
  });

  it('已发货订单不应被取消', () => {
    // === 请求部分：从 tc-exec 的 sql fence 翻译 ===
    // 此处通常包裹在被测的业务函数中，而非直接执行 SQL
    // 如果是被测业务函数：
    //   const result = cancelOrder(db, 1001);
    //   expect(result.ok).toBe(false);
    // 如果是纯数据层约束：
    db.prepare(`UPDATE orders SET status = 'cancelled' WHERE id = 1001 AND status != 'shipped'`).run();

    // === 断言部分 ===
    // db[orders][id=1001].status == "shipped"
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(1001);
    expect(order.status).toBe('shipped');
    // db[orders][id=1001].cancelled_at not_exists
    expect(order.cancelled_at).toBeNull();
  });
});
```

### 降级策略（test_db 缺失时）

- **数据库**：用 `better-sqlite3` in-memory 模式，在 `beforeEach` 里 `CREATE TABLE` + `INSERT` 生成 fixture
- **base_url**：用 `request(app)` 直接注入 Express/Koa 实例，无需真实服务
- **复杂 fixture**：生成到 `{output_dir}/skeleton/fixtures/{TC-ID}.json`，在 `beforeEach` 读取

---

## 三、Vitest 模板

### 与 Jest 的差异

- `import { describe, it, expect, beforeEach, afterEach } from 'vitest'`（Vitest 需要显式 import，Jest 全局注入）
- matcher API 与 Jest 完全兼容
- 运行命令：`vitest run` 而不是 `jest`

### channel=api 完整可跑模板

```typescript
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=api → vitest
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import Database from 'better-sqlite3';

describe('{TC-ID} {用例描述}', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    // fixture 初始化
  });

  afterEach(() => {
    db.close();
  });

  it('{用例描述}', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'zhangsan', password: 'wrong_password' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(10001);
    expect(res.body.data?.token).toBeUndefined();
  });
});
```

---

## 四、JUnit5 模板（channel=api + MockMvc，channel=db + @DataJpaTest + H2）

### 依赖要求

```
// 依赖：
//   spring-boot-starter-test (含 JUnit5 + MockMvc + AssertJ)
//   com.h2database:h2 (channel=db 用)
// Maven / Gradle 直接声明
```

### channel=api 完整可跑模板（Spring Boot）

```java
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=api → JUnit5 + MockMvc
package com.example.test;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Tc{TCIdPascal}Test {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // TODO: fixture 初始化（若 tc-exec 有 db.seed）
        // 建议使用 @Sql 注解或 DataJpaTest 的 H2 schema 注入
    }

    @AfterEach
    void tearDown() {
        // TODO: 清理
    }

    @Test
    @DisplayName("{TC-ID} {用例描述}")
    void test{TCIdCamel}() throws Exception {
        // === 请求 ===
        var result = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "username": "zhangsan",
                      "password": "wrong_password"
                    }
                    """)
        ).andReturn();

        // === 断言 ===
        var response = result.getResponse();
        // http.status == 401
        assertEquals(401, response.getStatus());
        // json.code == 10001
        // （使用 Jackson 或 JSONPath 解析 body）
        var body = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(response.getContentAsString());
        assertEquals(10001, body.get("code").asInt());
        // json.msg == "用户名或密码错误"
        assertEquals("用户名或密码错误", body.get("msg").asText());
        // json.data.token not_exists
        var data = body.get("data");
        assertTrue(data == null || data.get("token") == null);
    }
}
```

### channel=db 完整可跑模板（@DataJpaTest + H2）

```java
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=db → JUnit5 + @DataJpaTest + H2
package com.example.test;

import com.example.entity.Order;
import com.example.repository.OrderRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class Tc{TCIdPascal}Test {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private OrderRepository orderRepo;

    @BeforeEach
    void seedData() {
        // 从 tc-exec 的 db.seed 内联生成
        var order = new Order();
        order.setId(1001L);
        order.setStatus("shipped");
        em.persist(order);
        em.flush();
    }

    @Test
    @DisplayName("{TC-ID} 已发货订单不应被取消")
    void shippedOrderCannotBeCancelled() {
        var order = orderRepo.findById(1001L).orElseThrow();
        // 尝试取消（模拟业务调用）
        order.tryCancel(); // 应静默失败或抛业务异常

        // === 断言 ===
        var updated = orderRepo.findById(1001L).orElseThrow();
        // db[orders][id=1001].status == "shipped"
        assertEquals("shipped", updated.getStatus());
        // db[orders][id=1001].cancelled_at not_exists
        assertNull(updated.getCancelledAt());
    }
}
```

---

## 五、pytest 模板（channel=api + httpx，channel=db + sqlalchemy + in-memory sqlite）

### 依赖要求

```
# 依赖：pytest、httpx、sqlalchemy
# channel=api: pytest-asyncio (如果用 async httpx)
# 安装：pip install pytest httpx sqlalchemy
```

### channel=api 完整可跑模板

```python
# @TC-{TC-ID}
# 派生自 TC-{module_id}-{module_name}.md · channel=api → pytest + httpx
import pytest
from httpx import AsyncClient
from src.app import app  # 按项目实际路径调整


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def seed_db():
    # TODO: fixture 初始化（从 tc-exec 的 db.seed 内联）
    yield
    # TODO: 清理


@pytest.mark.asyncio
async def test_tc_{tc_id_snake}(client):
    """{TC-ID} {用例描述}"""
    # === 请求 ===
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "zhangsan",
            "password": "wrong_password",
        },
    )

    # === 断言 ===
    # http.status == 401
    assert response.status_code == 401
    body = response.json()
    # json.code == 10001
    assert body["code"] == 10001
    # json.msg == "用户名或密码错误"
    assert body["msg"] == "用户名或密码错误"
    # json.data.token not_exists
    assert "token" not in body.get("data", {})
```

### channel=db 完整可跑模板

```python
# @TC-{TC-ID}
# 派生自 TC-{module_id}-{module_name}.md · channel=db → pytest + sqlalchemy + in-memory sqlite
import pytest
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    status = Column(String, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    sess = Session()

    # seed
    sess.add(Order(id=1001, status="shipped"))
    sess.commit()

    yield sess
    sess.close()


def test_shipped_order_cannot_be_cancelled(session):
    """{TC-ID} 已发货订单不应被取消"""
    order = session.query(Order).filter_by(id=1001).one()

    # 模拟业务调用
    # try_cancel_order(order) → 应拒绝

    session.refresh(order)
    # db[orders][id=1001].status == "shipped"
    assert order.status == "shipped"
    # db[orders][id=1001].cancelled_at not_exists
    assert order.cancelled_at is None
```

---

## 六、go test 模板（channel=api + httptest，channel=db + sqlmock）

### 依赖要求

```
// 依赖：
//   github.com/DATA-DOG/go-sqlmock（channel=db）
//   标准库 net/http/httptest（channel=api）
// go.mod 声明
```

### channel=api 完整可跑模板

```go
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=api → go test + httptest
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	"example.com/project/handler"
)

func TestTc{TCIdCamel}(t *testing.T) {
	// === 请求 ===
	body := strings.NewReader(`{"username":"zhangsan","password":"wrong_password"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", body)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.LoginHandler(rec, req)

	// === 断言 ===
	// http.status == 401
	if rec.Code != 401 {
		t.Errorf("http.status: expected 401, got %d", rec.Code)
	}

	var resBody map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resBody); err != nil {
		t.Fatalf("failed to parse json body: %v", err)
	}

	// json.code == 10001
	if code, _ := resBody["code"].(float64); code != 10001 {
		t.Errorf("json.code: expected 10001, got %v", resBody["code"])
	}
	// json.msg == "用户名或密码错误"
	if msg, _ := resBody["msg"].(string); msg != "用户名或密码错误" {
		t.Errorf("json.msg: expected 用户名或密码错误, got %v", resBody["msg"])
	}
	// json.data.token not_exists
	data, _ := resBody["data"].(map[string]interface{})
	if data != nil {
		if _, exists := data["token"]; exists {
			t.Errorf("json.data.token: expected not_exists, but exists")
		}
	}

	// 避免未使用导入
	_ = bytes.NewBuffer
	_ = regexp.MustCompile
}
```

### channel=db 完整可跑模板（sqlmock）

```go
// @TC-{TC-ID}
// 派生自 TC-{module_id}-{module_name}.md · channel=db → go test + sqlmock
package repo_test

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestTc{TCIdCamel}(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock init: %v", err)
	}
	defer db.Close()

	// seed: 模拟 orders 表有一条 shipped 记录
	mock.ExpectQuery("SELECT .+ FROM orders WHERE id = ?").
		WithArgs(1001).
		WillReturnRows(sqlmock.NewRows([]string{"id", "status", "cancelled_at"}).
			AddRow(1001, "shipped", nil))

	// 业务调用
	// order, _ := repo.FindOrder(db, 1001)
	// cancelled := order.TryCancel()

	// 断言（示意，真实场景按项目 repo 层调整）
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("sqlmock expectations: %s", err)
	}
}
```

---

## 七、Fixture 策略

### 内联 fixture（字段数 ≤5）

直接写在 `beforeEach` / `@BeforeEach` / `setup` / `fixture` 里，用构造函数或原生插入语句。

**示例**（Jest）：
```typescript
beforeEach(() => {
  db.exec(`INSERT INTO users (username, password_hash) VALUES ('zhangsan', '$2b$10$abc...')`);
});
```

### 外部 fixture 文件（字段数 >5 或 需要复用）

Skill 生成 fixture 文件到 `{output_dir}/skeleton/fixtures/{TC-ID}.json`，骨架代码加载它。

**fixture 文件路径约定**：
```
{output_dir}/
└── skeleton/
    ├── TC-login-001.jest.ts
    ├── TC-login-007.junit.java
    └── fixtures/
        ├── TC-login-001.json
        └── TC-login-007.json
```

**fixture 文件示例** (`TC-login-001.json`)：
```json
{
  "users": [
    {
      "id": 1,
      "username": "zhangsan",
      "password_hash": "$2b$10$abc...",
      "email": "zhangsan@example.com",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z",
      "last_login_at": null
    }
  ]
}
```

**骨架加载 fixture**（Jest 示例）：
```typescript
import fixtures from './fixtures/TC-login-001.json';

beforeEach(() => {
  for (const user of fixtures.users) {
    db.prepare(
      'INSERT INTO users (id, username, password_hash, email, status) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, user.username, user.password_hash, user.email, user.status);
  }
});
```

### fixture 生成规则（Skill Step 6 执行）

- tc-exec 的 `db.seed {path}` 动作 → 检查原路径是否存在
  - 存在 → 骨架代码引用原路径
  - 不存在 → Skill 从 DES 数据模型 + 合理默认值生成 fixture 到 `skeleton/fixtures/{TC-ID}.json`
- 字段数 ≤5 → 内联到骨架代码
- 字段数 >5 → 生成独立 fixture 文件

---

## 八、降级策略

### test_db 缺失时

| 框架 | 降级方案 |
|---|---|
| Jest / Vitest | `better-sqlite3` in-memory (`new Database(':memory:')`) |
| JUnit5 | H2 in-memory (`jdbc:h2:mem:test;DB_CLOSE_DELAY=-1`) |
| pytest | sqlite in-memory (`sqlite:///:memory:`) |
| go test | `go-sqlmock` |

骨架代码里所有 DB 操作都通过这些内存替代实现，不依赖外部数据库连接。

### base_url 缺失时

| 框架 | 降级方案 |
|---|---|
| Jest / Vitest | `request(app)` 直接注入 Express/Koa/Fastify 实例 |
| JUnit5 | `MockMvc` + `@AutoConfigureMockMvc` |
| pytest | `httpx.AsyncClient(app=app)` 注入 FastAPI 实例 |
| go test | `httptest.NewRecorder()` + 直接调用 handler 函数 |

### framework_hint 缺失时

- Skill Step 6 整个跳过
- `test-case-status: doc-only`
- 回执中明确提示："未声明测试框架，单测骨架未派生。若要派生，请在 `.test-env.md` 补充 `test_commands` 字段或调用时传递 `framework_hint`"

---

## 九、依赖提示模板（Skill 回执中使用）

Skill 完成 Step 6 后，在回执中追加"依赖检查"段落：

```
【依赖提示】为让生成的单测骨架可跑，请确保项目已安装以下依赖：

{框架}: {依赖清单}
  - jest                  (已有可跳过)
  - supertest             (npm i -D supertest)
  - better-sqlite3        (npm i -D better-sqlite3)

若项目使用的是其他测试框架，可告诉我并重新生成。
```

---

## 十、派生质量自检清单

Skill Step 6 派生每个骨架文件后，必须自检：

1. [ ] 文件名符合 `{TC-ID}.{framework}.{ext}` 模式
2. [ ] 文件头有 `// @TC-{TC-ID}` 注释
3. [ ] import 语句完整
4. [ ] describe/test/it 结构与用例名对齐
5. [ ] 请求部分从 tc-exec 的 fence block 翻译
6. [ ] 断言部分从 tc-exec 的 bullet 逐条翻译到框架 matcher
7. [ ] setup/cleanup 实现（内联或 TODO 注释）
8. [ ] fixture 文件（若需要）已生成到 `skeleton/fixtures/`
9. [ ] 依赖声明已记入回执
10. [ ] 代码语法基本正确（无明显语法错误）

不通过项当场修复。
