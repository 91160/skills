# E2E Report Template

## Markdown 模板

```markdown
## E2E 测试报告（{YYYY-MM-DD}）

结论：{PASS/FAIL/PARTIAL/SKIP}
框架：Playwright
base_url：{base_url}
用例：{pass} 通过 / {fail} 失败 / {skip} 跳过 / {blocked} BLOCKED
执行覆盖率：{executed}/{total} = {executed_rate}
自动化覆盖率：{e2e_total}/{total} = {automation_rate}
P0 覆盖率：{p0_executed}/{p0_total} = {p0_rate}
执行命令：{command}
HTML 报告：.outdocs/e2e-report.html
结果模型：.test/e2e/results.json

| TC-ID | 模块 | 场景 | priority | channel | 结果 | 证据 |
|---|---|---|---|---|---|---|
{case_rows}

### 失败清单
{failures}

### BLOCKED 清单
{blocked}

### visual / manual 清单
{manual_visual}

### 运行环境
- config：.test/e2e/playwright.config.ts
- results：.test/e2e/results.json
- artifacts：.test/e2e/artifacts/
```

## HTML 报告要求

HTML 报告不是 Markdown 套壳，必须按“E2E 质量仪表盘”生成。报告必须是独立可打开文件，所有 CSS / JS 内联，不依赖外部 CDN、远程字体或远程图片。

### 数据来源

Markdown 与 HTML 必须来自同一份统一结果模型，避免统计不一致。结果模型至少包含：

```json
{
  "summary": {
    "status": "PASS|FAIL|PARTIAL|SKIP",
    "project": "",
    "generatedAt": "",
    "baseUrl": "",
    "command": "",
    "browser": "chromium",
    "headed": false,
    "durationMs": 0,
    "total": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "blocked": 0
  },
  "coverage": {
    "executed": 0,
    "total": 0,
    "executedRate": "0%",
    "e2eTotal": 0,
    "automationRate": "0%",
    "p0Executed": 0,
    "p0Total": 0,
    "p0Rate": "0%"
  },
  "environment": {
    "framework": "Playwright",
    "config": ".test/e2e/playwright.config.ts",
    "results": ".test/e2e/results.json",
    "artifacts": ".test/e2e/artifacts/",
    "runtimeSource": ".test/.test-env.md",
    "serviceOwner": "external|runner-started|not-started",
    "initialProbe": "",
    "startCommand": "",
    "startupStatus": "",
    "pollDurationMs": 0,
    "cleanup": ""
  },
  "cases": [
    {
      "id": "",
      "module": "",
      "title": "",
      "priority": "P0|P1|P2",
      "channel": "e2e|visual|manual",
      "status": "PASS|FAIL|SKIP|BLOCKED|MANUAL_VISUAL|VISUAL_FAIL",
      "durationMs": 0,
      "summary": "",
      "failure": "",
      "blockedReason": "",
      "artifacts": {
        "screenshot": "",
        "trace": "",
        "video": ""
      }
    }
  ],
  "skip": {
    "reason": "",
    "missing": [],
    "nextAction": ""
  }
}
```

敏感字段处理：
- 不展示 `vars.*` 的真实值。
- 账号类变量只展示变量名与状态：`present` / `missing` / `generated`。
- `token` / `password` / `secret` / `key` / `cookie` / `authorization` 字段必须脱敏为 `******`。

### 页面结构

HTML 必须包含以下 6 个区块，顺序固定：

1. **顶部总览 Header**
   - 项目名 / 报告标题
   - 生成时间
   - 结论 Badge：PASS / FAIL / PARTIAL / SKIP
   - `base_url`
   - 执行命令
   - 浏览器、headed/headless、耗时

2. **质量摘要 Dashboard**
   - 4 张指标卡：总用例、执行覆盖率、自动化覆盖率、P0 覆盖率
   - 每张卡必须包含数字、说明、小型状态标识

3. **风险分布**
   - pass / fail / skipped / blocked 统计
   - P0 / P1 / P2 统计
   - e2e / visual / manual 统计
   - 可以使用 CSS 横向条，不需要图表库

4. **失败与阻塞优先区**
   - FAIL 用例
   - P0 BLOCKED 用例
   - 服务启动失败 / `base_url` 不可达 / 配置缺失
   - 该区块在无失败和无阻塞时显示“无高优先级风险”

5. **用例明细**
   - 表格按风险优先排序：FAIL → P0 BLOCKED → BLOCKED → VISUAL_FAIL → PASS → SKIP / manual
   - 列：TC-ID、模块、场景、priority、channel、结果、耗时、摘要、证据
   - 长错误信息使用 `<details><summary>查看详情</summary>...</details>` 折叠
   - artifacts 使用相对路径链接，显示 screenshot / trace / video 标签

6. **运行环境与证据**
   - `.test/.test-env.md` 摘要（敏感值脱敏）
   - Playwright config 路径
   - results.json 路径
   - artifacts 路径
   - 服务探测 / 启动 / 轮询 / 清理摘要

### 视觉规范

- 页面背景：`#f5f7fb`
- 主内容最大宽度：`1180px`
- 主字体：`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- 卡片背景：`#ffffff`
- 卡片圆角：`8px`
- 边框：`#d8dee9`
- 正文颜色：`#263241`
- 弱文本：`#64748b`
- PASS：`#15803d`
- FAIL：`#b91c1c`
- PARTIAL / BLOCKED：`#b45309`
- SKIP / MANUAL：`#64748b`
- P0 风险必须使用浅红底或左侧红色强调线。
- 表格 header 必须 sticky；表格行使用轻微斑马纹。
- 移动端宽度不足时，用例表格可横向滚动；不得导致正文重叠。
- 禁止使用外部 CDN、远程字体、渐变装饰大背景、纯图片图表。

### HTML 骨架

生成 HTML 时必须遵循以下骨架，可扩展但不得删除核心区块：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>E2E 测试报告 - {status}</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --card: #ffffff;
      --border: #d8dee9;
      --text: #263241;
      --muted: #64748b;
      --pass: #15803d;
      --fail: #b91c1c;
      --partial: #b45309;
      --skip: #64748b;
    }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 28px 20px 48px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 18px; }
    .grid { display: grid; gap: 14px; }
    .summary-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 10px; font-weight: 700; font-size: 12px; }
    .badge.pass { color: var(--pass); background: #dcfce7; }
    .badge.fail { color: var(--fail); background: #fee2e2; }
    .badge.partial { color: var(--partial); background: #fef3c7; }
    .badge.skip { color: var(--skip); background: #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #f8fafc; z-index: 1; }
    tbody tr:nth-child(even) { background: #fbfdff; }
    .risk-p0 { border-left: 4px solid var(--fail); background: #fff7f7; }
    .muted { color: var(--muted); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
    @media (max-width: 760px) { .summary-grid { grid-template-columns: 1fr; } main { padding: 18px 12px 32px; } }
  </style>
</head>
<body>
  <main>
    <section class="card" id="overview">...</section>
    <section class="grid summary-grid" id="dashboard">...</section>
    <section class="card" id="risk-distribution">...</section>
    <section class="card" id="priority-risks">...</section>
    <section class="card" id="case-details">...</section>
    <section class="card" id="environment">...</section>
  </main>
</body>
</html>
```

### Runner SKIP HTML 页面

当 Runner 已进入执行阶段但因运行时配置、依赖、服务或环境问题导致 Playwright 未实际执行、结论为 `SKIP` 时，HTML 仍必须是完整页面，但内容重点改为：
- 第一屏显示 SKIP 原因
- 显示“未执行 Playwright”
- 显示缺失项清单
- 显示下一步建议
- 用例表可为空，但必须说明没有实际执行用例
- 运行环境区保留 `.test/.test-env.md`、`base_url`、`test_command`、服务探测状态

## Runner SKIP 报告要求

当 Runner 已进入执行阶段但 E2E 未能实际运行时，Markdown / HTML 仍必须生成，结论固定为 `SKIP`，并包含：
- SKIP 原因
- 未执行 Playwright 的说明
- 后续建议
- 若可判断，列出缺失项（如 `channel=e2e` / `e2e-exec` / `base_url` / `test_command` / 测试账号）
- `.test/.test-env.md` 缺失本身不是 SKIP 原因；只有文件无法创建 / 补全，或关键字段缺失且用户不提供时才写入 SKIP 原因

场景不适用、无必要、用户主动跳过、bug 修复、缺少 TC-F 等入口级不执行场景不调用 Runner，不生成 E2E 报告。
