# test-case-design

> 测试工程师视角的功能测试用例设计 Skill。  
> 从 REQ/DES/PRD 生成 TC-F Markdown 用例集、CSV 导出，并为 E2E 用例生成 `e2e-exec` 契约。

---

## 是什么

`test-case-design` 把 QA 测试工程师的用例设计流程编码进 AI。给它一份已评审的需求/设计文档，它会产出：

- `.test/testcases/TC-F-{module}.md`
- `.test/testcases/testcases.detailed.csv`
- `.test/testcases/testcases.traditional.csv`

TC 文档同时服务两类读者：

- QA 人员：阅读步骤、预期结果、覆盖率矩阵
- §4 `e2e-test-runner`：读取 `channel=e2e` 用例中的 `e2e-exec` 契约，生成 Playwright 测试

---

## Channel

合法 channel 只有 3 个：

| channel | 用途 |
|---|---|
| `e2e` | 浏览器可执行的业务流程 / 前端交互 / H5，必须带 `e2e-exec` |
| `visual` | 视觉还原 / 截图检查入口，不写 `e2e-exec` |
| `manual` | 外部系统、物理设备、人工判断等不可浏览器自动化场景 |

单元/API/DB/CLI 自动化不由本 Skill 生成，由 `unit-test-generator` 在 §3.7.1 独立设计和执行。

---

## e2e-exec 示例

````markdown
#### TC-F-01-010 登录页 - 正常登录流程

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
module: 01-用户认证
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
  - action: click
    target:
      selector: ${selectors.login.submit}
      role: button
      name: 登录
assertions:
  - type: url_contains
    value: /home
teardown: []
```
````

`selectors.*` 是 `.test/.test-env.md` 中的可选测试侧映射。缺失时不要求业务代码改造，E2E runner 会按契约中的其他定位字段尝试。

---

## 工作流程

| Step | 内容 |
|---|---|
| Step 0 | 项目环境检测（SDD / 独立） |
| Step 1 | 输入契约解析 + 加载 REQ/DES/PRD |
| Step 2 | 读取 `.test/.test-env.md`，收集 E2E 变量 / 端点 / 可选 selector |
| Step 3 | 应用 6 种方法论生成用例蓝本 |
| Step 4 | 分配 channel + 编写 `e2e-exec` / 测试说明 |
| Step 5 | TC-01~TC-06 自审 + Markdown / `e2e-exec` 一致性校验 |
| Step 6 | 组装 TC 文档 + CSV 并行输出 |

---

## 配置

`.test/.test-env.md` 现在同时服务单测和 E2E。E2E 相关字段：

```markdown
## E2E
- `e2e.framework = playwright`
- `e2e.base_url = TODO 用户确认被测 Web/H5 入口地址`
- `e2e.start_command = TODO 用户确认本地启动命令；已有服务时可留空`
- `e2e.test_command = TODO 用户确认 E2E 执行命令（建议：npx playwright test -c .test/e2e/playwright.config.ts）`
- `e2e.spec_dir = .test/e2e/specs`
- `e2e.artifacts_dir = .test/e2e/artifacts`
- `e2e.report_md = .outdocs/e2e-report.md`
- `e2e.report_html = .outdocs/e2e-report.html`

## Selectors（可选映射）
- `selectors.login.username = input[name="username"]`

## 全局变量
- `vars.test_user = zhangsan`
- `vars.test_password = "test@123"`
```

完整模板见 `references/test-env-template.md`。

---

## 设计原则

1. 6 种方法论强制应用：等价类、边界值、判定表、场景法、状态迁移、错误推测。
2. REQ 验收标准必须 100% 映射到 TC。
3. `channel=e2e` 必须有且仅有一个 `e2e-exec`。
4. 不修改 §3 编码流程。
5. 不要求或建议业务代码增加 selector / data-testid。
6. CSV 与 Markdown 从同一批用例蓝本并行生成，不互相反解析。

---

## 参考文件

| 文件 | 用途 |
|---|---|
| `references/e2e-exec-schema.md` | `e2e-exec` 动作/断言契约 |
| `references/channel-playbooks.md` | e2e / visual / manual 写法 |
| `references/tc-doc-template.md` | TC-F 文档骨架 |
| `references/csv-export-schema.md` | CSV schema |
| `references/test-env-template.md` | `.test/.test-env.md` 模板 |
| `references/design-rules.md` | 测试设计方法论和自审规则 |
| `references/prd-format-handlers.md` | PRD 多格式加载规则 |
