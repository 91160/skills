# .project 目录结构（完整参考）

> 本文件是 SDD Workflow 工作目录的**完整结构图**。AGENTS.md 仅保留概览，详细结构在此。
>
> AI 按需读取：用户询问目录结构 / 需要追溯具体路径时 Read 本文件。日常执行流程**不依赖**本文件——各 phase-*.md 直接给出实际路径。

```
项目根目录/
├── .project/                          ← 项目管理目录
│   ├── context.md                     ← 每次对话必读，AI 自动维护
│   ├── task.md                        ← 子任务级进度跟踪
│   ├── specs/
│   │   ├── master/
│   │   │   ├── index.md               ← 模块状态总览
│   │   │   ├── requirements/
│   │   │   │   └── REQ-{xx}-{name}.md
│   │   │   ├── design/
│   │   │   │   └── DES-{xx}-{name}.md
│   │   │   └── prototypes/            ← §2.4 原型产出
│   │   │       └── {xx}-{模块名}/
│   │   │           ├── *.html         ← HTML 线框图（仅 PRD 无视觉内容时生成）
│   │   │           └── prototype-spec.md  ← 按页面基准来源表 + 交互流程 + 结构说明
│   │   ├── change-log-specs.md
│   │   └── rules/
│   │       ├── project-profile.md     ← 项目级（铁律/技术栈/外部依赖/业务架构）
│   │       ├── frontend-context.md    ← 前端规范（context skill 或 fallback 产出）
│   │       ├── backend-context.md     ← 后端规范（context skill 或 fallback 产出）
│   │       └── unit-test-base.md      ← [可选]
│   ├── changelog/
│   └── reverse-scan/              ← [可选] 深度扫描产出（reverse-scan Skill）
│       ├── knowledge-cards/       ← 知识卡片（逐文件函数级）
│       ├── call-graph.md          ← 全局调用关系图
│       ├── module-map.md          ← 模块地图
│       ├── db-schema.md           ← 数据库结构
│       ├── specs/requirements/    ← 已有模块 REQ（逆向，仅供参考）
│       ├── specs/design/          ← 已有模块 DES（逆向，仅供参考）
│       ├── profile-patch.md       ← 合并就绪：业务架构 + 业务流程
│       ├── overview.md            ← 合并就绪：项目全景文档
│       ├── api-doc.md             ← 合并就绪：全量接口文档
│       ├── verification-report.md
│       ├── grey-decisions.md
│       └── scan-summary.md
├── .docs/
│   ├── prd/                           ← PRD 文字需求（md/pdf）
│   │   ├── prototype/                 ← 原型图（线框图）
│   │   ├── ui/                        ← UI 设计稿（高保真）
│   │   └── ui-spec/                   ← UI 解析文件（md 格式）
│   └── tech/                          ← 技术文档
├── .test/                                 ← 测试产出根目录（独立于 .project）
│   ├── .test-env.md                       ← 测试运行环境声明（§2.7 / §3.7.1 首次进入时按需生成 + 自动扫描项目配置补全；§4 E2E 缺失时可创建/补全并读取 e2e.* / vars.* / selectors.*）
│   ├── testcases/                         ← §2.7 功能测试用例（test-case-design 产出）
│   │   ├── TC-F-{xx}-{模块}.md            ← 按模块分文件
│   │   ├── testcases.detailed.csv         ← 全局汇总（所有模块追加）
│   │   └── testcases.traditional.csv
│   ├── unit/                              ← §3.7 单元测试（unit-test-generator 产出）
│   │   ├── UT-{xx}-{模块}.md              ← 单测用例文档
│   │   ├── skeleton/                      ← 单测代码骨架（原件，不删除）
│   │   │   ├── *.jest.ts / *.junit.java / ...
│   │   │   └── fixtures/*.json
│   │   └── report.md                      ← 单元测试模块级执行报告（§3.7.1）
│   └── e2e/                               ← §4 全部归档后 E2E 附加验收（e2e-test-runner 产出，仅实际执行时生成）
│       ├── E2E-PLAN.md                    ← 执行计划
│       ├── playwright.config.ts           ← Playwright 配置
│       ├── results.json                   ← 统一结果模型
│       ├── data/                          ← 测试数据（含 generated-data.json）
│       ├── specs/                         ← 生成的 Playwright spec（含 helpers/）
│       ├── artifacts/                     ← 截图/trace/video 证据
│       ├── report.md                      ← E2E 模块级报告
│       └── report.html                    ← E2E HTML 报告
├── .outdocs/
│   ├── project-overview.md
│   ├── api-doc.md
│   ├── audit-report.md
│   ├── unit-test-report.md
│   ├── e2e-report.md                      ← §4 E2E 报告（仅实际执行 E2E 时生成）
│   ├── e2e-report.html                    ← §4 E2E HTML 报告（仅实际执行 E2E 时生成）
│   ├── task-report.md
│   └── prd-change-log.md
└── .agents/skills/                    ← ny-sdd-workflow 安装目录（所有子 Skill 已内置在 tools/ 下）
```
