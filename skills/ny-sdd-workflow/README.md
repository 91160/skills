# NY-SDD-Workflow

**SDD Workflow v3.7** — AI 编码工作流规则，编号重构（G 系列 + §1~§4）+ 流程声明头 + 动态加载架构，兼容多 AI 编码工具。

一条命令安装，统一团队 AI 编码规范。

---

## 是什么

NY-SDD-Workflow 是一套 **AI 编码工作流规则**，定义了从项目启动到业务开发的全流程规范：

- **G1 写码门禁**：AI 写代码前必须通过 6 项检查（项目初始化、需求文档、方案评审、Skill 安装、任务定位、铁律合规）
- **G2 停车信号**：5 类不确定场景自动暂停，等待用户裁决
- **Skill 路由**：按技术栈自动匹配公司级编码规范 Skill，强制执行日志 + coding-skill/audit-skill 双列状态追踪
- **技术文档**：`.docs/` 目录自动扫描识别，编码时必须以文档为准
- **任务拆分**：模块排序 + 依赖分析 + 子任务拆分 + 连续/逐个确认执行模式
- **需求变更**：PRD 变更 / 技术文档变更 / specs 变更三种触发源，统一级联处理
- **PRD 审计**：新项目 6 维度审计，单功能 4 维度审计
- **编码规约**：10 条编码规约（C-01~C-10）+ 7 条审计规约（S-01~S-07 含 UI 还原）+ 6 条自测项（T-01~T-06）
- **变更通道**：直通 / 快速 / 标准三通道，按变更类型自动路由
- **交付文档**：接口文档 / 审计报告 / 自测报告 / 执行报告 / 变更记录，按模块章节自动追加
- **多工具兼容**：一份规则文件，自动适配 8 款 AI 编码工具

---

## 架构：动态加载 + 流程声明头 + 前后端 Context 独立

### 为什么改

v3.4 将全部规则（1500+ 行）写入一个 AGENTS.md，导致：
- AI 注意力稀释（离文件开头越远的规则越容易被跳过）
- 每轮对话浪费 token 加载不相关的阶段规则
- 模板内容（profile/overview 共 300 行）每次对话都占用上下文

v3.6 的编号体系存在半整数（§2.4.5 / Step 6.5 / Step 7.5）、跳号空洞（§2.5~§2.7）、文件名-编号错位（phase-archive.md 用 §2.8）等问题，影响 AI 可读性和状态恢复精度。

### 怎么改

v3.7 引入两套编号体系 + 流程声明头机制：

- **G 系列**（AGENTS.md 始终加载）：G0 对话初始化 + G1 写码门禁 + G2 停车信号 + G3 未覆盖场景兜底
- **§ 系列**（phase-*.md 按需加载）：§1 项目启动 / §2 需求与设计 / §3 编码变更通道 / §4 归档
- **流程声明头**：每个 §N.N 章节顶部有一段「流程声明」引用块（phase/step/prev/next/gate/blocking），AI 按字段机械跳转，无需从正文推理

```
AGENTS.md（始终加载）
  │  G0 对话初始化 + G1 写码门禁 + G2 停车信号 + G3 未覆盖场景兜底 + 阶段路由表
  │
  ├── 判断当前阶段 → 按需读取对应文件（每个章节含流程声明头）：
  │
  │   rules/phase-init.md      §1 项目启动（§1.1~§1.5）
  │   rules/phase-spec.md      §2 需求与设计（§2.1~§2.6）
  │   rules/phase-coding.md    §3 编码变更通道（§3.0~§3.11）
  │   rules/phase-archive.md   §4 归档
  │
  ├── 审计/Skill 时按需读取：
  │
  │   rules/quality-standards.md  审计标准（PRD/REQ/DES/代码/自测）
  │   rules/skill-routing.md      Skill 路由表
  │
  └── 初始化时按需读取：

      templates/project-profile.tpl.md   project-profile.md 模板
      templates/project-overview.tpl.md  project-overview.md 模板
```

### 效果对比

| 场景 | v3.4 加载量 | v3.7 加载量 |
|------|-----------|-----------|
| 每轮对话固定 | 1501行 | **AGENTS.md 核心规则** |
| 编码阶段 | 1501行 | AGENTS.md + phase-coding.md |
| 初始化阶段 | 1501行 | AGENTS.md + phase-init.md |
| 审计时追加 | 0（已在内） | quality-standards.md |

### 路径解析机制

AGENTS.md 模板中用 `{SKILL_DIR}` 占位符引用阶段文件。安装时 cli.js 自动替换为实际路径：

- 项目内安装 → 相对路径：`.agents/skills/ny-sdd-workflow`
- 全局安装 → 绝对路径：`/Users/xxx/.claude/skills/ny-sdd-workflow`

安装后 AGENTS.md 中的路径是写死的真实值，AI 可直接读取，无额外 symlink。

### 兼容性

| AI 工具 | 读取范围 | 说明 |
|---------|---------|------|
| Claude Code / Codex | AGENTS.md + 阶段文件（含流程声明头） | 支持动态读取 + 声明头机械跳转，完整体验 |
| Cursor / Copilot / 其他 | 仅 AGENTS.md（G 系列 + 阶段路由表） | G0 对话初始化 + G1 门禁 + G2 停车已足够保障基本流程 |

---

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
1. 将 `AGENTS.md`（G 系列核心规则 + 编号流程规约）写入项目根目录，路径自动解析
2. 创建各 AI 工具的指令文件 symlink
3. 输出初始化状态报告

### 方式 2：通过 npx CLI 安装

```bash
# 初始化（全选同步所有 AI 工具）
npx @nykj/ny-sdd-workflow init --tools=A

# 初始化（仅 Cursor + Copilot）
npx @nykj/ny-sdd-workflow init --tools=1,2

# 初始化（不同步，仅 AGENTS.md）
npx @nykj/ny-sdd-workflow init --tools=N
```

---

## 使用

### Skills 方式（AI 对话中）

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

## Skill 目录结构

```
ny-sdd-workflow/                         ← Skill 安装目录
├── SKILL.md                             ← AI 读取的安装逻辑
├── bin/cli.js                           ← CLI 入口
├── package.json
├── rules/                               ← 阶段规则文件（AI 按需读取，含流程声明头）
│   ├── phase-init.md                    ← §1 项目启动（§1.1~§1.5）
│   ├── phase-spec.md                    ← §2 需求/设计/评审（§2.1~§2.6）
│   ├── phase-coding.md                  ← §3 编码变更通道（§3.0~§3.11）
│   ├── phase-archive.md                 ← §4 归档
│   ├── quality-standards.md             ← 审计标准（PRD/REQ/DES/代码/自测）
│   ├── skill-routing.md                 ← Skill 路由表 + 执行流程
│   └── fallback/                        ← 兜底扫描（context skill 不可用时）
│       ├── frontend-scan.md             ← 前端内置扫描
│       └── backend-scan.md              ← 后端内置扫描
└── templates/                            ← 模板文件
    ├── AGENTS.md                         ← 核心规则模板（含 {SKILL_DIR} 占位符）
    ├── project-profile.tpl.md            ← project-profile.md 模板（仅项目级）
    └── project-overview.tpl.md           ← project-overview.md 模板
```

## 项目目录结构（安装后）

```
项目根目录/
├── AGENTS.md                          ← G 系列核心规则 + 编号流程规约（路径已解析）
├── .project/                          ← 项目管理目录（AI 自动创建维护）
│   ├── context.md                     ← 每次对话必读，AI 自动维护
│   ├── task.md                        ← 子任务进度跟踪
│   ├── specs/
│   │   ├── master/
│   │   │   ├── index.md               ← 模块状态总览
│   │   │   ├── requirements/REQ-*.md
│   │   │   └── design/DES-*.md
│   │   ├── change-log-specs.md
│   │   └── rules/
│   │       ├── project-profile.md     ← 项目级（铁律/技术栈/外部依赖/业务架构）
│   │       ├── frontend-context.md    ← 前端规范（context skill 产出）
│   │       ├── backend-context.md     ← 后端规范（context skill 产出）
│   │       └── unit-test-base.md      ← [可选] 自测规则
│   ├── changelog/
│   └── reverse-scan/                  ← [可选] 深度扫描产出（reverse-scan Skill）
│       ├── knowledge-cards/           ← 知识卡片
│       ├── call-graph.md              ← 调用关系图
│       ├── module-map.md              ← 模块地图
│       ├── db-schema.md               ← 数据库结构
│       ├── specs/                     ← 已有模块 REQ/DES（逆向，仅供参考）
│       ├── profile-patch.md           ← 合并就绪：业务架构 + 业务流程
│       ├── overview.md                ← 合并就绪：项目全景文档
│       ├── api-doc.md                 ← 合并就绪：全量接口文档
│       └── scan-summary.md            ← 扫描报告 + context 记录段
├── .docs/                             ← 用户提供的文档
│   ├── prd/                           ← PRD 需求文档 + 原型图
│   └── tech/                          ← 技术文档（API/建表脚本/配置等）
├── .outdocs/                          ← 交付文档输出
│   ├── project-overview.md
│   ├── api-doc.md
│   ├── audit-report.md
│   ├── test-report.md
│   ├── task-report.md
│   └── prd-change-log.md
└── .agents/skills/                    ← Skill 安装目录
    ├── ny-sdd-workflow/               ← 本工作流（rules/ + templates/）
    └── reverse-scan/                  ← [可选] 深度代码扫描 Skill
```

---

## 工作流概览

```
G0 对话初始化（AGENTS.md，始终加载）
  → G0.1 项目类型确认（A 新项目 / B 旧项目需求 / C Bug / D 优化）
  → G0.2 目录骨架初始化
  → G0.3 文档补充确认（.docs/prd/ 和 .docs/tech/）
  → G0.4 状态恢复（读取 context.md / task.md / project-profile.md）
  → G0.5 阶段路由（判断进入 §1 / §2 / §3 / §4）

G1 写码门禁（AGENTS.md，编码前触发）
  → 6 项检查：.project 初始化 / REQ+DES approved / 依赖就绪 / Skill 就位 / 子任务 pending / 铁律合规

G2 停车信号（AGENTS.md，全局触发）
  → 5 类场景：路由不确定 / 影响面超预期 / 循环超限 / 规则冲突 / 未覆盖场景

G3 未覆盖场景兜底（AGENTS.md，全局触发）

───────────────────────────────────────────────

§1 项目启动（rules/phase-init.md，按需加载）
  → §1.1 新项目流程：PRD 审计(Skill) → 扫描 .docs/ → 技术栈 → 脚手架(Skill) → §2.1
  → §1.2 旧项目流程：扫描代码 → 提取架构/规范/公共能力 → §1.4 深度扫描 → feature → §2.1 / bug·refactor → §2.2
  → §1.3 前后端规范提取（context Skill 或 fallback 兜底）
  → §1.4 深度业务代码扫描（reverse-scan Skill，仅旧项目）
  → §1.5 技术文档处理规则（.docs/ 自动扫描）

§2 需求与设计（rules/phase-spec.md，按需加载）
  → §2.1 任务拆分（模块排序 → 子任务拆分 → task.md → 执行模式）
  → §2.2 需求分析（REQ + 自审）
  → §2.3 方案设计（DES + api-doc.md 追加 + 自审）
  → §2.4 原型生成（仅 feature + 前端）
  → §2.5 评审（人工）→ review-status: approved
  → §2.6 Spec Sync（随时触发：specs/PRD/技术文档 三种触发源）

§3 编码变更通道（rules/phase-coding.md，按需加载）
  → §3.0 通道判断
     · 直通：不涉及代码，直接回答
     · 快速：仅样式/文案，§3.1 → 改代码 → §3.9 → §3.10 → §3.11
     · 标准：§3.1~§3.11 完整执行
  → §3.1  加载规范 + 铁律（§3.1.1 铁律检查 / §3.1.2 已有代码认知 / §3.1.3 编码上下文 / §3.1.4 UI 上下文）
  → §3.2  加载 Spec（sync-status + coding-skill + audit-skill）
  → §3.3  文档学习（优先 .docs/）
  → §3.4  影响面评估（6 维度）
  → §3.5  代码变更（Skill + 执行日志 + C-01~C-10 + U-01~U-06）
  → §3.6  代码审计（Skill + S-01~S-07 → audit-report.md）
  → §3.7  开发自测（T-01~T-06 → test-report.md）
  → §3.8  更新 task.md
  → §3.9  生成 Changelog
  → §3.10 Spec 状态同步
  → §3.11 写入 context.md

§4 归档（rules/phase-archive.md，按需加载）
  → 12 项检查清单
  → 生成 task-report.md
  → 衔接下一模块（连续模式 / 逐个确认模式）
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

## 升级到 v3.7

### 变更摘要

| 项目 | v3.6 | v3.7 |
|------|------|------|
| 编号体系 | §0/§0.5/§0.6/§1/§2/§2.0/§2.4.5/§2.8/§3 + Step 0~8（含 Step 6.5/7.5） | G0~G3 全局规则 + §1~§4 阶段编号 + §3.0~§3.11 编码步骤 |
| 半整数 | §2.4.5 / Step 6.5 / Step 7.5 | **全部消灭** |
| 跳号空洞 | §2.5~§2.7 | **全部消灭** |
| 文件名-编号 | phase-archive.md 编号为 §2.8 | phase-archive.md = §4（完全对齐） |
| 流程声明头 | 无 | 每个 §N.N 章节顶部带 phase/step/prev/next/gate/blocking 元数据 |
| AI 跨阶段跳转 | 依赖正文推理 | 按声明头 `next` 字段机械跳转 |
| 门禁触发 | 依赖 AI 记忆 | 声明头 `gate` 字段自动绑定 |

### 升级步骤

```bash
# 1. 更新 skill
npx skills add https://git.nykjsrv.cn/ai-coding/skills.git --skill ny-sdd-workflow --yes

# 2. 更新 AGENTS.md
npx @nykj/ny-sdd-workflow update

# 或在 AI 对话中说 "更新工作流"
```

升级后：
- AGENTS.md 自动替换为 v3.7 版本（含编号流程规约 + G 系列全局规则），旧版备份为 `AGENTS.md.bak`
- 已有的 `.project/` 目录和数据不受影响
- symlink 自动指向新 AGENTS.md

### 注意事项

- v3.7 的 AGENTS.md 依赖 skill 目录中的 `rules/` 文件。如果 skill 被删除，AI 会提示"文件不存在"
- 其他 AI 工具（Cursor/Copilot 等）只能读取 AGENTS.md 中的 G 系列核心规则（G0 对话初始化 + G1 门禁 + G2 停车 + G3 兜底），不会动态加载阶段文件及其流程声明头
- 完整体验需 Claude Code / Codex（支持动态加载 + 声明头机制）

---

## Skill 路由表

| 阶段 | 触发时机 | Skill | 兜底 |
|------|---------|-------|------|
| PRD 审计 | §1.1 / §1.2(feature) / §2.6[prd] | prd-audit | 6维度/4维度 |
| 后端项目初始化 | §1.1（仅新项目） | java-project-creator | 官方 CLI |
| 前端项目初始化 | §1.1（仅新项目） | wap-project-creator | 官方 CLI |
| 前端规范提取 | §1.3 前后端规范提取 | front-project-context | 内置前端扫描 |
| 后端规范提取 | §1.3 前后端规范提取 | back-project-context | 内置后端扫描 |
| 前端编码 | §3.5 代码变更（前端） | frontend-code-standards | C-01~C-10 |
| 后端编码 | §3.5 代码变更（后端） | java-coding | C-01~C-10 |
| 代码审计 | §3.6 代码审计 | code-audit | S-01~S-07 |
| 深度代码扫描 | §1.4 深度业务代码扫描 | reverse-scan | 浅层业务架构推断 |

Skill 执行流程（统一）：
```
检查 .agents/skills/{skill}/ 是否存在
  → 已存在 → 直接调用
  → 不存在 → 安装（npx skills add ... --yes）
    → 成功 → 调用 → 输出执行日志 → 更新 coding-skill / audit-skill
    → 失败 → 询问用户（手动安装/兜底）
```

---

## 交付文档（.outdocs/）

| 文件 | 写入时机 | 写入方式 |
|------|---------|---------|
| project-overview.md | §1.1 / §1.2 / §2.1 | 按模板生成，增量补充 |
| api-doc.md | §2.3 DES 完成后 | 从 DES 自动提取，按模块章节追加 |
| audit-report.md | §3.6 代码审计 | 按模块章节追加 |
| test-report.md | §3.7 开发自测 | 按模块章节追加 |
| task-report.md | §4 归档时 | 按模块章节追加执行摘要 |
| prd-change-log.md | §2.6 Spec Sync PRD 变更时 | 追加变更记录 |

---

## 常见问题

### Q: Windows 系统能用吗？

可以。Windows 不支持 symlink，CLI 会自动改用文件复制。更新时需重新执行 `npx @nykj/ny-sdd-workflow update`。

### Q: 已有 .cursorrules 等文件怎么办？

初始化时如果目标文件已存在且非 symlink，会跳过并提示。不会覆盖已有配置。

### Q: AGENTS.md 可以自定义吗？

可以。AGENTS.md 是源文件，修改后所有 symlink 自动同步。建议通过 `project-profile.md` 定义项目级铁律和规范，AGENTS.md 保持通用。

### Q: 如何更新到新版本？

```bash
# Skills 方式：更新 skill 后在对话中说"更新工作流"
npx skills update

# npx 方式：
npx @nykj/ny-sdd-workflow update
```

### Q: 和其他 Skill 是什么关系？

ny-sdd-workflow 是 **常驻工作流规则**（AGENTS.md 的 G 系列），其他 Skill 是 **按需触发的编码规范**。

```
ny-sdd-workflow        ← 常驻规则（AGENTS.md G 系列 + rules/ §1~§4 按需加载）
  ├── prd-audit             ← §1.1 / §1.2(feature) / §2.6[prd] 按需调用
  ├── java-project-creator  ← §1.1 按需调用（仅新项目）
  ├── wap-project-creator   ← §1.1 按需调用（仅新项目）
  ├── front-project-context ← §1.3 按需调用（前端规范提取）
  ├── back-project-context  ← §1.3 按需调用（后端规范提取）
  ├── frontend-code-standards  ← §3.5 按需调用（前端编码）
  ├── java-coding              ← §3.5 按需调用（后端编码）
  ├── code-audit               ← §3.6 按需调用（代码审计）
  └── reverse-scan             ← §1.4 按需调用（深度代码扫描）
```

### Q: Cursor/Copilot 只读 AGENTS.md，功能会缺失吗？

不会严重缺失。AGENTS.md 的 G 系列核心规则已包含最关键的机制：
- **G0 对话初始化**：项目类型确认、目录骨架、状态恢复、阶段路由
- **G1 写码门禁**：确保 AI 不会跳过需求/设计直接写代码
- **G2 停车信号**：确保 AI 在不确定时暂停而非猜测
- **G3 未覆盖场景兜底**：统一的未覆盖场景处理

这些机制覆盖了 80% 的常见问题。完整的阶段规则（§1~§4 编码步骤、流程声明头跳转、审计标准等）需要 Claude Code / Codex 的动态加载能力。

### Q: .docs/ 文档怎么放？

分两个子目录：
- `.docs/prd/` — PRD 需求文档 + 原型图（png/jpg/svg 等）
- `.docs/tech/` — 技术文档（API 文档、建表脚本、中间件配置等）

格式命名不限，可以多个文件也可以一个文件。AI 自动识别分类。

---

## 版本记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.7.0 | 2026-04-15 | **编号重构**：G 系列全局规则（G0 对话初始化 / G1 写码门禁 / G2 停车信号 / G3 未覆盖场景兜底）+ §1~§4 阶段编号 + §3.0~§3.11 编码步骤；**流程声明头机制**：每个 §N.N 章节顶部含 phase/step/prev/next/gate/blocking 六字段，AI 按声明头机械跳转；**消灭半整数**：§2.4.5/Step 6.5/Step 7.5 全部清零；**消灭跳号空洞**：§2.5~§2.7 不再存在；**文件名-编号对齐**：phase-archive.md = §4；**声明头闭环**：26 条 prev/next 路径全部双向闭合（含 §3.1↔§3.8 循环 + §3.1↔§3.9 快速通道分支 + §4→§2.2 feature 连续模式）；**非线性章节标记**：§1.5 技术文档处理规则 / §2.6 Spec Sync 标记为非线性（prev/next=none + 章节性质说明）；**blocking 字段语义校准**：统一为"主动询问用户并等待响应"语义；**context.md 状态标记规约**：关键节点追加记录时标注 `last: §N.N`，G0.4 状态恢复时 AI 按 last 字段精确定位，无需推理；**G1/G2 前缀全项目统一**：所有门禁/停车引用带前缀；**phase-coding.md 章节分隔线补齐** |
| v3.6.0 | 2026-04-03 | 动态加载架构 + profile 瘦身为项目级 + 前后端规范由 context skill 独立产出 + 删除 patterns/ + 内置扫描抽为 fallback/ + PRD 统一扫描 + UI 还原规则 U-01~U-06 + S-07 + {SKILL_DIR} 路径解析 |
| v3.4.0 | 2026-04-01 | 新增 project-profile 三区结构；模块架构索引+patterns；原型图处理；编码规约 C-01~C-10；代码审计 S-01~S-07 |
| v3.1.0 | 2026-03-30 | 新增 §1.4 技术文档（.docs/ 自动扫描+索引+编码时以文档为准） |
| v3.0.0 | 2026-03-30 | 新增 Skill 执行流程 + 执行日志 + coding-skill/audit-skill 状态管理；任务拆分；需求变更管理；交付文档；门禁 Skill 检查；多 AI 工具兼容 |
