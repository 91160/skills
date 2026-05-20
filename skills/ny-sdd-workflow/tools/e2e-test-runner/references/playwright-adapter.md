# Playwright Adapter

本文件定义 `e2e-exec` 到 Playwright 的映射规则。

## 一、target 定位顺序

runner 按以下顺序尝试定位，不要求业务代码新增任何属性：

1. `selector`
2. `role` + `name`
3. `label`
4. `placeholder`
5. `text`
6. `css`
7. `xpath`

**`selector` 字段含未解析变量时的回退（强制）**：当 `target.selector` 的值是 `${selectors.xxx}` 且 `.test/.test-env.md` 未提供该映射（缺失 / TODO / 未确认示例值）→ **仅丢弃该 `selector` 字段，不视为该 TC 失败**，继续按上表第 2~7 项用 `role`/`name`/`label`/`placeholder`/`text`/`css`/`xpath` 定位。

**仅当 target 内所有定位字段都缺失或不可解析时**，该 TC 才标记 `BLOCKED`，报告写明已尝试的定位方式。`${selectors.*}` 是“可选优选定位”，其缺失绝不单独导致 BLOCKED（与 `test-env-template.md` §Selectors“可选；缺失不影响”一致）。

## 二、动作映射

| e2e-exec action | Playwright |
|---|---|
| `goto` | `page.goto(resolveUrl(url))` |
| `fill` | `locator(target).fill(value)` |
| `click` | `locator(target).click()` |
| `hover` | `locator(target).hover()` |
| `select` | `locator(target).selectOption(value)` |
| `check` | `locator(target).check()` |
| `uncheck` | `locator(target).uncheck()` |
| `press` | `locator(target).press(key)` |
| `upload` | `locator(target).setInputFiles(file)` |
| `wait_for` | `page.waitForURL()` / `locator.waitFor()` / `page.waitForTimeout()` |
| `expect_download` | `const downloadPromise = page.waitForEvent('download'); await locator(target).click(); const download = await downloadPromise;` |
| `api_request` | `request.get/post/put/delete(...)` |
| `ensure_user` | 优先映射为 API setup；无实现时记录 setup skipped |
| `cleanup` | best-effort 清理 |

## 三、断言映射

| e2e-exec assertion | Playwright |
|---|---|
| `url_contains` | `expect(page).toHaveURL(new RegExp(...))` |
| `url_equals` | `expect(page).toHaveURL(...)` |
| `visible` | `expect(locator).toBeVisible()` |
| `hidden` | `expect(locator).toBeHidden()` |
| `text_contains` | `expect(locator).toContainText(value)` |
| `text_equals` | `expect(locator).toHaveText(value)` |
| `value_equals` | `expect(locator).toHaveValue(value)` |
| `count_equals` | `expect(locator).toHaveCount(value)` |
| `enabled` | `expect(locator).toBeEnabled()` |
| `disabled` | `expect(locator).toBeDisabled()` |
| `checked` | `expect(locator).toBeChecked()` |
| `not_checked` | `expect(locator).not.toBeChecked()` |
| `response_ok` | `expect(response.ok()).toBeTruthy()` |
| `screenshot` | `page.screenshot({ path })` |

`api_request` 若声明 `alias`，runner 必须把 response 存入同名变量表；`response_ok` 使用 `alias` 时从变量表读取 response，使用 `url` 时可发起一次只读请求并断言响应成功。

## 四、变量解析

| 变量 | 来源 | 类别 |
|---|---|---|
| `${e2e.xxx}` | `.test/.test-env.md` 的 `e2e.*` | 硬依赖 |
| `${vars.xxx}` | `.test/.test-env.md` 的 `vars.*` | 硬依赖 |
| `${selectors.xxx}` | `.test/.test-env.md` 的 `selectors.*` | 可选优选定位 |

**变量解析失败的处理按类别区分（强制，不可一刀切 BLOCKED）**：

- **硬依赖** `${e2e.*}`（如 `${e2e.base_url}`）/ `${vars.*}`（账号、输入值等用作 `value` / `url` / 数据准备的变量）：解析失败 → 该 TC 标记 `BLOCKED`（无可执行语义，保持原规则）。
- **可选优选定位** `${selectors.*}`（只出现在 `target.selector` 字段）：解析失败 → **仅丢弃该 `selector` 字段**，按 §一 第 2~7 项继续定位；**不**单独导致 BLOCKED。只有当该 target 所有定位字段（selector/role/name/label/placeholder/text/css/xpath）都缺失或不可解析时，该 TC 才 `BLOCKED`。

> 即：`${selectors.*}` 缺失是正常场景（团队通常不维护 selector 映射、新项目无 DOM 可参照），绝不能因此把整批 e2e 用例判 BLOCKED。

## 五、spec 生成原则

- 每个 TC 一个 spec 文件，便于定位失败
- spec 文件名：`{TC-ID}-{slug}.spec.ts`
- helper 文件只能写入 `.test/e2e/specs/helpers/`
- Playwright 配置写入 `.test/e2e/playwright.config.ts`
- 因 config 文件位于 `.test/e2e/`，内部使用 `testDir: "./specs"`、`outputDir: "./artifacts"`、JSON reporter `outputFile: "results.json"`
- JSON 结果最终写入 `.test/e2e/results.json`
- artifacts 最终写入 `.test/e2e/artifacts/`
- 不写入项目生产源码目录
- 不修改 package.json；依赖安装通过 `e2e.install_command` 控制。Runner 应按 lockfile / package.json 自动推断可信安装命令并直接执行；包管理器无法唯一判断或命令有明显风险时才询问用户。
