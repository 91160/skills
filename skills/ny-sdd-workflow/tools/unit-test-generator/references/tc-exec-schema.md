# tc-exec 执行契约格式规范

本文件定义测试用例中 **tc-exec 块**的完整格式。tc-exec 块是每条用例的"AI 可执行契约"，供下游工具（AI 自测执行器、`unit-test-generator` Skill、人工 QA）解析并执行或派生代码。

**核心原则**：全 Markdown，无 YAML，结构固定，AI 读写零歧义。

> **共享契约同步注意**：本文件是 `test-case-design` 和 `unit-test-generator` 两个 Skill 的**共享契约**，采用方案 A（双份副本，两份文件逐字节一致）。
>
> - `test-case-design` Skill 用本文件**生成** tc-exec 块
> - `unit-test-generator` Skill 用本文件**解析** tc-exec 块
>
> **权威版本约定**：**以 `test-case-design/references/tc-exec-schema.md` 为权威版本（SOURCE OF TRUTH）**，`unit-test-generator/references/tc-exec-schema.md` 是从权威版本复制的副本。
>
> **维护规则**：
> - 对 15 操作符、7 channel、元数据字段、前置/清理动作清单、变量引用语法的任何修改，**必须先从权威版本修改**
> - 修改后同步命令：`cp test-case-design/references/tc-exec-schema.md unit-test-generator/references/tc-exec-schema.md`
> - 验证同步：`diff test-case-design/references/tc-exec-schema.md unit-test-generator/references/tc-exec-schema.md`（应无输出）
> - **两份副本必须逐字节一致**（包括本段同步注意的内容本身）

---

## 一、基本结构

每条测试用例由以下部分组成，顺序固定：

```
#### TC-ID {一句话描述}

**channel**: {枚举值} | **priority**: {P0|P1|P2} | **exec-mode**: {auto|manual}

**请求**:
​```{fence 语言}
{请求内容}
​```

**前置**:
- `{action.name} {args}`

**断言**:
- `{path} {op} {expected}`

**清理**:
- `{action.name} {args}`
```

**强制规则**：

| 部分 | 必需 / 可选 | 说明 |
|---|---|---|
| 标题行 | 必需 | `#### TC-ID 描述`，四级标题，TC-ID 格式 `TC-{module_id}-{seq:03}` |
| 元数据行 | 必需 | `**channel** \| **priority** \| **exec-mode**` 三字段用 `\|` 分隔 |
| 请求 | manual/ui-visual 外必需 | fenced code block，语言标签由 channel 决定 |
| 前置 | 可选 | bullet list，每行一个动作 |
| 断言 | 非 manual/ui-visual 必需 | bullet list，每行一条原子断言 |
| 清理 | 可选 | bullet list，每行一个动作 |

---

## 二、元数据字段

### channel（7 个固定枚举）

| 值 | 含义 | 可执行依赖 |
|---|---|---|
| `api` | HTTP 接口测试 | mcp_capabilities 含 `http-client` |
| `db` | 数据库状态测试 | mcp_capabilities 含 `sql-runner` |
| `unit` | 单元测试（基于代码） | framework_hint 已声明，Step 6 派生骨架 |
| `cli` | 命令行工具测试 | mcp_capabilities 含 `shell` |
| `ui-dom` | 前端 DOM 交互测试 | mcp_capabilities 含 `playwright` 或 `browser` |
| `ui-visual` | 视觉还原测试 | **不可自动执行**，归为人工 |
| `manual` | 人工手工测试 | **不可自动执行**，兜底通道 |

### priority（3 个固定枚举）

| 值 | 含义 | 使用建议 |
|---|---|---|
| `P0` | 核心正向路径 + 主要异常 | smoke test 集合，占比 ≤40% |
| `P1` | 边界场景 + 次要异常 | 主要回归集 |
| `P2` | 极端边界 + 细节 | 完整回归集 |

### exec-mode（2 个固定枚举）

| 值 | 含义 |
|---|---|
| `auto` | AI 可读契约后直接调用工具执行 |
| `manual` | 需要人工参与（UI 视觉、跨系统联调、外部依赖不可用） |

**规则**：`channel` 是 `ui-visual` 或 `manual` 时，`exec-mode` 必须是 `manual`。

---

## 三、请求部分的 fence 语言标签

不同 channel 使用不同的 fenced code block 语言标签，AI 按语言标签识别动作类型：

| channel | fence 语言 | 内容格式 |
|---|---|---|
| `api` | `http` | 完整 HTTP 报文（首行 `METHOD URL`，headers，空行，body） |
| `db` | `sql` | SQL 语句（含 `SELECT` / `INSERT` / `UPDATE` / `DELETE`） |
| `cli` | `bash` | Shell 命令 |
| `unit` | `typescript` / `javascript` / `java` / `python` / `go` | 单测代码（可直接粘贴作为实现，或由 `unit-test-generator` Skill 派生完整可跑版本） |
| `ui-dom` | `text` 或 `playwright` | DOM 操作伪代码或 Playwright 脚本 |
| `ui-visual` | 不使用 fence | 仅自然语言描述 |
| `manual` | 不使用 fence | 仅自然语言步骤 |

### api channel 的 http fence 内容格式

```
METHOD URL
Header-Name: Header-Value
Header-Name-2: Header-Value-2

{"body": "json content here"}
```

- 首行 `METHOD URL`，URL 可含 `${env.xxx}` 变量
- Headers 每行一个
- 空行分隔 body
- body 可以是 JSON / form-urlencoded / plain text

### db channel 的 sql fence 内容格式

```
SELECT * FROM users WHERE id = 1;
```

- 支持多条 SQL 语句，每条以 `;` 结尾
- 可引用 `${env.xxx}` 变量

### cli channel 的 bash fence 内容格式

```
./bin/cli --flag value
```

- 单行或多行 Shell 命令
- 可用管道、重定向、变量引用

### ui-dom channel 的 text fence 内容格式

```
goto ${env.base_url.local}/login
fill input[name="username"] "zhangsan"
fill input[name="password"] "test123"
click button[type="submit"]
```

动作关键字固定枚举：`goto`、`fill`、`click`、`hover`、`select`、`wait`、`assert-visible`、`assert-text`。

---

## 四、断言 DSL

断言用 bullet list 表达，每行一条原子断言，内容用行内反引号 `` `...` `` 包裹。

### 语法

```
- `<path> <op> <expected>`
```

- `<path>`：数据路径，见"路径语法"章节
- `<op>`：操作符，见下方 15 个固定枚举
- `<expected>`：期望值，支持 string/number/boolean/null

### 操作符清单（15 个固定枚举，禁扩展）

| 操作符 | 含义 | 示例 |
|---|---|---|
| `==` | 精确相等 | `http.status == 200` |
| `!=` | 不相等 | `json.code != 0` |
| `>` | 大于 | `json.total > 0` |
| `>=` | 大于等于 | `json.total >= 10` |
| `<` | 小于 | `duration < 500` |
| `<=` | 小于等于 | `json.age <= 150` |
| `exists` | 存在（非 null/undefined） | `json.data.token exists` |
| `not_exists` | 不存在 | `json.data.password not_exists` |
| `type` | 类型匹配 | `json.data.id type string` |
| `regex` | 正则匹配 | `json.email regex ^[^@]+@[^@]+$` |
| `contains` | 字符串/数组包含 | `stdout contains "OK"` |
| `not_contains` | 不包含 | `stderr not_contains "ERROR"` |
| `length==` | 集合长度相等 | `json.items length== 3` |
| `length>=` | 集合长度大于等于 | `json.items length>= 1` |
| `length<=` | 集合长度小于等于 | `json.items length<= 100` |

**AI 想表达 `starts_with` / `ends_with` / `between` 等变体时，必须用 `regex` 表达。僵化是特性，不是缺陷。**

### 期望值（expected）的类型约定

| 类型 | 格式 | 示例 |
|---|---|---|
| string | 双引号包裹 | `json.name == "zhangsan"` |
| number | 裸数字 | `http.status == 200` |
| boolean | `true` / `false` | `json.success == true` |
| null | `null` 字面量 | `json.data.deletedAt == null` |
| 类型名（type 操作符） | 裸标识符 | `json.id type string` 其中 string 为类型名 |
| 正则（regex 操作符） | 裸正则 | `json.email regex ^[^@]+@[^@]+$` |

对于 `exists` / `not_exists` 操作符，expected 字段省略。

---

## 五、路径语法（JSONPath 简化版）

路径用点号嵌套，数组用方括号下标。

### HTTP 响应路径

| 路径 | 含义 |
|---|---|
| `http.status` | HTTP 状态码 |
| `http.headers.{header-name}` | 响应头（header-name 大小写不敏感） |
| `http.duration` | 响应耗时（ms） |

### JSON body 路径（api channel 主要用）

| 路径 | 含义 |
|---|---|
| `json.{field}` | JSON body 顶层字段 |
| `json.{a}.{b}` | 嵌套字段 |
| `json.{a}[0].{b}` | 数组下标 |
| `json` | 整个 body |

**示例**：
- `json.code == 0`
- `json.data.token exists`
- `json.data.items[0].id type string`
- `json.data.items length>= 1`

### 数据库断言路径（db channel 主要用）

格式：`db[{table}][{query-key}={query-value}].{field}`

| 示例 | 含义 |
|---|---|
| `db[users][id=1].status == "active"` | 查 users 表 id=1 的行，断言 status 字段 |
| `db[orders][order_no="ON2024"].amount > 0` | 按 order_no 查 orders 表 |
| `db[logs] length>= 1` | 查 logs 表记录数 |

### CLI 输出路径（cli channel 主要用）

| 路径 | 含义 |
|---|---|
| `stdout` | 标准输出全文 |
| `stderr` | 标准错误全文 |
| `exit_code` | 退出码 |

### DOM 路径（ui-dom channel 主要用）

格式：`dom[{selector}].{attr}`

| 示例 | 含义 |
|---|---|
| `dom[.login-btn].text == "登录"` | CSS selector 取文本 |
| `dom[input[name="username"]].value exists` | 取输入框 value |
| `dom[.error-msg] exists` | 元素存在性 |

---

## 六、前置 / 清理 动作 DSL

前置和清理用 bullet list 表达，每行一个动作，内容用行内反引号包裹。

### 语法

```
- `<action.name> <args>`
```

### 动作清单（固定枚举）

| 动作 | 参数 | 含义 |
|---|---|---|
| `db.seed` | `{fixture-path}` | 加载 fixture 数据到数据库（路径相对于 test_db.seed_dir） |
| `db.reset` | `{table}` 或 `all` | 重置表或整个测试数据库 |
| `db.exec` | `{inline-sql}` | 执行内联 SQL |
| `shell.exec` | `{command}` | 执行 Shell 命令 |
| `file.write` | `{path} <<< {content}` | 写入文件 |
| `file.delete` | `{path}` | 删除文件 |
| `env.set` | `{key} {value}` | 设置环境变量 |
| `wait` | `{ms}` | 等待毫秒 |

**示例**：
```
**前置**:
- `db.seed users/zhangsan.yaml`
- `env.set API_TOKEN test-token-123`

**清理**:
- `db.reset users`
- `file.delete /tmp/test-output.log`
```

**规则**：
- 动作按顺序执行
- 任一前置动作失败 → 整条用例标记为 SKIP（不执行请求和断言）
- 任一清理动作失败 → 记录警告但不改变用例结论

---

## 七、变量引用

变量用 `${env.{path}}` 引用，路径对应 `.test-env.md` 中的字段。

### 语法

```
${env.{path}}
```

- `{path}` 用点号嵌套，与 `.test-env.md` 的 path 完全一致
- 变量在请求代码块、断言期望值、动作参数中均可使用

### 使用场景

| 场景 | 示例 |
|---|---|
| 请求 URL | `POST ${env.base_url.local}/api/auth/login` |
| 请求 body | `{"username": "${env.vars.test_user}"}` |
| 数据库连接 | `db.exec DSN=${env.test_db.dsn}` |
| 断言期望值 | `json.username == "${env.vars.test_user}"` |

### 变量解析规则

- Skill 生成 tc-exec 时**强制校验**：每个 `${env.xxx}` 引用的路径必须在 `.test-env.md` 中存在
- 路径不存在 → Skill 报错并指出具体行号
- 运行时由 §3 Step 6 自测阶段的 AI 展开变量（替换为真实值后发起请求）
- `.test-env.md` 缺失时，所有含变量的用例强制降级为 `manual` channel

---

## 八、完整示例（每个 channel 一个）

### 示例 1：channel=api

```markdown
#### TC-login-001 正常登录 - 返回 token

**channel**: api | **priority**: P0 | **exec-mode**: auto

**请求**:
​```http
POST ${env.base_url.local}/api/auth/login
Content-Type: application/json

{
  "username": "${env.vars.test_user}",
  "password": "${env.vars.test_password}"
}
​```

**前置**:
- `db.seed users/zhangsan.yaml`

**断言**:
- `http.status == 200`
- `json.code == 0`
- `json.data.token exists`
- `json.data.token type string`
- `json.data.userId type string`
- `json.data.expiresIn > 0`

**清理**:
- `db.reset users`
```

### 示例 2：channel=db

```markdown
#### TC-order-007 订单状态流转 - 已发货不可撤销

**channel**: db | **priority**: P0 | **exec-mode**: auto

**请求**:
​```sql
UPDATE orders SET status = 'cancelled' WHERE id = 1001;
​```

**前置**:
- `db.seed orders/shipped-order-1001.yaml`

**断言**:
- `db[orders][id=1001].status == "shipped"`
- `db[orders][id=1001].updated_at exists`

**清理**:
- `db.reset orders`
```

### 示例 3：channel=unit

```markdown
#### TC-pay-012 金额计算 - 满减优惠

**channel**: unit | **priority**: P1 | **exec-mode**: auto

**请求**:
​```typescript
import { calculateTotal } from '../src/payment';

describe('TC-pay-012 金额计算 - 满减优惠', () => {
  it('满 100 减 10', () => {
    const result = calculateTotal([
      { price: 60, quantity: 1 },
      { price: 50, quantity: 1 }
    ], { type: 'mansong', threshold: 100, discount: 10 });
    expect(result.subtotal).toBe(110);
    expect(result.discount).toBe(10);
    expect(result.total).toBe(100);
  });
});
​```

**断言**:
- `exit_code == 0`
- `stdout contains "1 passed"`
```

> 说明：channel=unit 的"请求"是完整单测代码，Step 6 派生骨架时展开为完整可跑文件；"断言"基于运行 test runner 后的输出。

### 示例 4：channel=cli

```markdown
#### TC-cli-001 版本号输出

**channel**: cli | **priority**: P1 | **exec-mode**: auto

**请求**:
​```bash
./bin/cli --version
​```

**断言**:
- `exit_code == 0`
- `stdout regex ^v\d+\.\d+\.\d+`
- `stderr == ""`
```

### 示例 5：channel=ui-dom

```markdown
#### TC-login-002 登录页 - 表单提交流程

**channel**: ui-dom | **priority**: P0 | **exec-mode**: auto

**请求**:
​```text
goto ${env.base_url.local}/login
fill input[name="username"] "${env.vars.test_user}"
fill input[name="password"] "${env.vars.test_password}"
click button[type="submit"]
wait 500
​```

**断言**:
- `dom[.welcome-msg] exists`
- `dom[.welcome-msg].text contains "欢迎"`
- `dom[.user-name].text == "${env.vars.test_user}"`
```

### 示例 6：channel=ui-visual

```markdown
#### TC-login-003 登录页 - 视觉还原

**channel**: ui-visual | **priority**: P1 | **exec-mode**: manual

**测试说明**：
对比 `.docs/prd/login-flow.png` 与实际页面截图，人工验证：
- 登录框居中对齐
- 品牌 logo 位于登录框上方 40px
- 主按钮使用品牌主色 #1890FF
- 输入框圆角 4px，高度 40px
- 辅助链接"忘记密码"位于登录框右下角
```

### 示例 7：channel=manual

```markdown
#### TC-pay-099 支付 - 真实银行网关联调

**channel**: manual | **priority**: P0 | **exec-mode**: manual

**测试说明**：
在沙箱环境中执行以下步骤，由测试工程师手工验证：
1. 在测试环境创建一笔 100 元订单
2. 选择建设银行支付方式
3. 跳转到银行沙箱页面，使用测试卡号 6222......1111 完成支付
4. 返回商户页面，确认订单状态为"已支付"
5. 登录银行沙箱后台，确认交易记录存在

**预期结果**：
- 订单状态 = "paid"
- 支付时间记录正确
- 银行沙箱流水号回写到订单
```

---

## 九、格式一致性自检清单

Skill 生成 tc-exec 时必须逐条检查：

1. [ ] 标题行 TC-ID 格式正确（`TC-{module_id}-{seq:03}`）
2. [ ] 元数据行的 channel / priority / exec-mode 都在固定枚举内
3. [ ] channel 与 fence 语言标签匹配
4. [ ] 所有断言都用行内反引号包裹
5. [ ] 所有断言操作符都在 15 个固定枚举内
6. [ ] 断言路径语法正确（JSONPath 简化版）
7. [ ] 所有 `${env.xxx}` 变量在 `.test-env.md` 中存在
8. [ ] 前置/清理动作都在固定动作清单内
9. [ ] 非 `ui-visual` / `manual` channel 都有请求代码块
10. [ ] 非 `ui-visual` / `manual` channel 都有至少 1 条断言

不通过项当场修复。
