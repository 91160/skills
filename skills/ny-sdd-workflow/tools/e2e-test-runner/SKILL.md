---
name: e2e-test-runner
description: >
  在 SDD 工作流 §4 全部模块归档后执行端到端测试。读取 `.test/testcases/TC-F-*.md`
  中的 `channel=e2e` 与 `e2e-exec` 契约，生成并运行 Playwright 测试，输出
  `.test/e2e/report.md`、`.test/e2e/report.html`、`.outdocs/e2e-report.md`
  和 `.outdocs/e2e-report.html`。仅支持 Playwright，不支持 Cypress、小程序、原生 App 或桌面客户端（含 Electron）。
  不修改 §3 编码流程，也不要求或建议业务代码增加 selector / data-testid。
---

# E2E Test Runner Skill

本 Skill 是 SDD 工作流的后置端到端验收器。它消费 §2.7 `test-case-design` 生成的 TC-F 文档，把 `e2e-exec` 契约转成 Playwright spec，执行后生成 Markdown + HTML 双报告。

---

## 能力边界

**支持**：
- PC Web
- 管理后台 Web
- H5 / 移动 Web
- 响应式 Web
- 可独立 URL 访问的 WebView/H5 页面
- 浏览器流程中的 API 辅助 setup / assertion

**不支持**：
- Cypress（v1 不接）
- 微信 / 支付宝 / 抖音等小程序原生容器
- 原生 iOS / Android App
- 桌面客户端（含 Electron）
- 设备硬件强依赖场景（蓝牙、NFC、深度相机等）

**测试侧原则**：
- 不修改业务代码
- 不要求、不建议、不暗示业务代码补 selector 或 data-testid
- selector / 定位问题只通过 `.test/.test-env.md`、`e2e-exec.target` 和报告状态处理
- 只执行能做 E2E 且有必要做 E2E 的场景
- 不执行 E2E 的场景由 §4 或命令入口记录 `SKIP` 留痕，不调用本 Skill，不生成 E2E 报告
- 本 Skill 被调用后若因依赖、服务、运行时配置等执行阶段问题未能实际运行 Playwright，才输出 `SKIP` 报告

---

## 场景适用性

执行任何 Playwright 生成或运行前，先判断项目/任务场景。

| 场景 | E2E 策略 | 数据策略 |
|---|---|---|
| 新项目 feature | 可执行且有浏览器产品端时执行；不可执行时由入口告知原因并记录 `SKIP` 留痕，不调用本 Skill | `auto -> ai_generated`，生成数据写入 `.test/e2e/data/generated-data.json` |
| 旧项目 feature / 新增需求 | 可执行且本次需求涉及浏览器产品端时执行；不可执行时由入口告知原因并记录 `SKIP` 留痕，不调用本 Skill | `auto -> env`，默认使用用户提供账号 / fixture / API seed |
| bug 修复 | 不执行 E2E，由入口记录 `SKIP` 留痕，不调用本 Skill | 不造数据 |
| refactor / 技术优化 | 先判断必要性与可执行性；仅影响用户主流程、页面路由、接口契约、权限链路或跨模块状态流转时执行 | `auto -> env`，默认用户提供 |

**技术优化必要性判据**：
- 影响用户可见主流程
- 影响页面路由 / 菜单 / 表单提交 / 登录态
- 影响前后端接口契约
- 影响权限、角色、会话、状态流转
- 影响跨模块数据读写链路

上述均不满足 → 入口不调用本 Skill，只记录 `SKIP` 留痕，原因写 `无必要做 E2E`。

**能力判据**：
- 产品端必须属于 Playwright 支持范围
- `e2e.base_url` 已由用户确认，且当前可访问或服务可由确认后的启动命令启动
- TC-F 中存在 `channel=e2e` 且有 `e2e-exec`
- 旧项目必须有用户提供的测试账号 / fixture / API seed，除非用户明确允许 AI 造数据

能力判据不满足 → 入口不调用本 Skill，只记录 `SKIP` 留痕，原因写明不可执行原因。

## 输入契约

| 字段 | 必需 | 默认值 | 说明 |
|---|---|---|---|
| `tc_source` | ✅ | `.test/testcases/TC-F-*.md` | TC-F 文档 glob |
| `runtime_source` | ✅ | `.test/.test-env.md` | E2E 运行配置 |
| `framework` | ✅ | `playwright` | 固定 `playwright` |
| `output_dir` | ✅ | `.test/e2e` | E2E 工作目录 |
| `exec_mode` | ✅ | `true` | 是否执行测试 |
| `channels_filter` | ⬜ | `e2e` | 只执行 `channel=e2e` |
| `browser` | ⬜ | 从 `.test/.test-env.md` 读取 | 默认 chromium |

---

## 输出产物

```
.test/e2e/
├── E2E-PLAN.md
├── playwright.config.ts
├── results.json
├── data/
├── specs/
├── artifacts/
├── report.md
└── report.html

.outdocs/
├── e2e-report.md
└── e2e-report.html
```

---

## SKIP-report 模式

当本 Skill 已被调用，但在执行阶段因运行时配置、依赖、服务或环境问题无法实际运行 Playwright 时，进入 SKIP-report 模式。场景不适用、无必要、用户主动跳过、bug 修复、缺少 TC-F 等“入口级不执行”不调用本 Skill，也不生成 E2E 报告。

**触发原因**：
- `.test/.test-env.md` 无法创建 / 补全，或关键配置缺失且用户选择不处理
- 缺少 `channel=e2e` / `e2e-exec`
- 依赖、环境、`base_url` 不可用且用户选择不处理

**行为**：
- 不生成 Playwright spec
- 不启动服务
- 不安装依赖
- 不执行 Playwright
- 必须生成 `.outdocs/e2e-report.md` 和 `.outdocs/e2e-report.html`
- 若 `.test/e2e/` 可写，同时生成 `.test/e2e/report.md` 和 `.test/e2e/report.html`

**最小 Markdown 报告**：
```markdown
## E2E 测试报告（YYYY-MM-DD）

结论：SKIP
框架：Playwright
base_url：{未配置 / 不适用 / e2e.base_url}
用例：0 通过 / 0 失败 / 0 跳过 / 0 BLOCKED
执行覆盖率：0/0 = N/A
自动化覆盖率：0/0 = N/A
P0 覆盖率：0/0 = N/A
执行命令：未执行
HTML 报告：.outdocs/e2e-report.html
结果模型：未生成

### SKIP 原因
{skip_reason}

### 后续建议
{next_action}
```

HTML 报告必须表达同一结论和原因，不依赖外部 CDN。

---

## 执行流程

### Step 0: SDD 模式自检

检查项目根是否存在：
- `.project/specs/master/`
- `.test/testcases/`

`.test/testcases/` 缺失时，不进入本 Skill 的报告生成流程；回到命令入口记录 `SKIP` 留痕，不生成 E2E 报告。

`.test/.test-env.md` 缺失不是 SKIP 条件；进入 Step 1 自动创建并补全可安全确定的 E2E 字段。

读取项目/任务场景：
- `.project/context.md`：当前任务类型、last、是否 bug 修复回环
- `.project/specs/master/index.md`：模块类型、dev-order、sync-status
- 当前 REQ/DES：`task-type` / `affected-module` / 是否 feature、bug、refactor
- `.project/specs/rules/project-profile.md`：新项目/旧项目线索、产品端类型

输出：
```
【E2E 环境】
  SDD 项目: {是/否}
  项目/任务场景: {新项目 feature / 旧项目 feature / bug / refactor / 不确定}
  适用性: {可执行 / 不适用 / 不可执行 / 需用户确认}
  原因: {原因摘要}
  TC 来源: {tc_source}
  runtime: {runtime_source}
  输出目录: {output_dir}
```

本 Skill 在 NY-SDD Workflow 中仅作为 SDD 项目内 E2E 执行器使用；非完整 SDD 项目不运行 Playwright，也不生成普通独立项目报告。

若本 Skill 被误调用到 bug 修复、场景不适用、无必要或缺少 TC-F 的入口级不执行场景，立即停止并回到入口规则：只记录 `SKIP` 留痕，不生成 E2E 报告，不进入 Step 1~10 的 Playwright 生成/执行。

### Step 1: E2E 前置环境准备

目标：确保 `.test/.test-env.md` 存在，并补全 E2E Runner 能安全确定的默认字段。

若 `.test/.test-env.md` 不存在：
1. 读取 `{SKILL_DIR}/tools/test-case-design/references/test-env-template.md`。
2. 先确保 `.test/` 目录存在。
3. 创建 `.test/.test-env.md`。
4. 写入基础模板与 E2E 默认字段。
5. 不自动填入 `e2e.base_url`、`e2e.test_command`、账号类 `vars.*`。

若 `.test/.test-env.md` 已存在：
1. 保留用户已有配置。
2. 只补充缺失且可安全确定的 `e2e.*` 默认字段。
3. 不覆盖用户已经写入的 `base_url`、`test_command`、`vars.*`、`selectors.*`。

关键字段判定：
- 空值、`TODO`、`# TODO 用户填写`、明显模板示例值，均视为缺失。
- `e2e.base_url`、`e2e.test_command`、账号类 `vars.*` 即使存在模板示例，也必须经过用户确认后才可用于执行。
- 自动补全不得把 `http://localhost:5173`、`npx playwright test -c .test/e2e/playwright.config.ts`、示例账号等写成已确认运行配置。

可安全自动补全的默认字段：
```text
e2e.framework = playwright
e2e.install_command = {按包管理器自动推断，见下方规则}
e2e.spec_dir = .test/e2e/specs
e2e.artifacts_dir = .test/e2e/artifacts
e2e.report_md = .outdocs/e2e-report.md
e2e.report_html = .outdocs/e2e-report.html
e2e.config = .test/e2e/playwright.config.ts
e2e.results_json = .test/e2e/results.json
e2e.data_dir = .test/e2e/data
e2e.data_strategy = auto
e2e.browser = chromium
e2e.headed = false
e2e.retries = 1
e2e.timeout_ms = 30000
```

`e2e.install_command` 自动推断规则：
- 存在 `pnpm-lock.yaml` → `pnpm add -D @playwright/test && pnpm exec playwright install chromium`
- 存在 `yarn.lock` → `yarn add -D @playwright/test && yarn playwright install chromium`
- 存在 `bun.lockb` 或 `bun.lock` → `bun add -d @playwright/test && bunx playwright install chromium`
- 否则存在 `package-lock.json` 或 `package.json` → `npm i -D @playwright/test && npx playwright install chromium`
- 多个 lockfile 同时存在或无法判断包管理器 → 不写入 `e2e.install_command`，在 Step 7 输出风险提示并询问用户

禁止自动补全为已确认值的字段：
```text
e2e.base_url
e2e.test_command
vars.*
```

可给出候选但不能直接写入的字段：
- `e2e.base_url`：可根据常见端口、框架配置、README、package scripts 给出候选，但必须用户确认。
- `e2e.start_command`：可根据 `package.json` scripts 的 `dev` / `start` / `serve` / `preview` 给出候选；已有服务可留空。
- `e2e.test_command`：可建议 `{pm exec} playwright test -c .test/e2e/playwright.config.ts`；`pm exec` 按包管理器推断为 `pnpm exec` / `yarn` / `bunx` / `npx`，但必须用户确认后写入。
- 账号类 `vars.*`：如 `vars.username` / `vars.password` / `vars.token` / `vars.account` / `vars.email` / `vars.phone` 等，不能猜测。旧项目默认要求用户提供；新项目可询问是否允许 AI 生成测试数据。
- `selectors.*`（可选优选定位，**非关键字段**）：缺失/TODO **不**列入「关键字段缺失确认」、**不**导致 SKIP 或 BLOCKED。`${selectors.*}` 不可解析时按 `references/playwright-adapter.md` §一/§四 自动丢弃该 selector 字段、回退 `role/name/label/placeholder/text` 定位。可在回执中**建议**用户按真实页面补 `## Selectors` 以降低首轮 locator 失败率，但仅为建议，不阻断执行。

当缺少关键字段时输出：
```text
【E2E 环境配置确认】
以下字段无法安全自动确定：
- e2e.base_url: {缺失 / 候选值}
- e2e.test_command: {缺失 / 候选值}
- vars.*: {缺失账号类变量列表 / 无}

请选择：
  A. 我补充 .test/.test-env.md，补好后继续
  B. 使用候选 base_url / test_command，账号类用例标记 BLOCKED
  C. 仅新项目：允许 AI 生成一次性测试数据
  D. 跳过 E2E，仅记录 SKIP 留痕
```

处理规则：
- 用户选 A：等待用户补充后重新读取 `.test/.test-env.md`。
- 用户选 B：只写入用户确认的候选 `base_url` / `test_command`；账号类变量缺失的用例标记 `BLOCKED`。
- 用户选 C：仅新项目 feature 可用；生成数据写入 `e2e.data_dir/generated-data.json`，并在报告记录 `data_strategy=ai_generated`。
- 用户选 D 或用户拒绝提供关键配置：停止本 Skill，不生成 E2E 报告；回到入口记录 SKIP 留痕，原因写 `E2E 关键运行配置缺失且用户选择跳过`。

### Step 2: 读取 runtime

读取已创建 / 补全后的 `.test/.test-env.md` 并解析以下字段：
- `e2e.framework`
- `e2e.base_url`
- `e2e.start_command`
- `e2e.test_command`
- `e2e.install_command`
- `e2e.spec_dir`
- `e2e.artifacts_dir`
- `e2e.report_md`
- `e2e.report_html`
- `e2e.config`
- `e2e.results_json`
- `e2e.data_dir`
- `e2e.data_strategy`
- `e2e.browser`
- `e2e.headed`
- `e2e.retries`
- `e2e.timeout_ms`
- `vars.*`
- `selectors.*`

硬规则：
- `e2e.framework` 必须是 `playwright`；否则结论 `SKIP`
- `e2e.base_url` 缺失 / TODO / 未确认示例值 → 输出配置确认；用户不提供才 `SKIP`
- `e2e.test_command` 缺失 / TODO / 未确认示例值 → 输出配置确认；用户不提供才 `SKIP`

### Step 3: 读取 TC-F 并抽取用例

读取 `tc_source` 匹配到的所有 `TC-F-*.md`，抽取：
- TC-ID
- 标题
- module
- channel
- priority
- exec-mode
- `e2e-exec` 代码块

分类：
- `channel=e2e` 且有 `e2e-exec` → 纳入执行计划
- `channel=e2e` 但无 `e2e-exec` → `BLOCKED`
- `channel=visual` → 进入视觉截图计划；无法解析 URL/page 时进入 `MANUAL_VISUAL`
- `channel=manual` → 进入人工清单

默认不按优先级缩减，P0/P1/P2 全量纳入。

### Step 4: 校验 e2e-exec

按 `references/playwright-adapter.md` 和 `test-case-design/references/e2e-exec-schema.md` 校验：
- `framework=playwright`
- `steps` 非空
- `assertions` 非空
- action/type 在枚举内
- **变量引用按类别校验（强制，详见 `references/playwright-adapter.md` §一/§四，不可一刀切 BLOCKED）**：
  - 硬依赖 `${e2e.*}` / `${vars.*}`（用作 `value` / `url` / 数据准备）不可解析 → 该 TC `BLOCKED`
  - 可选优选定位 `${selectors.*}`（仅 `target.selector`）不可解析 → **丢弃该 `selector` 字段**，不因此 BLOCKED，改用同 target 其余定位字段
- target **在丢弃不可解析的 `${selectors.*}` 之后**，仍至少存在一种可用定位字段（selector/role/name/label/placeholder/text/css/xpath）；**全部缺失或全部不可解析才** `BLOCKED`

P0 `channel=e2e` 用例若被 `BLOCKED`，最终结论不能是 `PASS`，只能是 `PARTIAL` 或 `FAIL`。

### Step 5: 生成 E2E-PLAN.md

写入 `.test/e2e/E2E-PLAN.md`：
- 总用例数
- e2e 执行用例数
- visual 用例数
- manual 用例数
- BLOCKED 用例及原因
- 预计执行命令
- base_url / browser / retries
- 服务状态：初始探测结果、启动命令来源、是否由本 Runner 启动

### Step 6: 生成 Playwright spec

将每个可执行 `e2e-exec` 转为 `.test/e2e/specs/{TC-ID}-{slug}.spec.ts`。

生成规则：
- 每个 TC 一个 `test(...)`
- 将 `setup` 映射为 before steps 或测试开头动作
- 将 `steps` 映射为 Playwright 操作
- 将 `assertions` 映射为 `expect(...)`
- 失败时保留 screenshot / trace / video（依赖 Playwright 配置）
- 不写入任何业务源码目录

同时生成：
- `.test/e2e/playwright.config.ts`
- `.test/e2e/results.json`（执行后由 reporter 或结果收集步骤写入）
- `.test/e2e/data/generated-data.json`（AI 生成或固化后的测试数据；不能放入 artifacts 根目录，避免被 Playwright 清理）
- `.test/e2e/specs/helpers/`（仅放测试侧 helper）

`playwright.config.ts` 必须约束：
- 因 config 文件位于 `.test/e2e/playwright.config.ts`，内部路径必须相对 `.test/e2e/`
- `testDir = "./specs"`
- `outputDir = "./artifacts"`
- `retries` / `timeout` / `headless` / `browser` 从 `.test/.test-env.md` 读取
- reporter 至少包含 JSON 输出，`outputFile = "results.json"`；不要写 `.test/e2e/results.json`，否则会落到 `.test/e2e/.test/e2e/results.json`
- trace / screenshot / video 按失败保留，证据路径写入报告

### Step 6.5: 生成 visual 截图入口

对 `channel=visual` 用例：
- 若 TC 文档可解析出 URL 或 page → 生成 visual screenshot spec，只执行导航与截图，证据写入 `.test/e2e/artifacts/visual/`
- 若无法解析 URL/page → 标记为 `MANUAL_VISUAL`
- 不做像素断言，不生成 baseline，不要求业务代码改造
- visual 截图失败不等同于 e2e 断言失败，但必须进入报告的 visual 清单；若失败来自页面 5xx / JS 致命错误，可在报告中标记 `VISUAL_FAIL`

### Step 7: 准备运行环境与服务

执行前检查：
- `@playwright/test` 是否可用
- 浏览器是否可用
- `e2e.base_url` 是否可访问

处理：
- 依赖缺失且 `e2e.install_command` 已按包管理器可信推断或已在 `.test/.test-env.md` 明确配置 → 直接执行 `e2e.install_command`
- 依赖缺失但包管理器无法唯一判断、存在多个 lockfile、或 `e2e.install_command` 含明显风险命令（删除、重置、全局安装、未知脚本链）→ 输出确认提示，等待用户确认
- 安装失败 → `SKIP`，报告记录原因

服务探测与启动规则：
1. 先请求 `e2e.base_url`。
2. 若可访问：复用现有服务，记录 `service_owner=external`，执行结束后不停止服务。
3. 若不可访问且存在 `e2e.start_command`：执行该命令启动服务，记录进程 / session 为 `service_owner=runner`。
4. 若不可访问且缺少 `e2e.start_command`：从 `package.json` scripts 自动推断可信候选（优先 `dev`，其次 `start` / `serve` / `preview`）；仅有唯一候选时直接写入 `.test/.test-env.md` 并启动，多个候选或命令含明显风险动作时才询问用户。
5. 启动后每 1 秒轮询 `e2e.base_url`，默认最多等待 30 秒；若 `e2e.timeout_ms` 更大，可按该值作为上限。
6. 轮询期间服务进程提前退出 → `SKIP`，原因写 `服务启动失败或提前退出`。
7. 轮询超时且 HTTP 仍不可达 → `SKIP`，原因写 `base_url 不可达且服务未成功启动`。
8. HTTP 可达但页面 5xx / 白屏 / 致命 JS 错误导致核心流程无法执行 → `FAIL`，并保留页面截图 / console 错误。

清理规则：
- 只停止本次 Runner 启动的服务。
- 不停止执行前已经存在的服务。
- 报告必须记录：初始 base_url 探测结果、启动命令、启动来源（`.test/.test-env.md` / AI 自动推断 / 用户确认候选）、轮询耗时、最终服务状态、是否执行清理。

### Step 8: 执行 Playwright

执行 `e2e.test_command`。

默认要求：
- 全量执行所有可执行 e2e TC
- `retries` 从 `.test/.test-env.md` 读取，默认 1
- 执行失败保留 artifacts
- 不因 P2 失败而忽略失败；任何 e2e 用例失败均进入 FAIL 分析
- 执行完成后读取 `.test/e2e/results.json`，生成统一结果模型
- Markdown 与 HTML 必须从同一份统一结果模型生成，避免双报告统计不一致

### Step 9: 生成报告

生成四份报告：
- `.test/e2e/report.md`
- `.test/e2e/report.html`
- `.outdocs/e2e-report.md`
- `.outdocs/e2e-report.html`

Markdown 报告锚点固定：
```markdown
## E2E 测试报告（YYYY-MM-DD）

结论：PASS / FAIL / PARTIAL / SKIP
框架：Playwright
base_url：{url}
用例：{pass} 通过 / {fail} 失败 / {skip} 跳过 / {blocked} BLOCKED
执行覆盖率：{executed}/{total} = {percent}
自动化覆盖率：{e2e}/{total} = {percent}
P0 覆盖率：{p0_executed}/{p0_total} = {percent}
执行命令：{command}
HTML 报告：.outdocs/e2e-report.html
结果模型：.test/e2e/results.json

| TC-ID | 模块 | 场景 | priority | channel | 结果 | 证据 |
|---|---|---|---|---|---|---|

### 失败清单
...

### BLOCKED 清单
...

### visual / manual 清单
...

### 运行环境
- config：.test/e2e/playwright.config.ts
- results：.test/e2e/results.json
- artifacts：.test/e2e/artifacts/
- service：{external / runner-started / not-started}，启动命令：{command / 无}
```

HTML 报告必须包含：
- 结论总览
- 执行覆盖率 / 自动化覆盖率 / P0 覆盖率
- 用例表格
- 失败详情
- BLOCKED 原因
- artifacts 链接（screenshot / trace / video，如存在）
- visual / manual 清单
- `.test/e2e/results.json` 来源说明
- `.test/e2e/playwright.config.ts` 运行配置摘要
- 服务探测 / 启动 / 清理摘要

HTML 生成硬规则：
- 必须读取 `references/report-template.md` 的 HTML 报告要求生成页面
- 不允许只把 Markdown 内容包进 HTML
- 必须是独立可打开文件，CSS / JS 内联，不依赖外部 CDN
- 必须包含顶部总览、质量摘要、风险分布、失败与阻塞优先区、用例明细、运行环境与证据 6 个区块
- PASS / FAIL / PARTIAL / SKIP / BLOCKED 必须使用固定状态色和 badge
- P0 FAIL / P0 BLOCKED 必须在第一屏后的“失败与阻塞优先区”高亮
- 长错误、console、trace 摘要必须用 `<details>` 折叠，避免报告首屏被日志淹没
- `vars.*`、token、password、secret、key、cookie、authorization 等敏感信息必须脱敏，不得写入 HTML 原文
- SKIP 结论也必须生成完整 HTML 页面，明确展示 SKIP 原因、缺失项、未执行 Playwright、下一步建议
- `.test/e2e/report.html` 与 `.outdocs/e2e-report.html` 内容必须一致，路径链接可按所在目录调整

### Step 10: 结论判定

| 结论 | 条件 |
|---|---|
| `PASS` | 所有 `channel=e2e` 可执行用例通过，且无 e2e BLOCKED |
| `FAIL` | 任一已执行 e2e 用例失败；或服务已启动但业务页面出现 5xx / 白屏 / 致命 JS 错误导致核心流程不可执行 |
| `PARTIAL` | 无执行失败，但存在 e2e BLOCKED / visual 未闭环 / manual 未自动执行 |
| `SKIP` | 没有实际执行 Playwright：用户取消、环境缺失、依赖缺失、`base_url` 不可达且无法启动 |

机械判定顺序：
1. 未执行 Playwright → `SKIP`
2. 已执行且存在 e2e fail → `FAIL`
3. 无 fail 但存在 P0 e2e BLOCKED → `PARTIAL`，报告显式标红 P0 BLOCKED
4. 无 fail 但存在 P1/P2 e2e BLOCKED、visual 未闭环、manual 未自动执行 → `PARTIAL`
5. 所有 `channel=e2e` 用例通过且无 BLOCKED → `PASS`

输出回执：
```
【e2e-test-runner 执行回执】
  结论: {PASS/FAIL/PARTIAL/SKIP}
  TC 总数: {N}
  e2e 执行: {N}
  通过/失败/BLOCKED: {N}/{N}/{N}
  Markdown 报告: .outdocs/e2e-report.md
  HTML 报告: .outdocs/e2e-report.html
```

---

## 参考文件

| 文件 | 用途 |
|---|---|
| `references/playwright-adapter.md` | e2e-exec → Playwright 映射 |
| `references/report-template.md` | Markdown / HTML 报告模板 |
