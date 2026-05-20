# Channel Playbooks — 功能测试 3 个通道写法指南

本文件为 `test-case-design` Skill 的 Step 4（分配 channel + 编写 `e2e-exec` / 测试说明）提供操作手册。每个 channel 有明确的"何时用 / 执行方式 / 模板 / 示例 / 常见错误"五段式。

**前置阅读**：`e2e-exec-schema.md`（E2E 契约）。

---

## 通道总览

| channel | 适用场景 | mcp 能力依赖 | 可降级到 | 典型章节 |
|---|---|---|---|---|
| `e2e` | 浏览器可执行的业务流程 / 前端交互 / H5 | §4 e2e-test-runner | 运行时报告 PARTIAL/BLOCKED | 业务流程 / UI 交互 |
| `visual` | 视觉还原 / 截图检查 | §4 e2e-test-runner 可生成截图入口 | 人工目视 | 视觉回归 |
| `manual` | 兜底人工 | **不可自动** | - | 任何章节 |

---

## 一、channel: e2e

### 何时使用

- 被测对象是前端交互（点击、输入、导航、DOM 断言）
- 验收标准涉及"点击后跳转"、"输入后应显示 XX"、"加载态/错误态"
- DES 中的 "UI 还原" 维度（交互部分）
- 可通过浏览器访问的业务主流程、H5 / 移动 Web、响应式页面

### 执行方式

由 §4 `e2e-test-runner` 使用 Playwright 执行。生成 TC 时不按当前工具能力降级；运行时无法执行的用例由 E2E 报告标记 `BLOCKED` / `PARTIAL`。

### 模板骨架

````markdown
#### TC-{module}-{seq} {用例名}

**channel**: e2e | **priority**: {P0/P1/P2} | **exec-mode**: auto

**步骤**:
1. {操作步骤}
2. {操作步骤}

**预期结果**:
- {预期行为}

```e2e-exec
framework: playwright
runnable: true
module: {module}
page: {page_key}
url: /{path}
tags: [regression]
data: {}
setup: []
steps:
  - action: goto
    url: /{path}
assertions:
  - type: visible
    target:
      text: {页面关键文案}
teardown: []
```
````

### 支持的动作关键字（摘要）

| 动作 | 参数 | 含义 |
|---|---|---|
| `goto` | `{URL}` | 导航到 URL |
| `fill` | `target`, `value` | 填充输入框 |
| `click` | `target` | 点击元素 |
| `hover` | `target` | 鼠标悬停 |
| `select` | `target`, `value` | 选择下拉项 |
| `wait_for` | `target` / `url` / `ms` | 等待元素、URL 或时间 |
| `api_request` | `method`, `url`, 可选 `alias` | Playwright request 辅助；`alias` 可供 `response_ok` 断言引用 |

完整动作和断言枚举见 `references/e2e-exec-schema.md`。

### 完整示例：登录页表单提交

```markdown
#### TC-login-002 登录页 - 正常表单提交流程

**channel**: e2e | **priority**: P0 | **exec-mode**: auto

**步骤**:
1. 打开登录页
2. 输入用户名和密码
3. 点击登录

**预期结果**:
- 跳转到首页
- 显示当前用户名

```e2e-exec
framework: playwright
runnable: true
module: 01-登录
page: login
url: /login
tags: [smoke, auth]
data:
  username: ${vars.test_user}
  password: ${vars.test_password}
setup: []
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
  - action: fill
    target:
      selector: ${selectors.login.password}
      role: textbox
      name: 密码
      placeholder: 请输入密码
      label: 密码
    value: ${vars.test_password}
  - action: click
    target:
      selector: ${selectors.login.submit}
      role: button
      name: 登录
assertions:
  - type: url_contains
    value: /home
  - type: text_contains
    target:
      selector: ${selectors.home.username}
      text: 用户名
    value: ${vars.test_user}
teardown: []
```
```

### 常见错误

| 错误 | 说明 | 修复 |
|---|---|---|
| `e2e-exec` 与 Markdown 步骤不一致 | 文档说点击 A，契约点击 B | 修正二者使语义一致 |
| 变量未声明 | 使用 `${vars.test_user}` 但未在 `.test/.test-env.md` 标注 | 回执列 TODO，E2E 阶段未补则 BLOCKED |
| action/type 自造 | 写了枚举外动作 | 改写为 `e2e-exec-schema.md` 中已有动作组合 |

---

## 二、channel: visual

### 何时使用

- 验收标准涉及"布局还原度"、"品牌色"、"字号"、"间距"、"圆角"等视觉细节
- 无法通过 DOM 断言表达的视觉问题
- 前端任务的第四章通常有 1-3 条此类用例

### 不可自动执行

`exec-mode` 使用 `visual`。AI 生成这类用例时，只写"测试说明"段落，不生成 `e2e-exec`；§4 E2E 阶段可生成截图和 HTML 报告入口，但无基准时不做像素断言。

### 模板骨架

```markdown
#### TC-{module}-{seq} {用例名}

**channel**: visual | **priority**: {P0/P1/P2} | **exec-mode**: visual

**测试说明**：
对比 `.docs/prd/{prd-file}` 与实际页面截图，人工验证：
- {验证点 1}
- {验证点 2}
- ...
```

### 完整示例

```markdown
#### TC-login-009 登录页 - 品牌视觉还原

**channel**: visual | **priority**: P1 | **exec-mode**: visual

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

## 三、channel: manual

### 何时使用

- 任何**不能自动执行**的场景：
  - 外部系统联调（第三方支付、OCR、短信网关）
  - 物理设备测试（扫码枪、蓝牙、NFC）
  - 跨系统流程（业务数据需要多个系统协同）
  - 无法通过浏览器自动化表达的场景
- 用户测试环境配置不全且无法形成 `e2e-exec` 时的兜底

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
├─ 验证可通过浏览器完成的页面流程 / 前端交互 / H5？
│  └─ channel=e2e（必须生成 e2e-exec）
├─ 验证前端视觉还原？
│  └─ channel=visual（截图/报告入口或人工目视）
└─ 其他（跨系统联调/物理设备/外部依赖）？
   └─ channel=manual
```

**不按当前工具能力降级**：是否实际可执行由 §4 `e2e-test-runner` 判断并报告；TC 设计阶段只负责正确表达"应该测什么"。

---

## Channel 分布的建议比例

一个健康的 TC 文档，各 channel 分布参考：

| channel | 合理占比 |
|---|---|
| `e2e` | 前端/全链路功能尽量全量覆盖 |
| `visual` | 仅视觉还原类场景 |
| `manual` | 仅无法浏览器自动化的外部系统/物理设备/人工判断场景 |

**可执行率** = `channel=e2e / total-cases`。前端任务低于 50% 时，Skill 应在回执中说明哪些验收标准无法浏览器自动化。
