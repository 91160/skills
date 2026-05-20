# e2e-test-runner

SDD Workflow 的 §4 后置 E2E 测试 Skill。

## 定位

- 输入：`.test/testcases/TC-F-*.md` 中的 `channel=e2e` + `e2e-exec`
- 配置：缺少 `.test/.test-env.md` 时自动创建 / 补全安全默认字段；`base_url`、`test_command`、账号类 `vars.*` 不能猜测，必须来自用户填写或确认
- 服务：先探测 `base_url`，不可达时使用 `e2e.start_command` 或 AI 自动推断的可信候选命令启动，只清理本 Runner 启动的服务
- 运行：Playwright only
- 输出：`.outdocs/e2e-report.md` + `.outdocs/e2e-report.html`

## 不做

- 不支持 Cypress
- 不覆盖小程序、原生 App、桌面客户端（含 Electron）
- 不修改业务代码
- 不要求或建议业务代码增加 selector / data-testid

## 默认产物

以下产物仅实际执行 E2E 时生成；入口级不执行场景只记录 SKIP 留痕，不生成 E2E 报告。

```text
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
