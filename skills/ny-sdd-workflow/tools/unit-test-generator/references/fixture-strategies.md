# Fixture 策略指引

本文件定义 `unit-test-generator` Skill 在派生单测骨架时，如何处理测试数据（fixture）的策略。供 SKILL.md 的 Step 4（翻译代码）引用。

**核心问题**：单测需要数据才能跑。数据从哪来？内联写死 / 外部文件 / 运行时生成？本文件给出**三种策略**和**自动判定规则**。

---

## 一、三种策略总览

| 策略 | 何时用 | 优点 | 缺点 |
|---|---|---|---|
| **inline** | 字段数 ≤5 且不被其他用例复用 | 测试代码自包含，一目了然，零外部依赖 | 字段多时冗长，重复数据 |
| **external** | 字段数 >5 或 同一 fixture 被 ≥2 条用例引用 | 数据和代码分离，可复用 | 需要加载逻辑，多一层文件 |
| **auto**（默认） | Skill 自动判定 | 平衡，无需用户决策 | 判定可能不符合特殊需求 |

用户可通过 `fixture_strategy` 参数覆盖默认（`auto` → `inline` / `external` 强制）。

---

## 二、inline 策略

### 判定条件

满足**任一**条件即采用 inline：
- fixture 字段数 ≤5
- 该 fixture 只被 1 条用例引用（不复用）
- 用户显式指定 `fixture_strategy: inline`

### 各框架的 inline 写法

#### Jest / Vitest (TypeScript)

```typescript
// @TC-login-003
import request from 'supertest';
import { app } from '../src/app';
import Database from 'better-sqlite3';

describe('TC-login-003 密码错误 - 返回 401', () => {
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
    `);
    // 内联 fixture（3 个字段，满足 ≤5 条件）
    db.prepare('INSERT INTO users (username, password_hash, status) VALUES (?, ?, ?)').run(
      'zhangsan',
      '$2b$10$abc...',
      'active'
    );
  });

  afterEach(() => {
    db.close();
  });

  it('密码错误返回 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'zhangsan', password: 'wrong_password' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(10001);
  });
});
```

#### JUnit5 (Java)

```java
// @TC-login-003
@DataJpaTest
class TcLogin003Test {

    @Autowired
    private TestEntityManager em;

    @BeforeEach
    void setUp() {
        // 内联 fixture
        var user = new User();
        user.setUsername("zhangsan");
        user.setPasswordHash("$2b$10$abc...");
        user.setStatus("active");
        em.persist(user);
        em.flush();
    }

    @Test
    void passwordErrorReturns401() {
        // 测试代码...
    }
}
```

#### pytest (Python)

```python
# @TC-login-003
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Base, User

@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    sess = Session()

    # 内联 fixture
    sess.add(User(
        username="zhangsan",
        password_hash="$2b$10$abc...",
        status="active"
    ))
    sess.commit()

    yield sess
    sess.close()

def test_password_error_returns_401(session, client):
    response = client.post("/api/auth/login", json={
        "username": "zhangsan",
        "password": "wrong_password"
    })
    assert response.status_code == 401
    assert response.json()["code"] == 10001
```

#### go test

```go
// @TC-login-003
package handler_test

import (
    "testing"
    "github.com/DATA-DOG/go-sqlmock"
)

func TestTcLogin003(t *testing.T) {
    db, mock, _ := sqlmock.New()
    defer db.Close()

    // 内联 fixture
    mock.ExpectQuery("SELECT .+ FROM users WHERE username = ?").
        WithArgs("zhangsan").
        WillReturnRows(sqlmock.NewRows([]string{"id", "username", "password_hash", "status"}).
            AddRow(1, "zhangsan", "$2b$10$abc...", "active"))

    // 测试代码...
}
```

---

## 三、external 策略

### 判定条件

满足**任一**条件即采用 external：
- fixture 字段数 >5
- 同一 fixture 被 ≥2 条用例引用（复用）
- 数据量大（列表 ≥10 条记录）
- 用户显式指定 `fixture_strategy: external`

### fixture 文件位置

**标准路径**：`{output_dir}/skeleton/fixtures/{TC-ID}.json`

- 所有 fixture 文件集中在 `fixtures/` 子目录
- 文件名与 TC-ID 对应
- **共享 fixture**：多条用例引用同一数据 → 文件名用业务名而非 TC-ID，如 `fixtures/zhangsan-active.json`

### 路径引用约束（重要）

**骨架代码中引用 fixture 时，必须使用相对同级路径**：

```typescript
// ✅ 正确：相对同级路径
import fixtures from './fixtures/TC-login-001.json';

// ❌ 错误：绝对路径
import fixtures from '/Users/foo/project/test-cases/skeleton/fixtures/TC-login-001.json';

// ❌ 错误：上级引用
import fixtures from '../fixtures/TC-login-001.json';

// ❌ 错误：skeleton/ 前缀
import fixtures from './skeleton/fixtures/TC-login-001.json';
```

**为什么**：SDD §2.5 Step 5 迁移时，骨架文件从 `{output_dir}/skeleton/{TC-ID}.{framework}.{ext}` 迁到 `{test_dirs.frontend_unit}/{TC-ID}.test.ts`，fixture 文件从 `{output_dir}/skeleton/fixtures/{TC-ID}.json` 迁到 `{test_dirs.frontend_unit}/fixtures/{TC-ID}.json`。**两者保持同级关系不变**。

因此只有使用相对同级路径 `./fixtures/{TC-ID}.json`，骨架代码在迁移前后都能正确引用 fixture，**无需 SDD 侧重写 import 路径**。

这个约束由本 Skill 在 Step 4（逐条翻译）生成代码时强制执行。各框架的 fixture 加载语法（Jest/Vitest/JUnit5/pytest/go test）都使用相对同级路径。

### fixture 文件格式（JSON）

推荐 JSON 作为 fixture 格式（跨语言通用）：

```json
{
  "users": [
    {
      "id": 1,
      "username": "zhangsan",
      "password_hash": "$2b$10$abc...",
      "email": "zhangsan@example.com",
      "phone": "13800138000",
      "status": "active",
      "role": "user",
      "created_at": "2026-01-01T00:00:00Z",
      "last_login_at": null,
      "login_fail_count": 0
    }
  ],
  "sessions": [],
  "metadata": {
    "description": "正常状态的 zhangsan 用户（10 字段超过 inline 阈值）",
    "referenced_by": ["TC-login-001", "TC-login-003", "TC-login-005"]
  }
}
```

**规则**：
- 顶层按**表名**分组
- 每个表下是对象数组
- 可选 `metadata` 描述用途和被引用清单
- **不支持动态字段**（如 `created_at: "now()"）`）→ 用固定时间戳

### 各框架的加载方式

#### Jest / Vitest (TypeScript)

```typescript
import fixtures from './fixtures/zhangsan-active.json';

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`CREATE TABLE users (...);`);
  for (const user of fixtures.users) {
    db.prepare(
      `INSERT INTO users (id, username, password_hash, email, phone, status, role, created_at, last_login_at, login_fail_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      user.id,
      user.username,
      user.password_hash,
      user.email,
      user.phone,
      user.status,
      user.role,
      user.created_at,
      user.last_login_at,
      user.login_fail_count
    );
  }
});
```

#### JUnit5 (Java)

```java
@BeforeEach
void setUp() throws Exception {
    // 读 fixture 文件
    var mapper = new ObjectMapper();
    var fixtures = mapper.readTree(
        getClass().getResourceAsStream("/fixtures/zhangsan-active.json")
    );

    for (var userNode : fixtures.get("users")) {
        var user = new User();
        user.setUsername(userNode.get("username").asText());
        user.setPasswordHash(userNode.get("password_hash").asText());
        // ... 其他字段
        em.persist(user);
    }
    em.flush();
}
```

#### pytest (Python)

```python
import json
from pathlib import Path

@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    sess = Session()

    # 读 fixture 文件
    fixture_path = Path(__file__).parent / "fixtures" / "zhangsan-active.json"
    fixtures = json.loads(fixture_path.read_text(encoding="utf-8"))

    for user_data in fixtures["users"]:
        sess.add(User(**user_data))
    sess.commit()

    yield sess
    sess.close()
```

#### go test

```go
import (
    "encoding/json"
    "os"
)

type UserFixture struct {
    ID           int    `json:"id"`
    Username     string `json:"username"`
    // ... 其他字段
}

type Fixtures struct {
    Users []UserFixture `json:"users"`
}

func loadFixtures(t *testing.T, path string) *Fixtures {
    data, err := os.ReadFile(path)
    if err != nil {
        t.Fatalf("load fixture: %v", err)
    }
    var fx Fixtures
    if err := json.Unmarshal(data, &fx); err != nil {
        t.Fatalf("parse fixture: %v", err)
    }
    return &fx
}
```

---

## 四、auto 策略（默认判定规则）

Skill 默认使用 `auto` 策略，按以下规则自动判定每条用例用 inline 还是 external：

### 判定流程

```
对每条用例的 tc-exec 块：
  1. 解析 "前置" 动作中的 db.seed {path}
  2. 若无 db.seed → 无 fixture 需求，跳过
  3. 若有 db.seed：
     a. 统计该 fixture 被多少条用例引用（扫描所有 tc-exec）
     b. 估算 fixture 的字段数（从 DES 数据模型推断，或从 db.seed 路径名推断）
     c. 应用判定规则：
        - 字段数 ≤5 且 引用数 = 1 → inline
        - 字段数 >5 或 引用数 ≥2 → external
        - 无法估算字段数 → 默认 inline（最简方案）
     d. 记录决策到日志
```

### 估算字段数的方法

1. **从 DES 数据模型读取**（优先）：如果输入含 `design_source`，读 DES 的字段定义
2. **从 fixture 路径名猜测**：`users/zhangsan.yaml` 默认按 "user" 实体估算（若 DES 有 user 表，用 DES 字段数）
3. **从 tc-exec 断言反推**：断言中引用了哪些字段，至少这些字段都需要
4. **兜底**：无法估算 → 5 字段（边界值，偏向 inline）

### 复用度统计

扫描 TC 文档中的所有 tc-exec 块，对 `db.seed {path}` 动作做计数：

```
db.seed users/zhangsan.yaml  → 3 次（被 TC-login-001, TC-login-003, TC-login-005 引用）
db.seed orders/order-1001.yaml → 1 次
db.seed products/sample.yaml → 1 次
```

引用数 ≥2 的 fixture 强制 external（避免重复内联）。

---

## 五、降级策略

### 场景 1：test_db 缺失（无 DSN）

**策略**：用 **in-memory database** 降级（不改 fixture 策略本身）

- Jest/Vitest → `better-sqlite3` in-memory (`new Database(':memory:')`)
- JUnit5 → H2 in-memory (`jdbc:h2:mem:test;DB_CLOSE_DELAY=-1`)
- pytest → sqlite in-memory (`sqlite:///:memory:`)
- go test → `go-sqlmock`

Fixture 策略（inline/external）和 DB 类型独立，互不影响。

### 场景 2：seed_dir 缺失（不知道 fixture 从哪读）

**策略**：强制切换到 `inline`，所有数据内联到测试代码里

```
【fixture 策略调整】
检测到 .test-env.md 未声明 seed_dir，无法使用 external fixture 文件
  降级: fixture_strategy auto → inline
  影响: 字段数 >5 的 fixture 也会内联到测试代码，可能使单测文件变大
```

### 场景 3：fixture 文件路径已存在但 Skill 无法读取

**策略**：生成新的 fixture 文件，命名加上后缀 `.generated.json`

```
{output_dir}/skeleton/fixtures/
├── zhangsan-active.json           (原有文件，Skill 未覆盖)
└── zhangsan-active.generated.json (Skill 生成的新文件)
```

回执中提示用户对比两者。

### 场景 4：无 DES 数据模型，字段数无法估算

**策略**：回退到 inline 默认（因为不确定字段数时内联更安全——避免生成空的 external 文件）

---

## 六、与 `.test-env.md` 的关系

Skill 的 Step 2 读取 `.test-env.md` 的以下字段决定 fixture 行为：

| 字段 | 用途 |
|---|---|
| `test_db.type` | 决定用什么降级 in-memory 方案 |
| `test_db.seed_dir` | fixture 文件的查找根目录（默认值） |
| `test_dirs.backend_unit` | 骨架代码的目标目录，fixture 文件放到 `{test_dirs.backend_unit}/fixtures/` |
| `vars.*` | fixture 中的占位符（如 `${env.vars.test_user}` → 展开为实际值） |

`.test-env.md` 缺失 → 按场景 1/2 降级处理。

---

## 七、fixture_strategy 参数

Skill 接受可选参数 `fixture_strategy` 覆盖 auto 判定：

| 值 | 行为 |
|---|---|
| `auto`（默认） | 按字段数 + 复用度自动判定 |
| `inline` | 强制所有 fixture 内联，无论字段数 |
| `external` | 强制所有 fixture 外部文件，无论字段数 |
| `hybrid` | 同义于 `auto` |

示例调用：

```
独立模式：
  "从 TC-login-登录.md 生成 Jest 单测，strategy: inline"
  →  Skill 把所有 fixture 内联到代码里

SDD 模式：
  默认 auto，不需要用户指定
```

---

## 八、fixture 生成质量自检

Skill Step 5 写入 fixture 文件后，逐项自检：

1. [ ] fixture 文件 JSON 格式合法
2. [ ] 所有必填字段都有值（根据 DES 数据模型）
3. [ ] 时间戳用 ISO 8601 格式（`YYYY-MM-DDTHH:mm:ssZ`）
4. [ ] 外键引用一致（`order.user_id` 指向存在的 `users[id=1]`）
5. [ ] 密码/密钥字段用明显的测试值（`test-password`、`$2b$10$test...`）
6. [ ] 敏感字段不含真实生产数据
7. [ ] 字符串字段未超过数据库 VARCHAR 长度限制
8. [ ] metadata 字段描述了 fixture 用途和被引用 TC ID
9. [ ] 骨架代码正确加载 fixture（路径相对 test 文件）
10. [ ] 内联 fixture 的代码无明显语法错误

不通过项当场修复。

---

## 九、常见错误和修复

| 错误 | 原因 | 修复 |
|---|---|---|
| 内联 fixture 过多字段导致代码超过 50 行 | 应该用 external | 切换 fixture_strategy 为 external |
| external fixture 但只用一次 | 过度使用 external | 切换到 inline 或保持 auto |
| fixture 时间戳用 `Date.now()` 等动态值 | 测试不确定 | 改为固定时间戳 |
| 不同 fixture 用相同 id → 外键冲突 | id 重复 | 不同 fixture 用不同 id 段 |
| fixture 加载路径用绝对路径 | 不可移植 | 改为相对路径（`./fixtures/xxx.json`） |
| fixture 字段名不匹配 DES | 字段演进导致 | 以 DES 为准，同步修改 fixture |
| fixture 含生产数据（真实用户名/邮箱） | 隐私风险 | 替换为测试值（`test-user-001`） |

---

## 十、与 test-case-design Skill 的接口约定

`unit-test-generator` 消费 `test-case-design` 产出的 TC 文档时，对 fixture 做以下约定：

1. TC 文档中的 `db.seed {path}` 动作 → `unit-test-generator` 识别为 fixture 引用
2. 相对路径的解析规则：
   - 若 TC 文档和 `unit-test-generator` 都在同一 output_dir 下 → 相对路径相对 output_dir
   - 若 TC 文档是用户显式传入的路径 → 相对路径相对 TC 文档所在目录
3. fixture 文件**不存在**时的策略（顺序）：
   - a. 尝试从 DES 数据模型 + 合理默认值**自动生成** fixture 文件
   - b. 生成失败 → 在骨架代码中留 TODO 注释提示用户手工补充
   - c. 告知用户在回执中

**与 test-case-design 的解耦**：`unit-test-generator` 不依赖 `test-case-design` 的存在。任何遵守 `tc-exec-schema.md` 的 TC 文档都能被消费，哪怕是人工手写的。
