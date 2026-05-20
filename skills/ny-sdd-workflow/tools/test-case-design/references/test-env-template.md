# .test/.test-env.md 模板与字段说明

本文件定义 `.test/.test-env.md` 运行时配置文件的完整格式。`.test/.test-env.md` 是 `test-case-design` Skill（以及未来其他测试类 Skill）读取运行时信息的**唯一权威来源**。

**位置**：
- SDD 模式：`.test/.test-env.md`（或通过 `runtime_source` 参数显式指定）
- 独立模式：`.test/.test-env.md`，或通过 `runtime_source` 参数显式指定

**格式原则**：纯 Markdown，零 YAML，与 `e2e-exec` 变量引用和单测运行配置使用同一套 `path = value` 解析规则。

---

## 一、完整模板（示例，可按项目调整）

> E2E Runner 可在缺少 `.test/.test-env.md` 时创建本文件，并自动补全安全默认字段。`e2e.base_url`、`e2e.test_command` 和账号类 `vars.*` 不会被静默猜测，必须由用户确认或填写。

````markdown
# 测试运行环境声明

**version**: 1

## 服务端点
- `base_url.local = http://localhost:8080`
- `base_url.staging = https://staging.example.com`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://test:test@localhost:3306/app_test`
- `test_db.reset_command = ./scripts/reset-test-db.sh`
- `test_db.seed_dir = ./test/fixtures`

## 测试运行命令
- `test_commands.frontend = npm test`
- `test_commands.backend = mvn test`
- `test_commands.e2e = TODO 可与 e2e.test_command 保持一致`

## E2E
- `e2e.framework = playwright`
- `e2e.base_url = TODO 用户确认被测 Web/H5 入口地址`
- `e2e.start_command = TODO 用户确认本地启动命令；已有服务时可留空`
- `e2e.test_command = TODO 用户确认 E2E 执行命令（建议：npx playwright test -c .test/e2e/playwright.config.ts；pnpm/yarn/bun 项目按包管理器替换执行前缀）`
- `e2e.install_command = TODO E2E Runner 按包管理器自动推断`
- `e2e.spec_dir = .test/e2e/specs`
- `e2e.artifacts_dir = .test/e2e/artifacts`
- `e2e.report_md = .outdocs/e2e-report.md`
- `e2e.report_html = .outdocs/e2e-report.html`
- `e2e.config = .test/e2e/playwright.config.ts`
- `e2e.results_json = .test/e2e/results.json`
- `e2e.data_dir = .test/e2e/data`
- `e2e.data_strategy = auto`
- `e2e.browser = chromium`
- `e2e.headed = false`
- `e2e.retries = 1`
- `e2e.timeout_ms = 30000`

## Selectors（可选映射）
- `selectors.login.username = input[name="username"]`
- `selectors.login.password = input[name="password"]`
- `selectors.login.submit = button[type="submit"]`

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
- `vars.test_user = TODO 用户填写测试账号`
- `vars.test_password = TODO 用户填写测试密码`
- `vars.test_admin = TODO 用户填写测试管理员账号`
- `vars.test_admin_password = TODO 用户填写测试管理员密码`
````

---

## 二、格式约定

### 基本规则

1. **二级标题为分组**：`## 服务端点`、`## 测试数据库` 等
2. **普通字段**：`` - `path = value` ``，反引号包裹，`=` 两侧单空格
3. **列表字段**（无值的枚举项）：`` - `item` ``，只有反引号包裹的标识符
4. **字符串值含特殊字符**（空格、`@`、引号等）：用双引号包裹，如 `test_password = "test@123"`
5. **注释**：不支持。想写注释就用段落文本，不要混进 bullet list

### Path 命名规则

- 点号嵌套：`test_db.dsn`、`vars.test_user`
- 路径与 `e2e-exec` 中的 `${e2e.xxx}` / `${vars.xxx}` / `${selectors.xxx}` 变量引用同构
- 不支持动态扩展的数组索引（如 `items[0].id`），若需要可用多个独立 key

### 允许的 value 类型

| 类型 | 写法 | 示例 |
|---|---|---|
| 字符串（无特殊字符） | 裸字符串 | `mysql://test:test@localhost:3306/app_test` |
| 字符串（含特殊字符） | 双引号包裹 | `"test@123"` |
| 数字 | 裸数字 | `version = 1` |
| 布尔 | `true` / `false` | `features.enabled = true` |
| 路径 | 裸字符串 | `./scripts/reset-test-db.sh` |

---

## 三、字段说明

### 服务端点 `base_url.{env}`

**用途**：被单测/API 测试和 E2E 测试读取，作为请求 URL 的基址。E2E 优先使用 `e2e.base_url`。

**常用环境**：

| path | 含义 |
|---|---|
| `base_url.local` | 本地开发环境，默认启动的服务地址 |
| `base_url.staging` | 预发布环境（可选） |
| `base_url.test` | 专用测试环境（可选） |

**引用方式**：E2E 使用 `${e2e.base_url}`；单测/API 辅助场景可读取 `base_url.local`。

**缺失行为**：
- 独立模式 + 无其他降级 → 所有 `channel=api` 降级为 `manual`
- 独立模式 + 可通过 `request(app)` 注入 → 派生单测时降级为 mock 模式（由 `unit-test-generator` Skill 的 framework-adapters.md 处理，本 Skill 不派生代码）

### 测试数据库 `test_db.*`

**用途**：被 `unit-test-generator` 或 E2E setup/teardown 的数据准备动作引用。

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
| `test_commands.e2e` | E2E 测试命令（可选；§4 执行以 `e2e.test_command` 为准，本字段可保持一致） |

**缺失行为**：
- `test_commands` 整块缺失 + `framework_hint` 也缺失 → Skill Step 6 跳过单测派生，`test-case-status: doc-only`
- 有 `framework_hint` 但无 `test_commands` → 仍可派生骨架，但回执中会提示"无运行命令"

### E2E `e2e.*`

**用途**：被 §4 `e2e-test-runner` 读取，用于生成和执行 Playwright E2E 测试。

| path | 必需 | 说明 |
|---|---|---|
| `e2e.framework` | ✅ | 固定 `playwright` |
| `e2e.base_url` | ✅ | 被测 Web/H5 入口地址 |
| `e2e.start_command` | ⬜ | 本地启动命令；已有服务时可留空 |
| `e2e.test_command` | ✅ | E2E 执行命令 |
| `e2e.install_command` | ⬜ | Playwright 依赖安装命令 |
| `e2e.spec_dir` | ✅ | 生成的 Playwright spec 目录 |
| `e2e.artifacts_dir` | ✅ | screenshot / trace / video 等证据目录 |
| `e2e.report_md` | ✅ | Markdown 报告路径 |
| `e2e.report_html` | ✅ | HTML 报告路径 |
| `e2e.config` | ⬜ | Playwright 配置输出路径，默认 `.test/e2e/playwright.config.ts` |
| `e2e.results_json` | ⬜ | Playwright JSON 结果路径，默认 `.test/e2e/results.json` |
| `e2e.data_dir` | ⬜ | E2E 测试数据目录，默认 `.test/e2e/data` |
| `e2e.data_strategy` | ⬜ | `auto` / `env` / `fixture` / `api_seed` / `ai_generated`，默认 `auto` |
| `e2e.browser` | ⬜ | 默认 `chromium` |
| `e2e.headed` | ⬜ | 默认 `false` |
| `e2e.retries` | ⬜ | 默认 `1` |
| `e2e.timeout_ms` | ⬜ | 默认 `30000` |

**缺失行为**：
- `e2e.framework` 非 `playwright` → E2E SKIP（本工作流 v1 不接 Cypress）
- `.test/.test-env.md` 缺失 → E2E Runner 自动创建并补全可安全确定的默认字段
- `e2e.base_url` 或 `e2e.test_command` 缺失 / TODO / 未确认示例值 → 不猜测，输出 E2E 环境配置确认；用户不提供 / 不确认才 E2E SKIP
- `e2e.start_command` 缺失且 `base_url` 不可达 → 从 `package.json` scripts 自动推断可信候选命令；唯一可信候选直接启动，多个候选或命令有风险时才询问用户
- 账号类 `vars.*` 缺失 → 旧项目要求用户提供；新项目可询问是否允许 AI 生成一次性测试数据
- Playwright 依赖缺失 → 优先由 E2E Runner 根据 lockfile / package.json 自动推断并执行 `e2e.install_command`；无法唯一判断或命令有风险时才询问用户；安装失败 → E2E SKIP

### E2E 数据策略

| strategy | 说明 |
|---|---|
| `auto` | 按项目/任务场景自动选择 |
| `env` | 只使用 `.test/.test-env.md` 的 `vars.*`，适合旧项目 |
| `fixture` | 使用固定 fixture 文件 |
| `api_seed` | 通过测试环境 API 创建数据 |
| `ai_generated` | AI 生成一次性测试数据，仅默认用于新项目 |

`auto` 解析规则：
- 新项目 feature → `ai_generated`
- 旧项目 feature / 新增需求 → `env`
- bug 修复 → 不执行 E2E，不造数据
- refactor / 技术优化 → 先判断是否有必要做 E2E；需要时用 `env`

旧项目若显式配置 `ai_generated`，执行前必须二次确认用户；用户不确认则按 `env` 或 `SKIP` 处理。AI 生成数据必须写入 `e2e.data_dir/generated-data.json`，不得写入 `e2e.artifacts_dir` 根目录。

### Selectors `selectors.*`

**用途**：为 `e2e-exec` 中 `${selectors.xxx}` 变量提供可选映射。

**规则**：
- 本区块可选；缺失不会影响 TC-F 生成
- e2e-test-runner 会优先使用显式 selector，其次尝试 `role` / `label` / `placeholder` / `text` / `css` / `xpath`
- 如果所有定位方式都失败，对应用例标记为 `BLOCKED`
- 本配置只属于测试侧，不要求业务代码改造

### MCP 能力声明（固定 6 枚举）

**用途**：声明项目测试环境可用能力，供单测 / API / DB 等测试派生参考。TC-F 的 `e2e` / `visual` / `manual` channel 不按当前能力声明降级，运行时可执行性由 §4 `e2e-test-runner` 判断并报告。

| 值 | 启用的 channel | 实际需要的 AI 工具 |
|---|---|---|
| `http-client` | api | MCP HTTP 客户端 或 Fetch/Axios（通过 Bash）|
| `sql-runner` | db | MCP 数据库客户端 或 CLI DB 工具（通过 Bash）|
| `shell` | cli | Bash 工具 |
| `playwright` | e2e（可由 §4 执行） | Playwright / Browser 能力 |
| `browser` | e2e（兜底能力声明） | 通用 Browser MCP |
| `file-system` | unit / cli（文件断言） | Read / Write / Glob 工具 |

**规则**：
- 必须从固定 6 枚举中选择，拼写错误或自创值会被 Skill 报错
- 清单里没有的值不影响 TC-F 的 channel 设计
- 清单为空时，TC-F 仍按需求表达 `e2e` / `visual` / `manual`；运行阶段无法执行的用例由报告标记 `BLOCKED` / `PARTIAL` / `SKIP`

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
- `channel=e2e` 由 §4 e2e-test-runner 判断是否可执行
- `channel=visual` / `manual` 不变（本来就是人工或报告入口）

### 单测目录约定 `test_dirs.*`

**用途**：Skill Step 6 派生单测骨架后，提示用户迁移到的目标目录。

| path | 含义 |
|---|---|
| `test_dirs.frontend_unit` | 前端单测目录（如 `src/__tests__`、`tests/unit`） |
| `test_dirs.backend_unit` | 后端单测目录（如 `src/test/java`、`tests/`） |
| `test_dirs.e2e` | E2E 测试目录（如 `.test/e2e/specs`） |

**缺失行为**：
- 所有骨架文件留在 `{output_dir}/skeleton/` 不迁移
- SDD 模式下，post-processing 找不到目标目录时，在回执中告知用户"请手动迁移骨架文件"

### 全局变量 `vars.*`

**用途**：自定义扩展点。用户可以塞任意 key-value，Skill 生成用例时引用。**两套引用约定（按消费方区分，均解析到本文件同一 `vars.*` 字段）**：
- **e2e-exec**（`test-case-design` → `e2e-test-runner`）：用 `${vars.xxx}`（无 `env.` 前缀，详见 `e2e-exec-schema.md` §七 / `playwright-adapter.md` §四）
- **tc-exec**（`unit-test-generator` 的 unit/api/db 单测契约）：用 `${env.vars.xxx}`（详见 `unit-test-generator/references/tc-exec-schema.md`）

**适用场景**：
- 测试账号：`vars.test_user`、`vars.test_password`
- 测试数据：`vars.test_product_id`、`vars.test_order_no`
- 密钥和 token：`vars.api_key`、`vars.test_jwt`
- 特殊常量：`vars.max_file_size`

**规则**：
- 值含特殊字符必须双引号包裹
- 建议不要放生产环境的真实密钥（`.test/.test-env.md` 可以进 `.gitignore`）

**示例**：
```markdown
## 全局变量
- `vars.test_user = zhangsan`
- `vars.test_password = "test@123"`
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
| `## 全局变量` | ⬜ 可选 | 缺失时 `e2e-exec` 中的 `${vars.xxx}` 会在 E2E 阶段标记 BLOCKED |

**完全可选**：理论上一个只有 `**version**: 1` 的 `.test/.test-env.md` 也是合法的——但此时变量、端点和执行命令不足，运行阶段会出现 TODO / BLOCKED / SKIP，可执行率可能为 0%。

---

## 五、独立模式下的放置位置

### 默认位置

**默认位置**：`{pwd}/.test/.test-env.md`

Skill Step 2 按以下优先级查找：
1. 调用时显式传入的 `runtime_source` 参数（绝对或相对路径）
2. `.test/.test-env.md`
3. 都找不到 → Y 警告 + 变量写 TODO 占位；E2E 是否可执行由 §4 `e2e-test-runner` 判断

### 覆盖默认位置

独立模式下用户可以指定其他路径：

```
"用 /path/to/custom-env.md 作为 runtime，生成 TC"
```

Skill 会把 `runtime_source` 设为 `/path/to/custom-env.md` 并从那里读取。

### SDD 模式下的位置

SDD 模式下 Skill 默认读取 `.test/.test-env.md`。若调用方显式传入 `runtime_source`，则按显式路径读取。

---

## 六、迁移指南（给用户）

如果你的项目之前用 `.env` / `.envrc` / YAML 配置管理测试环境，以下是迁移建议：

### 从 `.env` 迁移

```
# .env
API_BASE_URL=http://localhost:8080
TEST_DB_DSN=mysql://test:test@localhost:3306/app_test
TEST_USER=zhangsan
```

等价的 `.test/.test-env.md`：

```markdown
## 服务端点
- `base_url.local = http://localhost:8080`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://test:test@localhost:3306/app_test`

## 全局变量
- `vars.test_user = zhangsan`
```

### 从 YAML 迁移

```yaml
base_url:
  local: http://localhost:8080
test_db:
  type: mysql
  dsn: mysql://test:test@localhost:3306/app_test
```

等价的 `.test/.test-env.md`：

```markdown
## 服务端点
- `base_url.local = http://localhost:8080`

## 测试数据库
- `test_db.type = mysql`
- `test_db.dsn = mysql://test:test@localhost:3306/app_test`
```

**映射规则**：YAML 的嵌套 key 展开为点号 path，叶子节点变成 bullet。

---

## 七、安全建议

### 不应该放进 `.test/.test-env.md` 的内容

- 生产环境的数据库凭据
- 真实用户的密码
- 线上 API 密钥
- 个人身份信息（PII）

### 应该放进 `.test/.test-env.md` 的内容

- 本地 / 预发 / 测试环境的地址
- 测试数据库的 DSN（建议只读或专用测试账号）
- 测试账号和密码（专门为测试创建的账号）
- 测试 API 密钥（沙箱模式的密钥）

### 版本控制建议

- **公开仓库**：`.test/.test-env.md` 加入 `.gitignore`，提供 `.test/.test-env.example.md` 作为模板
- **私有仓库**：可以直接提交 `.test/.test-env.md`，但仍建议测试凭据与生产完全隔离

---

## 八、解析器实现要点（给 Skill）

Skill Step 2 解析 `.test/.test-env.md` 的伪代码：

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

**Skill 不是真的执行代码**，但应该按这个逻辑理解 `.test/.test-env.md`，避免"看起来像配置就随便解析"导致偏差。
