# e2e-exec 契约 Schema

本文件定义 `test-case-design` 在 TC-F 文档中生成的 `e2e-exec` 代码块格式。下游 `e2e-test-runner` 只消费本契约生成 Playwright 测试代码。

---

## 一、适用范围

- 仅用于 `channel=e2e` 的功能测试用例
- `framework` 固定为 `playwright`
- 支持 PC Web、管理后台 Web、H5 / 移动 Web、响应式 Web、可独立 URL 访问的 WebView/H5 页面
- 不支持小程序、原生 App、桌面客户端（含 Electron）
- 不对业务代码提出任何 selector / data-testid 要求或建议

---

## 二、完整模板

````markdown
```e2e-exec
framework: playwright
runnable: true
module: 01-用户认证
page: login
url: /login
tags: [smoke, auth]

data:
  username: ${vars.test_user}
  password: ${vars.test_password}

setup:
  - action: ensure_user
    username: ${vars.test_user}
    password: ${vars.test_password}

steps:
  - action: goto
    url: /login
  - action: fill
    target:
      selector: ${selectors.login.username}
      role: textbox
      name: 用户名
      placeholder: 请输入用户名
      label: 用户名
    value: ${vars.test_user}
  - action: click
    target:
      selector: ${selectors.login.submit}
      role: button
      name: 登录

assertions:
  - type: url_contains
    value: /home
  - type: visible
    target:
      selector: ${selectors.home.username}
      text: 用户名
  - type: text_contains
    target:
      selector: ${selectors.home.username}
    value: ${vars.test_user}

teardown: []
```
````

---

## 三、顶层字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `framework` | ✅ | 固定 `playwright` |
| `runnable` | ✅ | `true` / `false`；`false` 时必须给 `blocked_reason` |
| `blocked_reason` | 条件 | `runnable=false` 时填写 |
| `module` | ✅ | 模块编号和名称 |
| `page` | ⬜ | 页面 key，便于报告聚合 |
| `url` | ✅ | 相对 URL 或 `${e2e.base_url}` 拼接后的 URL |
| `tags` | ⬜ | `smoke` / `regression` / 业务标签 |
| `data` | ⬜ | 本用例变量引用 |
| `setup` | ⬜ | 前置动作数组，可空 |
| `steps` | ✅ | 操作步骤数组 |
| `assertions` | ✅ | 断言数组 |
| `teardown` | ⬜ | 清理动作数组，可空 |

---

## 四、动作枚举

| action | 必需字段 | Playwright 语义 |
|---|---|---|
| `goto` | `url` | `page.goto()` |
| `fill` | `target`, `value` | 定位后 `fill()` |
| `click` | `target` | 定位后 `click()` |
| `hover` | `target` | 定位后 `hover()` |
| `select` | `target`, `value` | `selectOption()` |
| `check` | `target` | 勾选 checkbox/radio |
| `uncheck` | `target` | 取消勾选 |
| `press` | `target`, `key` | 键盘输入 |
| `upload` | `target`, `file` | 文件上传 |
| `wait_for` | `target` 或 `url` 或 `ms` | 等待元素 / URL / 时间 |
| `expect_download` | `target` | 点击后等待下载 |
| `api_request` | `method`, `url` | Playwright request 辅助 setup/assertion；可选 `alias` 供后续断言引用 |
| `ensure_user` | 账号字段 | 数据准备抽象动作，runner 可映射为 API / 页面 / 跳过 |
| `cleanup` | 自定义字段 | 清理抽象动作，best-effort |

不在枚举内的动作必须改写为已有动作组合；不能自由发明动作。

---

## 五、target 定位对象

`target` 支持以下字段。runner 按字段存在性和稳定性尝试，不要求业务代码新增任何定位属性。

| 字段 | 示例 |
|---|---|
| `selector` | `${selectors.login.username}` |
| `role` | `button` / `textbox` / `link` |
| `name` | `登录` |
| `label` | `用户名` |
| `placeholder` | `请输入用户名` |
| `text` | `提交` |
| `css` | `.login-form input[name="username"]` |
| `xpath` | `//button[contains(., "登录")]` |

字段全部缺失时，`runnable` 必须设为 `false` 并写 `blocked_reason`。

---

## 六、断言枚举

| type | 必需字段 | 说明 |
|---|---|---|
| `url_contains` | `value` | URL 包含指定片段 |
| `url_equals` | `value` | URL 完全匹配 |
| `visible` | `target` | 元素可见 |
| `hidden` | `target` | 元素隐藏或不存在 |
| `text_contains` | `target`, `value` | 文本包含 |
| `text_equals` | `target`, `value` | 文本等于 |
| `value_equals` | `target`, `value` | 表单值等于 |
| `count_equals` | `target`, `value` | 元素数量等于 |
| `enabled` | `target` | 元素可用 |
| `disabled` | `target` | 元素禁用 |
| `checked` | `target` | checkbox/radio 已选 |
| `not_checked` | `target` | checkbox/radio 未选 |
| `response_ok` | `alias` 或 `url` | API / 页面请求成功；`alias` 对应前序 `api_request.alias` |
| `screenshot` | `name` | 生成截图证据，不做像素断言 |

---

## 七、变量引用

支持三类变量：

| 前缀 | 来源 | 类别 |
|---|---|---|
| `${e2e.xxx}` | `.test/.test-env.md` E2E 配置 | 硬依赖 |
| `${vars.xxx}` | `.test/.test-env.md` Vars | 硬依赖 |
| `${selectors.xxx}` | `.test/.test-env.md` 可选 selector 映射 | 可选优选定位 |

生成 TC 时变量缺失不阻断，但必须在回执中列出 TODO。执行 E2E 时变量仍缺失，按类别区分处理（与 `e2e-test-runner/references/playwright-adapter.md` §一/§四 一致，**不可一刀切 BLOCKED**）：

- **硬依赖** `${e2e.*}` / `${vars.*}`（用作 `value` / `url` / 数据准备）：仍缺失 → 该用例 `BLOCKED`。
- **可选优选定位** `${selectors.*}`（只用于 `target.selector`）：缺失 → 运行端**仅丢弃该 `selector` 字段**，改用同一 target 的 `role`/`name`/`label`/`placeholder`/`text`/`css`/`xpath` 定位；**不因此 BLOCKED**。只有当某 target 所有定位字段都缺失/不可解析时，该用例才 `BLOCKED`（即模板把 `${selectors.xxx}` 放首位 + 同时给 role/name/placeholder 兜底，正是为此设计）。

---

## 八、自检清单

- [ ] 每个 `channel=e2e` 用例有且仅有一个 `e2e-exec` 块
- [ ] `framework` 固定为 `playwright`
- [ ] `steps` 至少 1 条
- [ ] `assertions` 至少 1 条
- [ ] 所有 action/type 均在枚举内
- [ ] 所有 target 至少有一个定位字段，或 `runnable=false + blocked_reason`
- [ ] Markdown 步骤与 `e2e-exec.steps` 语义一致
- [ ] Markdown 预期结果与 `e2e-exec.assertions` 语义一致
