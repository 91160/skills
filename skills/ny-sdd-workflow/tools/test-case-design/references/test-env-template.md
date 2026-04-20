# .test-env.md 模板与字段说明

本文件定义 `.test-env.md` 运行时配置文件的完整格式。`.test-env.md` 是 `test-case-design` Skill（以及未来其他测试类 Skill）读取运行时信息的**唯一权威来源**。

**位置**：
- SDD 模式：项目根目录 `.test-env.md`（或通过 `runtime_source` 参数显式指定）
- 独立模式：项目根目录 `.test-env.md`，或通过 `runtime_source` 参数显式指定

**格式原则**：纯 Markdown，零 YAML，与 tc-exec 块同一套解析规则。

---

## 一、完整模板（可直接复制使用）

````markdown
# 测试运行环境声明

**version**: 1

## 服务端点
- `base_url.local = http://localhost:8080`
- `base_url.staging = https://staging.example.com`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://root:YOUR_PASSWORD@localhost:3306/app_test`
- `test_db.reset_command = ./scripts/reset-test-db.sh`
- `test_db.seed_dir = ./test/fixtures`

## 测试运行命令
- `test_commands.frontend = npm test`
- `test_commands.backend = mvn test`
- `test_commands.e2e = npx playwright test`

## MCP 能力声明
- `http-client`
- `sql-runner`
- `shell`
- `playwright`

## 单测目录约定
- `test_dirs.frontend_unit = src/__tests__`
- `test_dirs.backend_unit = src/test/java`
- `test_dirs.e2e = tests/e2e`

## 全局变量
- `vars.test_user = zhangsan`
- `vars.test_password = "YOUR_PASSWORD"`
- `vars.test_admin = admin_user`
- `vars.test_admin_password = "YOUR_ADMIN_PASSWORD"`
````

---

## 二、格式约定

### 基本规则

1. **二级标题为分组**：`## 服务端点`、`## 测试数据库` 等
2. **普通字段**：`` - `path = value` ``，反引号包裹，`=` 两侧单空格
3. **列表字段**（无值的枚举项）：`` - `item` ``，只有反引号包裹的标识符
4. **字符串值含特殊字符**（空格、`@`、引号等）：用双引号包裹，如 `test_password = "YOUR_PASSWORD"`
5. **注释**：不支持。想写注释就用段落文本，不要混进 bullet list

### Path 命名规则

- 点号嵌套：`test_db.dsn`、`vars.test_user`
- 路径与 tc-exec 中的 `${env.xxx}` 变量引用**完全同构**
- 不支持动态扩展的数组索引（如 `items[0].id`），若需要可用多个独立 key

### 允许的 value 类型

| 类型 | 写法 | 示例 |
|---|---|---|
| 字符串（无特殊字符） | 裸字符串 | `mysql://root:YOUR_PASSWORD@localhost:3306/app_test` |
| 字符串（含特殊字符） | 双引号包裹 | `"YOUR_PASSWORD"` |
| 数字 | 裸数字 | `version = 1` |
| 布尔 | `true` / `false` | `features.enabled = true` |
| 路径 | 裸字符串 | `./scripts/reset-test-db.sh` |

---

## 三、字段说明

### 服务端点 `base_url.{env}`

**用途**：被 tc-exec 的 `channel=api` 用例引用为请求 URL 的基址。

**常用环境**：

| path | 含义 |
|---|---|
| `base_url.local` | 本地开发环境，默认启动的服务地址 |
| `base_url.staging` | 预发布环境（可选） |
| `base_url.test` | 专用测试环境（可选） |

**引用方式**：tc-exec 中 `POST ${env.base_url.local}/api/auth/login`

**缺失行为**：
- 独立模式 + 无其他降级 → 所有 `channel=api` 降级为 `manual`
- 独立模式 + 可通过 `request(app)` 注入 → 派生单测时降级为 mock 模式（由 `unit-test-generator` Skill 的 framework-adapters.md 处理，本 Skill 不派生代码）

### 测试数据库 `test_db.*`

**用途**：被 tc-exec 的 `channel=db` 用例和 `db.seed` / `db.reset` 动作引用。

| path | 必需 | 说明 |
|---|---|---|
| `test_db.type` | ✅（若有 test_db） | 数据库类型：`mysql` / `postgres` / `sqlite` / `mongodb` |
| `test_db.dsn` | ✅ | 数据库连接字符串 |
| `test_db.reset_command` | ⬜ | `db.reset all` 动作的实现命令（如 shell 脚本） |
| `test_db.seed_dir` | ⬜ | `db.seed {path}` 动作的 fixture 根目录，默认 `./test/fixtures` |

**缺失行为**：
- 整个 `test_db` 区块缺失 → 所有 `channel=db` 降级为 `manual`（如后续用 `unit-test-generator` Skill 派生单测代码，会自动用内存数据库降级，详见 unit-test-generator 的 framework-adapters.md 降级策略）
- 仅 `reset_command` 缺失 → `db.reset all` 动作不可用，但单表 `db.reset {table}` 仍可用（AI 用标准 SQL 实现）

### 测试运行命令 `test_commands.*`

**用途**：Skill Step 6 派生完单测骨架后，在回执中告诉用户如何运行；SDD 模式下 §3 Step 6 自测阶段执行这些命令。

| path | 含义 |
|---|---|
| `test_commands.frontend` | 前端测试命令（如 `npm test` / `vitest run`） |
| `test_commands.backend` | 后端测试命令（如 `mvn test` / `pytest` / `go test ./...`） |
| `test_commands.e2e` | E2E 测试命令（可选，如 `npx playwright test`） |

**缺失行为**：
- `test_commands` 整块缺失 + `framework_hint` 也缺失 → Skill Step 6 跳过单测派生，`test-case-status: doc-only`
- 有 `framework_hint` 但无 `test_commands` → 仍可派生骨架，但回执中会提示"无运行命令"

### MCP 能力声明（固定 6 枚举）

**用途**：告诉 Skill "项目环境声称支持这些能力"，Skill 据此决定每条用例的 channel 是否可执行。

| 值 | 启用的 channel | 实际需要的 AI 工具 |
|---|---|---|
| `http-client` | api | MCP HTTP 客户端 或 Fetch/Axios（通过 Bash）|
| `sql-runner` | db | MCP 数据库客户端 或 CLI DB 工具（通过 Bash）|
| `shell` | cli | Bash 工具 |
| `playwright` | ui-dom（首选） | Playwright MCP |
| `browser` | ui-dom（兜底） | 通用 Browser MCP |
| `file-system` | unit / cli（文件断言） | Read / Write / Glob 工具 |

**规则**：
- 必须从固定 6 枚举中选择，拼写错误或自创值会被 Skill 报错
- 清单里没有的值对应的 channel → 强制降级为 `manual`
- 清单可以为空（`## MCP 能力声明` 下方没有任何 bullet），此时所有 channel 全部降级为 `manual`

**示例**：
```markdown
## MCP 能力声明
- `http-client`
- `sql-runner`
- `shell`
```

上面这个声明意味着：
- `channel=api` 可执行 ✅
- `channel=db` 可执行 ✅
- `channel=cli` 可执行 ✅
- `channel=unit` 取决于 `framework_hint`
- `channel=ui-dom` 强制降级为 `ui-visual` 或 `manual`
- `channel=ui-visual` / `manual` 不变（本来就是手工）

### 单测目录约定 `test_dirs.*`

**用途**：Skill Step 6 派生单测骨架后，提示用户迁移到的目标目录。

| path | 含义 |
|---|---|
| `test_dirs.frontend_unit` | 前端单测目录（如 `src/__tests__`、`tests/unit`） |
| `test_dirs.backend_unit` | 后端单测目录（如 `src/test/java`、`tests/`） |
| `test_dirs.e2e` | E2E 测试目录（如 `tests/e2e`、`cypress/e2e`） |

**缺失行为**：
- 所有骨架文件留在 `{output_dir}/skeleton/` 不迁移
- SDD 模式下，post-processing 找不到目标目录时，在回执中告知用户"请手动迁移骨架文件"

### 全局变量 `vars.*`

**用途**：自定义扩展点。用户可以塞任意 key-value，Skill 生成用例时用 `${env.vars.xxx}` 引用。

**适用场景**：
- 测试账号：`vars.test_user`、`vars.test_password`
- 测试数据：`vars.test_product_id`、`vars.test_order_no`
- 密钥和 token：`vars.api_key`、`vars.test_jwt`
- 特殊常量：`vars.max_file_size`

**规则**：
- 值含特殊字符必须双引号包裹
- 建议不要放生产环境的真实密钥（`.test-env.md` 可以进 `.gitignore`）

**示例**：
```markdown
## 全局变量
- `vars.test_user = zhangsan`
- `vars.test_password = "YOUR_PASSWORD"`
- `vars.api_key = "test-key-abc-123"`
- `vars.test_product_id = PROD-001`
```

---

## 四、字段可选性矩阵

| 区块 | 必需性 | 缺失行为 |
|---|---|---|
| `version` | ✅ 必填 | 缺失时 Skill 报错"未指定版本" |
| `## 服务端点` | ⬜ 可选 | 缺失时 `channel=api` 降级 |
| `## 测试数据库` | ⬜ 可选 | 缺失时 `channel=db` 降级到内存 DB 或 manual |
| `## 测试运行命令` | ⬜ 可选 | 缺失时 Step 6 可能降级 |
| `## MCP 能力声明` | ⬜ 可选 | 缺失时所有 channel 降级为 manual |
| `## 单测目录约定` | ⬜ 可选 | 缺失时骨架留在 `{output_dir}/skeleton/` |
| `## 全局变量` | ⬜ 可选 | 缺失时 tc-exec 块中的 `${env.vars.xxx}` 会被 Skill 报错 |

**完全可选**：理论上一个只有 `**version**: 1` 的 `.test-env.md` 也是合法的——但此时所有 channel 都会降级为 `manual`，可执行率为 0%。

---

## 五、独立模式下的放置位置

### 默认位置

**项目根目录**：`{pwd}/.test-env.md`

Skill Step 2 按以下优先级查找：
1. 调用时显式传入的 `runtime_source` 参数（绝对或相对路径）
2. 项目根的 `.test-env.md`
3. 都找不到 → Y 警告 + 全 manual 降级

### 覆盖默认位置

独立模式下用户可以指定其他路径：

```
"用 /path/to/custom-env.md 作为 runtime，生成 TC"
```

Skill 会把 `runtime_source` 设为 `/path/to/custom-env.md` 并从那里读取。

### SDD 模式下的位置

SDD 模式下 Skill 先查 `.project/specs/rules/.test-env.md`，再查项目根 `.test-env.md`。

---

## 六、迁移指南（给用户）

如果你的项目之前用 `.env` / `.envrc` / YAML 配置管理测试环境，以下是迁移建议：

### 从 `.env` 迁移

```
# .env
API_BASE_URL=http://localhost:8080
TEST_DB_DSN=mysql://root:YOUR_PASSWORD@localhost:3306/app_test
TEST_USER=zhangsan
```

等价的 `.test-env.md`：

```markdown
## 服务端点
- `base_url.local = http://localhost:8080`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://root:YOUR_PASSWORD@localhost:3306/app_test`

## 全局变量
- `vars.test_user = zhangsan`
```

### 从 YAML 迁移

```yaml
base_url:
  local: http://localhost:8080
test_db:
  type: mysql
  dsn: mysql://root:YOUR_PASSWORD@localhost:3306/app_test
```

等价的 `.test-env.md`：

```markdown
## 服务端点
- `base_url.local = http://localhost:8080`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://root:YOUR_PASSWORD@localhost:3306/app_test`
```

**映射规则**：YAML 的嵌套 key 展开为点号 path，叶子节点变成 bullet。

---

## 七、安全建议

### 不应该放进 `.test-env.md` 的内容

- 生产环境的数据库凭据
- 真实用户的密码
- 线上 API 密钥
- 个人身份信息（PII）

### 应该放进 `.test-env.md` 的内容

- 本地 / 预发 / 测试环境的地址
- 测试数据库的 DSN（建议只读或专用测试账号）
- 测试账号和密码（专门为测试创建的账号）
- 测试 API 密钥（沙箱模式的密钥）

### 版本控制建议

- **公开仓库**：`.test-env.md` 加入 `.gitignore`，提供 `.test-env.example.md` 作为模板
- **私有仓库**：可以直接提交 `.test-env.md`，但仍建议测试凭据与生产完全隔离

---

## 八、解析器实现要点（给 Skill）

Skill Step 2 解析 `.test-env.md` 的伪代码：

```
1. 读文件
2. 按二级标题分组（## 开头）
3. 对每个二级标题下的 bullet 行（- 开头）:
   a. 提取行内反引号内的内容
   b. 如果包含 " = "，解析为 key=value 对
      - key: 点号嵌套的路径
      - value: 去掉两端空格；双引号包裹的去掉引号
   c. 如果不包含 "="，作为列表项（用于 MCP 能力声明）
4. 组装成嵌套对象
5. 校验必填字段 version 存在
6. 校验 MCP 能力清单在 6 个固定枚举内
7. 返回解析结果
```

**Skill 不是真的执行代码**，但应该按这个逻辑理解 `.test-env.md`，避免"看起来像配置就随便解析"导致偏差。
