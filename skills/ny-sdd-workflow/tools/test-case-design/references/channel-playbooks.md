# Channel Playbooks — 7 个通道写法指南

本文件为 `test-case-design` Skill 的 Step 4（分配 channel + 编写 tc-exec）提供操作手册。每个 channel 有明确的"何时用 / 依赖 / 模板 / 示例 / 常见错误"五段式。

**前置阅读**：`tc-exec-schema.md`（格式契约）。

---

## 通道总览

| channel | 适用场景 | mcp 能力依赖 | 可降级到 | 典型章节 |
|---|---|---|---|---|
| `api` | HTTP 接口测试 | `http-client` | `manual` | 第二章 接口测试 |
| `db` | 数据库状态/流转 | `sql-runner` | `manual` | 第三章 数据/状态 |
| `unit` | 纯函数/模块测试 | framework_hint 存在 | `doc-only` | 第一章/第二章/第三章 |
| `cli` | 命令行工具 | `shell` | `manual` | 第二章（CLI 工具） |
| `ui-dom` | 前端 DOM 交互 | `playwright` 或 `browser` | `ui-visual` 或 `manual` | 第四章 UI |
| `ui-visual` | 视觉还原 | **不可自动** | - | 第四章 UI |
| `manual` | 兜底人工 | **不可自动** | - | 任何章节 |

---

## 一、channel: api

### 何时使用

- 被测对象是 HTTP 接口（RESTful / gRPC-Web / GraphQL）
- 验收标准涉及请求参数、响应结构、状态码、错误码、权限控制
- DES 中的 "API 定义" 维度

### 必需 mcp 能力

- `http-client`：AI 需要能发起 HTTP 请求
- 如果只是想**生成请求代码让用户/CI 跑**，不需要此能力，但要降级到 channel=unit（派生为 supertest/MockMvc/httpx/httptest 代码）

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: api | **priority**: {P0/P1/P2} | **exec-mode**: auto

**请求**:
​```http
{METHOD} {URL 含 ${env.base_url.local}}
{Header: value}
Content-Type: application/json

{JSON body}
​```

**前置**:
- `db.seed {fixture-path}`

**断言**:
- `http.status == {code}`
- `json.{field} {op} {expected}`
- ...

**清理**:
- `db.reset {table}`
```

### 完整示例 1：正常请求

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
- `http.headers.Content-Type contains "application/json"`
- `json.code == 0`
- `json.data.token exists`
- `json.data.token type string`
- `json.data.userId type string`

**清理**:
- `db.reset users`
```

### 完整示例 2：异常请求

```markdown
#### TC-login-003 密码错误 - 返回 401

**channel**: api | **priority**: P0 | **exec-mode**: auto

**请求**:
​```http
POST ${env.base_url.local}/api/auth/login
Content-Type: application/json

{"username": "zhangsan", "password": "wrong_password"}
​```

**前置**:
- `db.seed users/zhangsan.yaml`

**断言**:
- `http.status == 401`
- `json.code == 10001`
- `json.msg == "用户名或密码错误"`
- `json.data.token not_exists`

**清理**:
- `db.reset users`
```

### 常见错误

| 错误 | 说明 | 修复 |
|---|---|---|
| URL 硬编码 | 写成 `http://localhost:8080/...` | 改为 `${env.base_url.local}/...` |
| 缺 Content-Type | 请求 body 是 JSON 但没声明 header | 补上 `Content-Type: application/json` |
| 断言太宽 | 只写 `http.status == 200`，未断言业务字段 | 至少追加 1 条业务字段断言 |
| 断言合并 | 一条断言里写 "status 200 且 code 0" | 必须拆成 2 条原子断言 |
| 未清理数据 | 前置 seed 但无清理 | 每个 seed 必须有对应 reset |

### 每个 API 的最小用例集（5 类）

针对 DES 中定义的每个 API，至少生成以下 5 类用例：

| 类型 | 描述 | 示例 TC-ID 后缀 |
|---|---|---|
| 正常请求 | 合法参数 + 期望结果 | `-001 正常XX` |
| 参数缺失 | 必填字段为空/缺失 | `-002 参数缺失` |
| 参数越界 | 超长字符串 / 非法数值 / 格式错误 | `-003 参数越界` |
| 权限不足 | 无 token / 角色错误 | `-004 权限不足` |
| 异常返回 | 业务异常（库存不足/账号锁定等） | `-005 业务异常` |

---

## 二、channel: db

### 何时使用

- 被测对象是数据库状态（表结构、数据流转、事务、并发）
- 验收标准涉及"数据应变更为 XX"、"状态应流转到 XX"、"并发写入应加锁"
- DES 中的 "数据模型" / "状态管理" 维度

### 必需 mcp 能力

- `sql-runner`：AI 需要能查询/写入数据库

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: db | **priority**: {P0/P1/P2} | **exec-mode**: auto

**请求**:
​```sql
{SQL 语句，可多条}
​```

**前置**:
- `db.seed {fixture-path}`

**断言**:
- `db[{table}][{key}={value}].{field} {op} {expected}`
- ...

**清理**:
- `db.reset {table}`
```

### 完整示例：状态流转

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
- `db[orders][id=1001].cancelled_at not_exists`

**清理**:
- `db.reset orders`
```

### 常见错误

| 错误 | 说明 | 修复 |
|---|---|---|
| 查询 fixture 路径错误 | 路径不存在 | 确认 `test_db.seed_dir` + 相对路径对齐 |
| 断言表名拼写错 | `db[user]` vs `db[users]` | 对照 DES 数据模型 |
| 未清理 | fixture 留到下一条用例 | 必须 `db.reset` |

---

## 三、channel: unit

### 何时使用

- 被测对象是纯函数/类/模块，不依赖外部服务
- 验收标准可以在进程内用代码直接验证
- 适合业务逻辑（金额计算、规则引擎、数据转换）、工具函数、DSL 解析器

### 必需条件

- `framework_hint` 已声明（或 `.test-env.md` 的 `test_commands` 存在）
- Skill Step 6 派生骨架代码到 `{output_dir}/skeleton/`

### 模板骨架

channel=unit 的 tc-exec 块里，**请求部分直接写完整单测代码**，使用 fence 语言标签 `typescript` / `javascript` / `java` / `python` / `go`。

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: unit | **priority**: {P0/P1/P2} | **exec-mode**: auto

**请求**:
​```{语言}
{完整单测代码}
​```

**断言**:
- `exit_code == 0`
- `stdout contains "{测试框架的通过标识}"`
```

### 完整示例 1：Jest + 业务逻辑

```markdown
#### TC-pay-012 金额计算 - 满减优惠

**channel**: unit | **priority**: P1 | **exec-mode**: auto

**请求**:
​```typescript
import { calculateTotal } from '../src/payment';

describe('TC-pay-012 金额计算 - 满减优惠', () => {
  it('满 100 减 10', () => {
    const result = calculateTotal(
      [{ price: 60 }, { price: 50 }],
      { type: 'mansong', threshold: 100, discount: 10 }
    );
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

### 完整示例 2：pytest + 工具函数

```markdown
#### TC-util-005 日期格式化 - ISO 格式

**channel**: unit | **priority**: P2 | **exec-mode**: auto

**请求**:
​```python
from src.utils import format_date
from datetime import datetime

def test_format_date_iso():
    dt = datetime(2026, 4, 14, 12, 30, 45)
    assert format_date(dt, "iso") == "2026-04-14T12:30:45"
​```

**断言**:
- `exit_code == 0`
- `stdout contains "1 passed"`
```

### 派生规则（Step 6 执行）

- 从 tc-exec 的"请求"代码块中提取完整代码
- 写入 `{output_dir}/skeleton/{TC-ID}.{framework}.{ext}`
- 文件头追加 `// @TC-{TC-ID}` 追溯注释
- 补充 import / 框架 boilerplate（本 Skill 不处理；由 `unit-test-generator` Skill 的 framework-adapters.md 负责）

### 常见错误

| 错误 | 说明 | 修复 |
|---|---|---|
| 依赖外部服务 | 代码里 fetch 外部 API | 改成 api channel 或 mock 外部依赖 |
| 测试过大 | 一个 it 里测 5 个断言 | 拆成多条 TC |
| 未导入被测模块 | 只写 describe/it，没 import | 补 import |

---

## 四、channel: cli

### 何时使用

- 被测对象是命令行工具（CLI）、脚本、构建工具
- 验收标准涉及 stdout / stderr / exit code / 副作用（文件/环境变量）

### 必需 mcp 能力

- `shell`：AI 需要能执行 Shell 命令

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: cli | **priority**: {P0/P1/P2} | **exec-mode**: auto

**请求**:
​```bash
{Shell 命令}
​```

**前置**:
- `file.write {path} <<< {content}` (如需准备输入文件)

**断言**:
- `exit_code {op} {value}`
- `stdout {op} {value}`
- `stderr {op} {value}`

**清理**:
- `file.delete {path}`
```

### 完整示例 1：版本号输出

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

### 完整示例 2：错误参数

```markdown
#### TC-cli-003 未知子命令报错

**channel**: cli | **priority**: P2 | **exec-mode**: auto

**请求**:
​```bash
./bin/cli unknown-subcommand
​```

**断言**:
- `exit_code != 0`
- `stderr contains "unknown command"`
- `stderr contains "unknown-subcommand"`
```

### 常见错误

| 错误 | 说明 | 修复 |
|---|---|---|
| 断言 stdout 精确匹配 | 输出含时间戳等动态内容 | 用 `regex` 匹配核心部分 |
| 忘记断言 exit_code | 只看 stdout 不看退出码 | 必须至少断言 `exit_code` |
| 环境依赖未声明 | 命令依赖特定环境变量 | 前置 `env.set` |

---

## 五、channel: ui-dom

### 何时使用

- 被测对象是前端交互（点击、输入、导航、DOM 断言）
- 验收标准涉及"点击后跳转"、"输入后应显示 XX"、"加载态/错误态"
- DES 中的 "UI 还原" 维度（交互部分）

### 必需 mcp 能力

- `playwright`（优先）或 `browser`（兜底）
- 无此能力时强制降级为 `ui-visual` 或 `manual`

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: ui-dom | **priority**: {P0/P1/P2} | **exec-mode**: auto

**请求**:
​```text
goto {URL}
{动作 1}
{动作 2}
...
​```

**断言**:
- `dom[{selector}].{attr} {op} {expected}`
- ...
```

### 支持的动作关键字

| 动作 | 参数 | 含义 |
|---|---|---|
| `goto` | `{URL}` | 导航到 URL |
| `fill` | `{selector} {value}` | 填充输入框 |
| `click` | `{selector}` | 点击元素 |
| `hover` | `{selector}` | 鼠标悬停 |
| `select` | `{selector} {value}` | 选择下拉项 |
| `wait` | `{ms}` 或 `{selector}` | 等待毫秒或等待元素出现 |
| `assert-visible` | `{selector}` | 元素应可见 |
| `assert-text` | `{selector} {text}` | 元素文本应匹配 |

### 完整示例：登录页表单提交

```markdown
#### TC-login-002 登录页 - 正常表单提交流程

**channel**: ui-dom | **priority**: P0 | **exec-mode**: auto

**请求**:
​```text
goto ${env.base_url.local}/login
fill input[name="username"] "${env.vars.test_user}"
fill input[name="password"] "${env.vars.test_password}"
click button[type="submit"]
wait .welcome-msg
​```

**断言**:
- `dom[.welcome-msg] exists`
- `dom[.welcome-msg].text contains "欢迎"`
- `dom[.user-name].text == "${env.vars.test_user}"`
- `dom[.login-form] not_exists`
```

### 常见错误

| 错误 | 说明 | 修复 |
|---|---|---|
| selector 过于脆弱 | 用 `div > div:nth-child(3)` | 改为语义化选择器 `[name="xxx"]` 或 `.xxx-class` |
| 未等待加载完成 | click 后立即断言 | 追加 `wait {selector}` 或 `wait 500` |
| 过度依赖时序 | 写死 `wait 3000` | 改为等待具体元素出现 |

---

## 六、channel: ui-visual

### 何时使用

- 验收标准涉及"布局还原度"、"品牌色"、"字号"、"间距"、"圆角"等视觉细节
- 无法通过 DOM 断言表达的视觉问题
- 前端任务的第四章通常有 1-3 条此类用例

### 不可自动执行

`exec-mode` 必须是 `manual`。AI 生成这类用例时，只写"测试说明"段落，不生成 fence 代码块、不生成断言。

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: ui-visual | **priority**: {P0/P1/P2} | **exec-mode**: manual

**测试说明**：
对比 `.docs/prd/{prd-file}` 与实际页面截图，人工验证：
- {验证点 1}
- {验证点 2}
- ...
```

### 完整示例

```markdown
#### TC-login-009 登录页 - 品牌视觉还原

**channel**: ui-visual | **priority**: P1 | **exec-mode**: manual

**测试说明**：
对比 `.docs/prd/login-flow.png` 与实际页面截图，人工验证：
- 登录框居中对齐，宽度 400px
- 品牌 logo 位于登录框上方 40px，高度 48px
- 主按钮使用品牌主色 #1890FF
- 输入框圆角 4px，高度 40px，内边距 12px
- 辅助链接"忘记密码"位于登录框右下角，字号 12px
- 登录按钮在点击时有涟漪动效
```

---

## 七、channel: manual

### 何时使用

- 任何**不能自动执行**的场景：
  - 外部系统联调（第三方支付、OCR、短信网关）
  - 物理设备测试（扫码枪、蓝牙、NFC）
  - 跨系统流程（业务数据需要多个系统协同）
  - 无可用 mcp 能力的兜底
- 用户测试环境配置不全时的降级路径

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: manual | **priority**: {P0/P1/P2} | **exec-mode**: manual

**测试说明**：
{步骤 1}
{步骤 2}
...

**预期结果**：
- {结果 1}
- {结果 2}
```

### 完整示例

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

## Channel 选择决策树

用例性质与 channel 的映射规则（Skill Step 4 执行）：

```
用例性质 = ?
├─ 验证 HTTP 接口行为？
│  └─ mcp_capabilities 含 http-client？
│     ├─ 是 → channel=api
│     └─ 否 → channel=unit（派生 supertest/MockMvc 等代码）
├─ 验证数据库状态/流转？
│  └─ mcp_capabilities 含 sql-runner？
│     ├─ 是 → channel=db
│     └─ 否 → channel=unit（派生 mock DB 代码）
├─ 验证纯函数/模块？
│  └─ framework_hint 已声明？
│     ├─ 是 → channel=unit
│     └─ 否 → channel=manual (doc-only)
├─ 验证 CLI 工具？
│  └─ mcp_capabilities 含 shell？
│     ├─ 是 → channel=cli
│     └─ 否 → channel=manual
├─ 验证前端 DOM 交互？
│  └─ mcp_capabilities 含 playwright/browser？
│     ├─ 是 → channel=ui-dom
│     └─ 否 → channel=ui-visual 或 manual
├─ 验证前端视觉还原？
│  └─ channel=ui-visual（永远 manual）
└─ 其他（跨系统联调/物理设备/外部依赖）？
   └─ channel=manual
```

**降级链**：`api → unit → manual`，`db → unit → manual`，`ui-dom → ui-visual → manual`，`cli → manual`

---

## Channel 分布的建议比例

一个健康的 TC 文档，各 channel 分布参考：

| channel | 合理占比 |
|---|---|
| `api` + `db` + `unit` + `cli`（可执行） | ≥70% |
| `ui-dom`（可执行） | ≤15%（仅前端任务） |
| `ui-visual` + `manual` | ≤15% |

**可执行率**（前四类 + ui-dom）目标 ≥70%，低于 50% 说明 `.test-env.md` 配置不足，Skill 应在回执中警告。
