# NY-SDD-Workflow

**SDD Workflow v1.0.4** — AI 编码工作流规则，G 系列全局规则 + §1~§4 阶段编号 + 流程声明头机制（含四值 blocking 防偷懒）+ 动态加载架构 + 执行自审统一机制 + 14 个 Slash Commands，兼容多 AI 编码工具。

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
- **编码规约**：10 条编码规约（C-01~C-10）+ 8 条审计规约（S-01~S-08 含 UI 还原 + 功能完整性）+ 6 条自测项（T-01~T-06）
- **变更通道**：直通 / 快速 / 标准三通道，按变更类型自动路由
- **交付文档**：接口文档 / 审计报告 / 自测报告 / 执行报告 / 变更记录，按模块章节自动追加
- **多工具兼容**：一份规则文件，自动适配 8 款 AI 编码工具
- **Slash Commands**：14 个 slash 命令显式触发关键流程与工具（`/sdd-init` 安装、`/sdd-start` 开发、`/sdd-prd-change`、`/sdd-bug-fix` 等），支持用户级 / 项目级两种安装位置

---

## 3 分钟快速上手

### 首次安装

```bash
# 1. 拉取 skill 包到 ~/.claude/skills/ny-sdd-workflow/
npx skills add https://github.com/91160/skills.git --skill ny-sdd-workflow --yes
```
```
# 2. 在 AI 对话中触发安装（首次必须用自然语言，slash 命令此时还没装）
你说："安装 SDD"

   AI 会：
   ① 写入 AGENTS.md 到项目根
   ② 询问要同步到哪些 AI 工具（Cursor / Copilot / ...）
   ③ 询问 slash commands 安装位置（推荐：用户级 ~/.claude/commands/）
   ④ 输出初始化报告
```

> **CI/CD 自动化场景**：可走"本地 CLI 方式"——`git clone` skill 仓库后用 `node <SDD_DIR>/bin/cli.js init`，详见下方"安装 → 方式 2"。

> **非 Claude Code / Codex 工具的初次安装**：Cursor / GitHub Copilot / Cline / Windsurf / Augment / Continue 等只读 AGENTS.md 的工具**不支持自然语言触发兜底安装**（它们不是 Skill 系统，无法消费 SKILL.md）。这些工具的首次安装必须走 **CLI 方式**：
> ```bash
> git clone <skill 仓库> ~/.sdd-skills/ny-sdd-workflow
> node ~/.sdd-skills/ny-sdd-workflow/bin/cli.js init
> ```
> 安装完成后 AGENTS.md 已就位，Cursor / Copilot 等工具可正常读取核心规则（G0~G3 + 阶段速查表 + 触发约束）。**自然语言触发兜底安装 + 自动接续 G0 仅在 Claude Code / Codex 下生效**（这两个工具支持动态加载 SKILL.md + phase-*.md，可实现完整体验）。

### 启动开发

```
# 3. 进入开发流程
你说："启动工作流"  或  /sdd-start

   AI 按 G0 路由：
   - 首次开发 → G0.1 项目类型确认 → 走 §1 项目初始化 → §2 需求设计 → §3 编码 → §4 归档
   - 已在开发中 → G0.4 状态恢复 → 继续上次进度
```

### 日常开发常用命令

| 场景 | 命令 / 自然语言 |
|---|---|
| 启动 / 恢复开发 | `/sdd-start` 或 "启动工作流" |
| PRD 需求变更 | `/sdd-prd-change` 或 "需求变了" |
| 当前需求 bug 修复 | `/sdd-bug-fix` 或 "这里有个 bug" |
| 单独触发 PRD 审计 | `/sdd-prd-audit` 或 "审计 PRD" |
| 单独触发功能测试用例设计 | `/sdd-test-case` |
| 单独触发自动化单测 | `/sdd-unit-test` |
| 更新 / 查看状态 / 卸载 | `/sdd-init` 或 "更新工作流" |

> **完整 14 命令清单见下方"使用 → Slash Commands"章节。**

### 你会看到的 AI 行为凭证（不是错误）

运行中 AI 会输出几类"凭证"，这是工作流的可见性机制，**不是错误**：

| 凭证类型 | 何时出现 | 示例 | 作用 |
|---|---|---|---|
| **流程声明头** | AI 进入每个 §N.N 章节前 | `【进入 §1.1 新项目流程】` <br> `> **流程声明**` <br> `> - phase: init` <br> `> - step: 1/5` <br> `> - prev/next/gate/blocking: {true/false/gated/audit-required}` | 证明 AI 知道当前阶段，按规约执行 |
| **Skill 执行日志** | AI 调用任何 Skill 前 | `【Skill 执行日志】` <br> `阶段: §1.1 新项目流程` <br> `Skill: prd-audit` <br> `路径: {SKILL_DIR}/tools/prd-audit/` <br> `执行: 调用Skill` | 证明 AI 真调了 Skill，没"凭通用知识脑补" |
| **Read 工具调用** | AI 主动按需读取 phase-*.md / SKILL.md / quality-standards.md | `Read({SKILL_DIR}/tools/prd-audit/SKILL.md)` | 证明 AI 真去读了规则文件 |
| **G0.1 推断+确认** | 你首条消息含项目特征时 | `【项目确认】基于你的描述，推断 A 新项目，请确认 A/B/C/D` | 防止 AI 跳过 G0.1 自作主张 |
| **上节产物回灌段**| 进入 §2.5 / §3.7 / §3.8 前 | `【上节产物回灌】执行 Bash: grep -n ... \| shasum -a 256 ...` + 粘贴回显原文 | 证明 §2.4 / §3.6 / §3.7 真完成；哈希对不上回滚上节 |
| **审计起手清单**| 进入 §3.6 前 | `【审计起手清单】怀疑点 1: 针对 S-01, src/foo.ts:42, 反向假设...` | 证明 §3.6 真做了审计，不是"代码符合预期"敷衍 |
| **context.md `produced` 字段**| 仅 §2.4 / §3.6 / §3.7 三章强制（§4 E2E 不写 produced，只写 `ref:` 续行，见编号规约第 8 条） | `produced: .outdocs/audit-report.md#01-用户认证-代码审计报告-2026-05-11 a1b2c3d4` | 下次对话开局校验哈希 + 锚点 |
| **执行自审输出**| 下次对话开局（后续路径） | `【执行自审】上次 last: §3.6 ... produced 字段: ✅ ... 哈希一致: ✅ ... 结论: ✅` | 跨对话发现敷衍 / 伪造产物 |

**怎么用这些凭证排查问题**：
- ❌ AI 没输出流程声明头就执行 §X.Y 动作 → 直接要求"请输出流程声明头再执行"
- ❌ AI 输出审计/扫描报告但没有 Skill 执行日志 → 要求"请按 skill-routing.md 的 Skill 调用强制约束 5 步走重做"
- ❌ AI 输出的声明头与 phase-*.md 真实头不符（如简化 prev/next 字段）→ 要求"请 Read phase-*.md 后修正声明头"
- ❌ AI 进入 §3.7 没回灌 §3.6 产物 → 要求"请按 gated 规约 cat 上节产物 + 哈希比对"
- ❌ AI 进入 §3.6 没输出起手清单 / 怀疑点 < 3 / 全 PASS 但无 finding 也无辩护 → 要求"请按 audit-required 规约重做"

---

## 架构：动态加载 + 流程声明头 + 前后端 Context 独立

### 设计思路

将规则拆为**核心 + 阶段文件**，AI 每次只加载当前阶段需要的规则，避免注意力稀释和 token 浪费。

本工作流采用两套编号体系 + 流程声明头机制：

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
  │   rules/phase-spec.md      §2 需求与设计（§2.1~§2.7）
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

### 加载效率

| 场景 | 加载量 |
|------|-------|
| 每轮对话固定 | **AGENTS.md 核心规则**（G 系列 + 规约 + 路由表） |
| 编码阶段 | AGENTS.md + phase-coding.md |
| 初始化阶段 | AGENTS.md + phase-init.md |
| 审计时追加 | quality-standards.md |

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
npx skills add https://github.com/91160/skills.git --skill ny-sdd-workflow --yes
```

安装后在 AI 对话中说 **"安装 SDD"**（**首次必须用自然语言**，因为 `/sdd-init` 等 slash 命令此时还未安装到 Claude Code），AI 会自动：
1. 将 `AGENTS.md`（G 系列核心规则 + 编号流程规约）写入项目根目录，路径自动解析
2. 创建各 AI 工具的指令文件 symlink
3. 询问 slash commands 安装位置（用户级 `~/.claude/commands/` / 项目级 `.claude/commands/` / 跳过）并安装
4. 输出初始化状态报告

完成后即可使用 14 个 slash 命令。下一步：在 AI 对话中说"启动工作流"或运行 `/sdd-start` 进入项目开发。

### 方式 2：本地 CLI（git clone 后，适合 CI/CD 自动化）

```bash
# 1. 克隆 skill 仓库到本地（路径自选，下方记为 <SDD_DIR>）
npx skills add https://github.com/91160/skills.git --skill ny-sdd-workflow --yes
# 上述命令会把 skill 装到 ~/.claude/skills/ny-sdd-workflow/，即 <SDD_DIR>=~/.claude/skills/ny-sdd-workflow

# 2. 在你的项目根目录运行本地 cli.js
cd /path/to/your-project
node <SDD_DIR>/bin/cli.js init --tools=A --commands=user

# 例如（macOS / Linux）：
node ~/.claude/skills/ny-sdd-workflow/bin/cli.js init --tools=A --commands=user

# 其他子命令同理：
node <SDD_DIR>/bin/cli.js init --tools=A --commands=project    # 项目级 slash 命令
node <SDD_DIR>/bin/cli.js init --tools=A                       # 仅 AGENTS + AI 工具
node <SDD_DIR>/bin/cli.js init --tools=1,2                     # 仅 Cursor + Copilot
node <SDD_DIR>/bin/cli.js init --tools=N                       # 不同步，仅 AGENTS.md
```

> **CI/CD 场景**：`--commands=user` 让 CLI 路径完整闭环，可纯脚本化部署 SDD（脚本里把 `<SDD_DIR>` 写死或从环境变量取）。
> **注意**：`@nykj/ny-sdd-workflow` 包**未发布到 npm registry**，不能用 `npx @nykj/ny-sdd-workflow` 直接调用——必须先把 skill 仓库 clone 到本地后用 `node <SDD_DIR>/bin/cli.js` 跑。

---

## 使用

### Skills 方式（AI 对话中）

| 说法 | 触发操作 |
|------|---------|
| "安装 SDD" / "安装工作流" / "安装 AGENTS" | 安装（生成 AGENTS.md + symlink + slash commands） |
| "启动工作流" / "开始开发" | 进入 G0 对话初始化（开始/恢复项目开发） |
| "更新工作流" / "更新 SDD" | 更新 AGENTS.md 到最新版本 |
| "查看工作流状态" | 检查各工具与 slash commands 安装情况 |
| "卸载工作流" | 清理 symlink（保留 AGENTS.md） |

> **注意**：`安装` 与 `启动` 是两件事——`安装` 是装"地基"（一次性），`启动` 是上"工地"（每次开始/恢复开发）。详见下方 Slash Commands 表格。

### 本地 CLI 方式（终端中，git clone 后）

设 skill 已装到 `<SDD_DIR>`（默认 `~/.claude/skills/ny-sdd-workflow`），在你的项目根目录运行：

```bash
node <SDD_DIR>/bin/cli.js init                          # 初始化（仅 AGENTS + AI 工具）
node <SDD_DIR>/bin/cli.js init --commands=user          # +装用户级 slash 命令
node <SDD_DIR>/bin/cli.js init --commands=project       # +装项目级 slash 命令

node <SDD_DIR>/bin/cli.js update                        # 更新 AGENTS.md
node <SDD_DIR>/bin/cli.js update --commands=user        # +补齐/重装用户级 slash 命令

node <SDD_DIR>/bin/cli.js status                        # 查看状态（含 slash commands）

node <SDD_DIR>/bin/cli.js remove                        # 卸载（默认仅清项目级 slash）
node <SDD_DIR>/bin/cli.js remove --commands=user        # +清理用户级 slash 命令
```

> 也可以用 `npx <SDD_DIR>` 调用（npx 支持本地路径），效果与 `node <SDD_DIR>/bin/cli.js` 等价。

### Slash Commands（推荐）

14 个 slash 命令显式触发本工作流的关键流程与工具。安装位置在 `/sdd-init` 时三选一：用户级（`~/.claude/commands/`，所有项目可见）/ 项目级（`.claude/commands/`，仅当前项目）/ 跳过（保留自然语言触发）。

#### 流程触发类（4 个）

| 命令 | 用途 | 等价自然语言 |
|------|------|------------|
| `/sdd-init` | 装"地基"：写入 AGENTS.md + AI 工具同步 + slash commands 安装；支持 A 初始化 / B 更新 / C 查看状态 / D 卸载 | "安装 SDD" |
| `/sdd-start` | 上"工地"：进入 G0 对话初始化（首次/后续路径自动判定） | "启动工作流" / "开始开发" |
| `/sdd-prd-change` | PRD 需求变动同步（§2.6 Spec Sync `[prd]`：审计 + 影响分析 + 级联更新 + 测试用例联动 + 留痕） | "需求变了" / "PRD 改了" / "新增模块" |
| `/sdd-bug-fix` | 当前开发过程中的 bug 修复（G0.4.1 二次判定 → §3.0 bug 修复回环；不新建 REQ/DES，复用 approved 文档） | "这里有个 bug"（在已 approved 模块开发期间） |

#### 工具触发类（10 个）

| 命令 | 对应 Skill | 绑定阶段 |
|------|-----------|---------|
| `/sdd-prd-audit` | prd-audit | §1.1 / §1.2(feature) / §2.6[prd] |
| `/sdd-front-context` | front-project-context | §1.3 前端规范提取 |
| `/sdd-back-context` | back-project-context | §1.3 后端规范提取 |
| `/sdd-frontend-standards` | frontend-code-standards | §3.5 前端代码变更 |
| `/sdd-java-create` | java-project-creator | §1.1 后端项目初始化 |
| `/sdd-wap-create` | wap-project-creator | §1.1 前端项目初始化 |
| `/sdd-reverse-scan` | reverse-scan | §1.4 深度业务代码扫描 |
| `/sdd-test-case` | test-case-design | §2.7 功能测试用例设计 |
| `/sdd-unit-test` | unit-test-generator | §3.7.1 自动化单测 |
| `/sdd-e2e-test` | e2e-test-runner | §4 全部模块归档后 E2E 测试 |

> 每个工具命令都内置**流程冲突保护**：手动调用与当前 `context.md` 阶段不一致时，AI 会让用户三选一（A 独立执行 / B 作为工作流一部分执行 / C 取消），避免污染工作流状态。

---

## Skill 目录结构

```
ny-sdd-workflow/                         ← Skill 安装目录
├── SKILL.md                             ← AI 读取的安装逻辑
├── bin/cli.js                           ← CLI 入口
├── package.json
├── .claude/commands/                    ← Slash Commands（由 /sdd-init 安装到用户级或项目级）
│   ├── sdd-init.md                      ← 流程：基础设施安装
│   ├── sdd-start.md                     ← 流程：进入 G0 对话初始化
│   ├── sdd-prd-change.md                ← 流程：§2.6 Spec Sync [prd]
│   ├── sdd-bug-fix.md                   ← 流程：G0.4.1 → §3.0 bug 修复回环
│   ├── sdd-prd-audit.md                 ← 工具：prd-audit
│   ├── sdd-front-context.md             ← 工具：front-project-context
│   ├── sdd-back-context.md              ← 工具：back-project-context
│   ├── sdd-frontend-standards.md        ← 工具：frontend-code-standards
│   ├── sdd-java-create.md               ← 工具：java-project-creator
│   ├── sdd-wap-create.md                ← 工具：wap-project-creator
│   ├── sdd-reverse-scan.md              ← 工具：reverse-scan
│   ├── sdd-test-case.md                 ← 工具：test-case-design
│   ├── sdd-unit-test.md                 ← 工具：unit-test-generator
│   └── sdd-e2e-test.md                  ← 工具：e2e-test-runner
├── rules/                               ← 阶段规则文件（AI 按需读取，含流程声明头）
│   ├── phase-init.md                    ← §1 项目启动（§1.1~§1.5）
│   ├── phase-spec.md                    ← §2 需求/设计/评审/功能测试（§2.1~§2.7）
│   ├── phase-coding.md                  ← §3 编码变更通道（§3.0~§3.11）
│   ├── phase-archive.md                 ← §4 归档
│   ├── quality-standards.md             ← 审计标准（PRD/REQ/DES/代码/自测）
│   ├── skill-routing.md                 ← Skill 路由表 + 执行流程 + Slash Commands 入口表（Skill 视角）
│   ├── slash-commands.md                ← Slash Commands 详细路由 + 流程冲突保护（命令视角，按需 Read）
│   ├── project-structure.md             ← .project 完整目录树状结构图（按需 Read）
│   └── fallback/                        ← 兜底扫描（context skill 不可用时）
│       ├── frontend-scan.md             ← 前端内置扫描
│       └── backend-scan.md              ← 后端内置扫描
├── tools/                                ← 内置 Skill（无需远程安装，AI 直接读取）
│   ├── prd-audit/                        ← PRD 审计
│   ├── java-project-creator/             ← 后端脚手架（仅新项目）
│   ├── wap-project-creator/              ← 前端脚手架（仅新项目）
│   ├── front-project-context/            ← 前端规范提取
│   ├── back-project-context/             ← 后端规范提取
│   ├── frontend-code-standards/          ← 前端编码规范
│   ├── reverse-scan/                     ← 深度代码扫描
│   ├── test-case-design/                 ← 功能测试用例设计（§2.7）
│   └── unit-test-generator/              ← 单元测试（§3.7）
└── templates/                            ← 模板文件
    ├── AGENTS.md                         ← 核心规则模板（含 {SKILL_DIR} 占位符 + Slash Commands 入口概览）
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
│   │   │   ├── design/DES-*.md
│   │   │   └── prototypes/            ← §2.4 原型产出（HTML + prototype-spec.md）
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
│   ├── prd/                           ← PRD 文字需求（md/pdf）
│   │   ├── prototype/                 ← 原型图（线框图 png/jpg/pdf）
│   │   ├── ui/                        ← UI 设计稿（高保真 png/jpg/pdf）
│   │   └── ui-spec/                   ← UI 解析文件（Figma/蓝湖导出 md）
│   └── tech/                          ← 技术文档（API/建表脚本/配置等）
├── .test/                             ← 测试产出根目录（独立于 .project）
│   ├── .test-env.md                   ← 测试运行环境声明（§2.7 / §3.7.1 首次进入时按需生成 + 自动扫描项目配置补全；§4 E2E 缺失时可创建/补全并读取 e2e.* / vars.* / selectors.*）
│   ├── testcases/                     ← §2.7 功能测试用例（TC-F-*.md + CSV）
│   └── unit/                          ← §3.7 单元测试（UT-*.md + skeleton/ + report.md）
├── .outdocs/                          ← 交付文档输出
│   ├── project-overview.md
│   ├── api-doc.md
│   ├── audit-report.md
│   ├── unit-test-report.md
│   ├── task-report.md
│   └── prd-change-log.md
├── .claude/                           ← Claude Code 配置（项目级 slash commands 时存在）
│   └── commands/                      ← 仅当 /sdd-init 选择「项目级」安装位置时创建
│       └── sdd-*.md                   ← 14 个 slash commands 的 symlink，指向 skill 源目录
├── .sdd-bak.{YYYYMMDDHHmm}/           ← [条件性] 仅当 /sdd-start 场景 C 选"重新开始"时创建
│   ├── .project/                      ← 备份原 .project/
│   ├── .test/                         ← 备份原 .test/（如存在）
│   ├── .outdocs/                      ← 备份原 .outdocs/（如存在）
│   └── AGENTS.md                      ← 备份原 AGENTS.md（用户选择重置时）
└── .agents/skills/                    ← Skill 安装目录（ny-sdd-workflow 自身，tools/ 已内置）
    ├── ny-sdd-workflow/               ← 本工作流（rules/ + templates/ + .claude/commands/）
    └── reverse-scan/                  ← [可选] 深度代码扫描 Skill
```

> **用户级 slash commands 位于 `~/.claude/commands/sdd-*.md`**（如 /sdd-init 时选择策略 A），不在项目目录内。

---

## 工作流概览

```
G0 对话初始化（AGENTS.md，始终加载）
  → 检查 .project/context.md 是否存在？
     · 不存在（首次）→ G0.1 项目类型确认（A/B/C/D）→ G0.2 目录骨架 → G0.3 文档补充 → G0.5
     · 已存在（后续）→ G0.4 状态恢复（读 last 字段）→ G0.4.1 意图推断（非阻塞）
       · bug 意图 → 二次判定：当前需求 bug → 直接跳 §3.0（bug 修复回环）/ 新 bug → G0.5
       · 其他意图 → G0.5
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
  → §2.7 功能测试用例设计（test-case-design Skill → TC 文档 + CSV，为 E2E 准备）
  → E2E 测试：§4 全部模块归档后用户确认执行（e2e-test-runner，Playwright only）
  → §2.6 Spec Sync（随时触发：specs/PRD/技术文档 三种触发源）

§3 编码变更通道（rules/phase-coding.md，按需加载）
  → §3.0 通道判断（含 bug 修复回环入口 ← G0.4.1 二次判定）
     · 直通：不涉及代码，直接回答
     · 快速：仅样式/文案，§3.1 → 改代码 → §3.9 → §3.10 → §3.11
     · 标准：§3.1~§3.11 完整执行
     · bug 修复回环：通道判断同上，§3.10 追加 REQ/DES 留痕，§3.11 按原始 last 路由
  → §3.1  加载规范 + 铁律（§3.1.1 铁律检查 / §3.1.2 已有代码认知 / §3.1.3 编码上下文 / §3.1.4 UI 上下文）
  → §3.2  加载 Spec（sync-status + coding-skill + audit-skill）
  → §3.3  文档学习（优先 .docs/）
  → §3.4  影响面评估（6 维度）
  → §3.5  代码变更（Skill + 执行日志 + C-01~C-10 + U-01~U-06）
  → §3.6  代码审计（Skill + S-01~S-07 代码质量 + S-08 功能完整性 → audit-report.md）
  → §3.7  开发自测
     §3.7.1 自动化单测（unit-test-generator Skill → 设计+生成+执行+覆盖率+报告+清理）
     §3.7.2 自动补充验证（T-01~T-06，AI 能做的自动执行，做不了的跳过）
  → §3.8  更新 task.md
  → §3.9  生成 Changelog
  → §3.10 Spec 状态同步（bug 修复回环追加 REQ 记录 + DES 标注）
  → §3.11 写入 context.md（bug 修复回环：原始 last §3.x→回原位 / §4→重新归档）

§4 归档（rules/phase-archive.md，按需加载）
  → 15 项检查清单（含功能测试用例 + 单元测试通过）
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
# .claude/commands/sdd-*.md（项目级 slash commands 是 symlink，指向各开发者本机的 skill 安装路径，
#   跨机器会失效，建议加入 .gitignore；推荐每个开发者各自运行 /sdd-init 安装）
.claude/commands/sdd-*.md

# /sdd-start 场景 C "重新开始" 时创建的本地备份目录（不提交）
.sdd-bak.*/
```

---

## 注意事项

- AGENTS.md 依赖 skill 目录中的 `rules/` 文件。如果 skill 被删除，AI 会提示"文件不存在"，重新安装即可恢复
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
| 后端编码 | §3.5 代码变更（后端） | — | 内置兜底（C-01~C-10） |
| 代码审计 | §3.6 代码审计 | — | 内置兜底（S-01~S-08） |
| 深度代码扫描 | §1.4 深度业务代码扫描 | reverse-scan | 浅层业务架构推断 |
| 功能测试用例设计 | §2.7 评审通过后 | test-case-design | 跳过（非编码阻断项） |
| 单元测试 | §3.7 编码后自测 | unit-test-generator | T-01~T-06 全量手工自测 |
| E2E 测试 | §4 全部模块归档后（用户确认） | e2e-test-runner | `tools/e2e-test-runner/` |

Skill 执行流程（统一）：
```
读取 {SKILL_DIR}/tools/{skill名}/SKILL.md
  → 文件存在 → 调用 → 输出执行日志
  → 文件不存在 → 使用内置兜底规则
所有 Skill 已内置在 tools/ 目录下，无需远程安装。
```

---

## 交付文档（.outdocs/）

| 文件 | 写入时机 | 写入方式 |
|------|---------|---------|
| project-overview.md | §1.1 / §1.2 / §2.1 | 按模板生成，增量补充 |
| api-doc.md | §2.3 DES 完成后 | 从 DES 自动提取，按模块章节追加 |
| audit-report.md | §3.6 代码审计 | 按模块章节追加 |
| unit-test-report.md | §3.7 开发自测 | 按模块章节追加（§3.7.1 自动化单测 + §3.7.2 自动补充验证 T-01~T-06） |
| task-report.md | §4 归档时 | 按模块章节追加执行摘要 |
| prd-change-log.md | §2.6 Spec Sync PRD 变更时 | 追加变更记录 |

**测试产出（.project/ 内部，非交付文档）**：

| 文件 | 写入时机 | 位置 |
|------|---------|------|
| TC-F-*.md（功能测试用例） | §2.7 | `.test/testcases/`（按模块分文件） |
| testcases.detailed.csv + testcases.traditional.csv | §2.7 | 同上（全局汇总，所有模块追加） |
| UT-*.md（单测用例文档） | §3.7.1 | `.test/unit/` |
| skeleton/*（单测代码骨架） | §3.7.1 | `.test/unit/skeleton/` |
| report.md（单元测试报告） | §3.7.1 | `.test/unit/` |

---

## 常见问题

### Q: Windows 系统能用吗？

可以。Windows 不支持 symlink，CLI 会自动改用文件复制。更新时需重新执行 `node <SDD_DIR>/bin/cli.js update`。

### Q: 已有 .cursorrules 等文件怎么办？

初始化时如果目标文件已存在且非 symlink，会跳过并提示。不会覆盖已有配置。

### Q: AGENTS.md 可以自定义吗？

可以。AGENTS.md 是源文件，修改后所有 symlink 自动同步。建议通过 `project-profile.md` 定义项目级铁律和规范，AGENTS.md 保持通用。

### Q: 如何更新到新版本？

```bash
# Skills 方式：更新 skill 后在对话中说"更新工作流"
npx skills update

# 本地 CLI 方式（git clone 后）：
node <SDD_DIR>/bin/cli.js update
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
  ├── reverse-scan             ← §1.4 按需调用（深度代码扫描）
  ├── test-case-design         ← §2.7 按需调用（功能测试用例设计）
  └── unit-test-generator      ← §3.7 按需调用（单元测试）
```

### Q: `/sdd-init` 和 `/sdd-start` 有什么区别？

两者完全不同：

| 命令 | 定位 | 何时用 |
|------|------|-------|
| `/sdd-init` | 装"地基"——基础设施安装 | **一次性**：写入 AGENTS.md、AI 工具同步 symlink、安装 slash commands。等价说"安装 SDD"。也支持更新/查看状态/卸载（A/B/C/D 四选一） |
| `/sdd-start` | 上"工地"——进入开发流程 | **每次**开始/恢复项目开发时使用。触发 G0 对话初始化（首次路径或后续路径自动判定）。等价说"启动工作流" |

**典型流程**（首次 vs 后续）：

**首次安装**（两条路径任选）：
```
1. npx skills add https://github.com/91160/skills.git --skill ny-sdd-workflow --yes
   # 拉 skill 包到 ~/.claude/skills/ny-sdd-workflow/（即 <SDD_DIR>）

2-A. AI 对话交互式安装（首次推荐）：
     在 AI 对话中说"安装 SDD"  ← 首次此时 slash 命令尚未装到 Claude Code，必须用自然语言
     # AI 走 SKILL.md 流程：写入 AGENTS.md + AI 工具 symlink + 询问 slash commands 安装位置（用户级 / 项目级 / 跳过）

2-B. 本地 CLI 方式（CI/CD 自动化推荐）：
     node <SDD_DIR>/bin/cli.js init --tools=A --commands=user
     # 一条命令完成 AGENTS + 全部 AI 工具 + 用户级 slash 命令

3. 安装完成后，/sdd-init 等 14 个 slash 命令即可在 Claude Code 内可见
```

**后续使用（可用 slash 命令）**：
```
4. /sdd-start                          # 开始本项目的开发（G0 → §1 → §2 → §3 → §4）
5. （开发中遇到 bug）/sdd-bug-fix      # 当前需求 bug 修复回环
6. （需求变更时）/sdd-prd-change       # PRD 变更同步
7. （需要再次更新工作流）/sdd-init     # 选 B 更新 / C 查看状态 / D 卸载
```

> 鸡生蛋说明：slash 命令是由 SKILL.md 流程 Step 4 或本地 CLI 的 `--commands=user/project` 参数安装的，**首次安装时命令文件还不存在**，所以第 2 步必须用自然语言或本地 CLI（任一即可）。后续的所有操作都可以用 slash 命令。

### Q: 工具命令（如 `/sdd-prd-audit`）是否会污染工作流状态？

不会。每个工具命令都内置**流程冲突保护**——手动调用与当前 `context.md` 阶段不一致时，AI 会先输出冲突提示让你三选一：

- **A. 独立执行**（仅产出文件，不更新 context.md / index.md / 不触发级联）
- **B. 作为工作流的一部分执行**（按对应 §X.Y 流程更新 context 与级联文件）
- **C. 取消**

例如已经在 §3 编码阶段，但你想重新审计 PRD，AI 会让你选择是独立审一遍（不影响开发进度）还是当成 §2.6 Spec Sync `[prd]` 触发（走级联更新）。

### Q: Slash Commands 装在用户级还是项目级？

`/sdd-init` 时三选一：

- **A. 用户级 `~/.claude/commands/`**（推荐：所有项目可用，一次安装永久可见，匹配全局 SDD 安装心智）
- **B. 项目级 `.claude/commands/`**（仅当前项目可见，避免在非 SDD 项目误触）
- **C. 跳过**（保留自然语言触发，命令绑定的功能仍能通过"审计 PRD"等说法触发）

默认推荐：全局安装 SDD → A；项目本地安装 → B。

### Q: AI 跳过 G0.1 项目类型确认 / 走伪审计 / 没真调用 prd-audit Skill 怎么办？

这是 SDD 类工作流的常见痛点：AI 对"简单需求"（如砍价模拟器）会偷懒跳步骤。当前版本通过**三层约束**已大幅缓解：

1. **G0.0 用户输入预处理**（AGENTS.md 顶部强制）：每次对话开始 AI 必须先暂存用户首条消息，跑完 G0 路径再处理。禁止跳过 G0.1 项目类型确认。即便用户首条消息含"做新项目 XXX"等明显信号，AI 也必须输出 `基于你的描述，我推断这是「A 新项目」。请确认 A/B/C/D` 让用户拍板。

2. **G0.5 阶段执行约束（声明式校验）**：进入任何 §N.N 章节前 AI 必须先输出该章节的流程声明头（5 字段：phase/step/prev/next/gate）作为凭证。AGENTS.md 末尾的「阶段速查表」列出了每个 §N.N 的关键动作，AI 看速查表 + 声明头就能正确执行，不需要每次重读 phase-*.md。

3. **Skill 调用强制约束**（skill-routing.md 顶部）：每次调 Skill 必须 5 步走（Read SKILL.md → 输出执行日志 → 按 Step 顺序执行 → 输出执行小结 → 产出物路径与 SKILL.md 一致）。**禁止"AI 觉得简单凭通用知识做"** —— 没有 Read SKILL.md 工具调用 + 没有 Skill 执行日志 = 视为伪调用，必须重做。

**用户如何观察 AI 是否在偷懒**：
- 进入新阶段时，AI 是否输出了流程声明头
- 调用 Skill 时，对话中能否看到 `Read({SKILL_DIR}/tools/{skill}/SKILL.md)` 工具调用
- 审计/扫描报告前是否有【Skill 执行日志】4 字段

如果发现 AI 跳步：直接说"请按 G0.5 阶段执行约束输出流程声明头"或"请先 Read tools/prd-audit/SKILL.md 再做审计"——AI 必须重做。

### Q: Cursor/Copilot 只读 AGENTS.md，功能会缺失吗？

不会严重缺失。AGENTS.md 的 G 系列核心规则已包含最关键的机制：
- **G0 对话初始化**：项目类型确认、目录骨架、状态恢复、阶段路由
- **G1 写码门禁**：确保 AI 不会跳过需求/设计直接写代码
- **G2 停车信号**：确保 AI 在不确定时暂停而非猜测
- **G3 未覆盖场景兜底**：统一的未覆盖场景处理

这些机制覆盖了 80% 的常见问题。完整的阶段规则（§1~§4 编码步骤、流程声明头跳转、审计标准等）需要 Claude Code / Codex 的动态加载能力。

### Q: .docs/ 文档怎么放？

分为 PRD 和技术文档两大类，PRD 内部再细分 4 类：

- `.docs/prd/` — PRD 文字需求（md/pdf/txt）
- `.docs/prd/prototype/` — 原型图（线框图，png/jpg/pdf）
- `.docs/prd/ui/` — UI 设计稿（高保真视觉，png/jpg/pdf）
- `.docs/prd/ui-spec/` — UI 解析文件（Figma/蓝湖导出的 md）
- `.docs/tech/` — 技术文档（API/建表脚本/中间件配置等）

**子目录不强制**：不确定归类的文件可直接放 `.docs/prd/` 根目录，AI 会按"文件名关键词 + 内容视觉判断"自动识别。

编码时 UI 基准优先级：UI 解析 md > UI 设计稿 > 原型图 > HTML 原型 > DES > 样式体系（详见 §3.1.4）。

---

## 版本记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0.0 | 2026-04-17 | 首次发布。G 系列全局规则（G0 对话初始化 / G1 写码门禁 / G2 停车信号 / G3 未覆盖场景兜底）+ §1~§4 阶段编号 + 流程声明头机制（phase/step/prev/next/gate/blocking）+ 动态加载架构 + PRD 三类内容管理（prototype/ui/ui-spec）+ UI 基准 6 级优先级 + context.md 状态标记规约 + 10 条编码规约 C-01~C-10 + 6 条 UI 还原规约 U-01~U-06 + 8 条审计规约 S-01~S-08 + 6 条自测规约 T-01~T-06 + 多 AI 工具兼容（8 款）|
| v1.0.1 | 2026-04-20 | 集成 test-case-design（§2.7 功能测试用例设计）+ unit-test-generator（§3.7.1 自动化单测）+ 9 个 Skill 内置 tools/ 目录 + bug 修复回环机制（G0.4.1 二次判定 → §3.0 回环 → §3.10 文档留痕 → §3.11 路由分流）+ G1 #5 回环豁免 + java-coding/code-audit 移除改用内置兜底 + S-08 功能完整性审计 |
| v1.0.2 | 2026-04-27 | 新增 Slash Commands（`.claude/commands/sdd-*.md`）：4 个流程触发类 + 工具触发类 + 安装策略 C（用户级/项目级/跳过 三选一）+ 流程冲突保护（A 独立 / B 工作流内 / C 取消）+ AGENTS.md 加入 `/sdd-start` 触发约束（强制必读 context.md 的四场景路由）+ SKILL.md / skill-routing.md 同步入口表 |
| v1.0.3 | 2026-05-12 | **四值 blocking 防偷懒 + 完善 + 安装体验修复**。核心：① blocking 字段从 2 值扩为 4 值（`true` / `false` / `gated` / `audit-required`）。② blocking 调整：§2.4 原型 false→true、§2.5 评审 true→gated、§3.4 影响面 false→true、§3.6 审计 false→audit-required、§3.7 自测 false→gated、§3.8 task false→gated、§2.7 false→true、§3.11 false→true。③ 新增「上节产物回灌」（§2.5/§3.7/§3.8）+「审计起手清单」（§3.6，≥3 怀疑点 + 验证 + ≥3 finding 或辩护；至少 1 个针对 ≥10 行代码段；反向假设示例库 8 类）。④ context.md `produced` 字段（产物路径 + 锚点 + SHA-256 前 8 位；仅 §2.4 / §3.6 / §3.7 三章强制）。⑤ G0.0 / G0.5 合并为「执行自审」统一机制（跨对话开局触发 + 单会话每节进入触发）。⑥ 跨多模块 feature 每模块独立锚点；自愈循环每轮独立锚点（第 N 轮后缀）。⑦ §2.4「涉及前端」三条客观判据；§2.5 双重校验防 prev 滥用。⑧ 锚点 slug 化伪代码确定性规则；「产物存在但 produced 缺失」辅助判定三选一。⑨ §3.9 prev 加 bug 修复回环跳 §3.8 分支；§4 #1/#2/#13 不通过必须整链重走。⑩ §2.7 Skill 缺失时不再跳过，兜底产出手工 TC-F 大纲触发 G2 由用户决策。⑪ **SKILL.md 方案 B**：Step 0 入口类型检测 + Step 7 路由分支——自然语言"启动工作流"触发的兜底安装完成后自动接续 G0，用户无需重复说"启动工作流"；`/sdd-init` 显式安装仍保留两阶段设计。 |
| v1.0.4 | 2026-05-19 | **接入 §4 Playwright E2E 后置验收**：新增 `/sdd-e2e-test` 与 `tools/e2e-test-runner/`，消费 §2.7 TC-F 中 `channel=e2e` + `e2e-exec`，生成并执行 Playwright 用例；实际执行时输出 `.outdocs/e2e-report.md` + `.outdocs/e2e-report.html` 以及 `.test/e2e/report.md/html`。测试运行配置统一为 `.test/.test-env.md`，§2.7 / §3.7.1 / §4 按需创建和补全；`e2e.base_url` / `e2e.test_command` / 账号类 `vars.*` 不猜测，TODO 或未确认示例值均需用户确认。E2E 场景按新项目 feature、旧项目新增需求、bug 修复、技术优化分别处理：bug 修复不跑 E2E，技术优化仅必要且可执行时运行；入口级不执行只记录 SKIP 留痕，不生成 E2E 报告。HTML 报告升级为独立质量仪表盘，不依赖外部 CDN。 |
