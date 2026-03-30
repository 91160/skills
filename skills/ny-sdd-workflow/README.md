# NY-SDD-Workflow

**SDD Workflow v3.1** — AI 编码工作流规则，兼容多 AI 编码工具。

一条命令安装，统一团队 AI 编码规范。

---

## 是什么

NY-SDD-Workflow 是一套 **AI 编码工作流规则**，定义了从项目启动到业务开发的全流程规范：

- **写码门禁**：AI 写代码前必须通过 4 项检查（项目初始化、需求文档、方案评审、Skill 安装）
- **Skill 路由**：按技术栈自动匹配公司级编码规范 Skill，强制执行日志 + skill-status 追踪
- **技术文档**：`.docs/` 目录自动扫描识别，编码时必须以文档为准
- **任务拆分**：模块排序 + 依赖分析 + 子任务拆分 + 连续/逐个确认执行模式
- **需求变更**：PRD 变更 / 技术文档变更 / specs 变更三种触发源，统一级联处理
- **PRD 审计**：新项目 6 维度审计，单功能 4 维度审计
- **编码规约**：10 条编码规约（C-01~C-10）+ 5 条审计规约（S-01~S-05）+ 6 条自测项（T-01~T-06）
- **变更通道**：直通 / 快速 / 标准三通道，按变更类型自动路由
- **交付文档**：接口文档 / 审计报告 / 自测报告 / 执行报告 / 变更记录，按模块章节自动追加
- **多工具兼容**：一份规则文件，自动适配 8 款 AI 编码工具

## 支持的 AI 工具

| 工具 | 指令文件位置 | 对接方式 |
|------|------------|---------|
| Claude Code | `AGENTS.md` | 原生读取 |
| OpenAI Codex | `AGENTS.md` | 原生读取 |
| Cursor | `.cursor/rules/ny-sdd-workflow.md` | symlink |
| GitHub Copilot | `.github/copilot-instructions.md` | symlink |
| Cline | `.clinerules` | symlink |
| Windsurf | `.windsurfrules` | symlink |
| Augment | `.augment/rules/ny-sdd-workflow.md` | symlink |
| Continue | `.continue/rules/ny-sdd-workflow.md` | symlink |

---

## 安装

### 方式 1：通过 Skills 体系安装（推荐）

```bash
npx skills add https://git.nykjsrv.cn/ai-coding/skills.git --skill ny-sdd-workflow --yes
```

安装后在 AI 对话中说 **"初始化工作流"**，AI 会自动：
1. 将 `AGENTS.md` 写入项目根目录
2. 创建各 AI 工具的指令文件 symlink
3. 输出初始化状态报告

### 方式 2：通过 npx CLI 安装

```bash
npx @nykj/ny-sdd-workflow init
```

无需 AI 对话，直接在终端执行，效果相同。

---

## 使用

### Skills 方式（AI 对话中）

安装 skill 后，在 AI 对话中使用以下指令：

| 说法 | 触发操作 |
|------|---------|
| "初始化工作流" / "安装 SDD" | 初始化（生成 AGENTS.md + symlink） |
| "更新工作流" / "更新 SDD" | 更新 AGENTS.md 到最新版本 |
| "查看工作流状态" | 检查各工具安装情况 |
| "卸载工作流" | 清理 symlink（保留 AGENTS.md） |

### npx CLI 方式（终端中）

```bash
npx @nykj/ny-sdd-workflow init      # 初始化
npx @nykj/ny-sdd-workflow update    # 更新
npx @nykj/ny-sdd-workflow status    # 查看状态
npx @nykj/ny-sdd-workflow remove    # 卸载
```

---

## 项目目录结构

```
项目根目录/
├── AGENTS.md                          ← 源文件（Claude Code / Codex 原生读取）
├── .project/                          ← 项目管理目录
│   ├── context.md                     ← 每次对话必读，AI 自动维护
│   ├── specs/
│   │   ├── master/
│   │   │   ├── index.md               ← 模块状态总览（depends/dev-order/sync-status/skill-status）
│   │   │   ├── requirements/
│   │   │   │   └── REQ-{xx}-{name}.md
│   │   │   └── design/
│   │   │       └── DES-{xx}-{name}.md
│   │   ├── change-log-specs.md        ← specs 变更审计日志
│   │   └── rules/
│   │       ├── project-custom.md      ← 项目铁律 + 技术栈 + 项目规范 + 外部依赖
│   │       └── unit-test-base.md      ← [可选] 开发自测规则
│   └── changelog/
├── .docs/                             ← 用户提供的技术文档，格式命名不限（AI 自动识别）
│   └── *.md / *.sql / *.pdf / ...
├── .outdocs/                          ← 交付文档输出目录（按模块章节追加）
│   ├── api-doc.md                     ← 接口文档
│   ├── audit-report.md                ← 代码审计报告
│   ├── test-report.md                 ← 开发自测报告
│   ├── task-report.md                 ← 任务执行报告
│   └── prd-change-log.md              ← PRD 需求变更记录
├── .agents/skills/                    ← Skill 安装目录
├── .cursor/rules/ny-sdd-workflow.md   → AGENTS.md (symlink)
├── .github/copilot-instructions.md    → AGENTS.md (symlink)
├── .clinerules                        → AGENTS.md (symlink)
├── .windsurfrules                     → AGENTS.md (symlink)
├── .augment/rules/ny-sdd-workflow.md  → AGENTS.md (symlink)
└── .continue/rules/ny-sdd-workflow.md → AGENTS.md (symlink)
```

---

## .gitignore 配置

```gitignore
# SDD Workflow symlink（由 ny-sdd-workflow 生成，不提交）
.cursorrules
.clinerules
.windsurfrules

# AGENTS.md 需要提交（源文件）
# .cursor/rules/ 和 .github/ 目录下的 symlink 按团队约定决定是否提交
```

---

## 工作流概览

```
§0 对话开始
  → 确认项目类型（新项目 / 旧项目 + 需求类型）
  → 读取 context.md 恢复状态

§1 项目启动
  → §1.1 新项目：PRD审计(Skill) → 扫描.docs/ → 技术栈 → 外部依赖 → 脚手架(Skill) → §2.0
  → §1.2 旧项目：扫描.docs/ → 读代码 → 识别规范 → 人工确认
    → feature → §2.0 / bug·refactor → §2.1

§2 业务开发循环（每个需求迭代一轮）
  → §2.0 任务拆分（仅 feature：排序 → 拆分 → 写入 → 执行模式）
  → §2.1 需求分析（REQ + prd-audit Skill）
  → §2.2 方案设计（DES + api-doc.md 追加）
  → §2.3 原型生成（仅 feature + 前端）
  → §2.4 评审（人工）
  → §2.4.5 需求变更（随时触发：specs/PRD/技术文档 三种触发源）
  → §2.5 开发 → §3 变更通道
  → §2.8 归档 → task-report.md + 衔接下一模块

§3 变更通道
  → 直通：不涉及代码，直接回答
  → 快速：仅样式/文案，Step 0 → 改代码 → Step 7/7.5/8
  → 标准：Step 0~8 完整执行
     Step 0  检查铁律
     Step 1  加载 Spec（sync-status + skill-status）
     Step 2  文档学习（优先 .docs/）
     Step 3  评估影响面
     Step 4  编码（Skill + 执行日志 + skill-status）→ C-01~C-10
     Step 5  代码审计（Skill + 执行日志）→ audit-report.md → S-01~S-05
     Step 6  开发自测 → test-report.md → T-01~T-06
     Step 7  Changelog
     Step 8  context.md
```

---

## Skill 路由表

| 阶段 | 触发时机 | Skill | 兜底 |
|------|---------|-------|------|
| PRD 审计 | §1.1 / §2.1 | prd-audit | 6维度/4维度 |
| 后端项目初始化 | §1.1（仅新项目） | java-project-creator | 官方 CLI |
| 前端项目初始化 | §1.1（仅新项目） | wap-project-creator | 官方 CLI |
| 前端编码 | §3 Step 4 | vant-vue3 | C-01~C-10 |
| 后端编码 | §3 Step 4 | java-coding | C-01~C-10 |
| 代码审计 | §3 Step 5 | code-audit | S-01~S-05 |

Skill 执行流程（统一）：
```
检查 .agents/skills/{skill}/ 是否存在
  → 已存在 → 直接调用
  → 不存在 → 安装（npx skills add ... --yes）
    → 成功 → 调用 → 输出执行日志 → 更新 skill-status
    → 失败 → 询问用户（手动安装/兜底）
```

---

## 交付文档（.outdocs/）

| 文件 | 写入时机 | 写入方式 |
|------|---------|---------|
| api-doc.md | §2.2 DES 完成后 | 从 DES 自动提取，按模块章节追加 |
| audit-report.md | §3 Step 5 | 按模块章节追加 |
| test-report.md | §3 Step 6 | 按模块章节追加 |
| task-report.md | §2.8 归档时 | 按模块章节追加执行摘要 |
| prd-change-log.md | §2.4.5 PRD 变更时 | 追加变更记录 |

---

## 技术文档（.docs/）

用户将技术文档放入 `.docs/`，格式命名不限，AI 自动识别分类。

- 有文档 → 编码时必须以文档为准，禁止编造
- 无文档 → 按现有规则链处理（project-custom > Skill > 内置规约）
- 文档变更 → 通过 §2.4.5 触发源 C 级联更新 DES 和代码

---

## 常见问题

### Q: Windows 系统能用吗？

可以。Windows 不支持 symlink，CLI 会自动改用文件复制。更新时需重新执行 `npx @nykj/ny-sdd-workflow update`。

### Q: 已有 .cursorrules 等文件怎么办？

初始化时如果目标文件已存在且非 symlink，会跳过并提示。不会覆盖已有配置。

### Q: AGENTS.md 可以自定义吗？

可以。AGENTS.md 是源文件，修改后所有 symlink 自动同步。建议通过 `project-custom.md` 定义项目级铁律和规范，AGENTS.md 保持通用。

### Q: 如何更新到新版本？

```bash
# Skills 方式：更新 skill 后在对话中说"更新工作流"
npx skills update

# npx 方式：
npx @nykj/ny-sdd-workflow update
```

### Q: 和其他 Skill 是什么关系？

ny-sdd-workflow 是 **常驻工作流规则**（AGENTS.md），其他 Skill 是 **按需触发的编码规范**。

```
ny-sdd-workflow        ← 常驻规则（AGENTS.md）
  ├── prd-audit        ← §1.1 / §2.1 按需调用
  ├── java-project-creator  ← §1.1 按需调用（仅新项目）
  ├── wap-project-creator   ← §1.1 按需调用（仅新项目）
  ├── vant-vue3        ← §3 Step4 按需调用（前端编码）
  ├── java-coding      ← §3 Step4 按需调用
  └── code-audit       ← §3 Step5 按需调用
```

### Q: .docs/ 文档怎么放？

任意格式、任意命名、任意数量。可以多个文件分门别类，也可以一个文件包含所有内容。AI 自动识别分类。

---

## 版本记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.1.0 | 2026-03-30 | 新增 §1.4 技术文档（.docs/ 自动扫描+索引+编码时以文档为准） |
| v3.0.0 | 2026-03-30 | 新增 Skill 执行流程 + 执行日志 + skill-status；任务拆分；需求变更管理；交付文档；门禁 Skill 检查；前端脚手架 Skill；多 AI 工具兼容 |
