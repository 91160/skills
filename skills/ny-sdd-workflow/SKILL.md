---
name: ny-sdd-workflow
description: >
  安装 SDD Workflow v1.0.3 开发工作流到项目中。自动解析 skill 安装路径，生成 AGENTS.md（核心规则 + 路径已烧录），
  同时生成 CLAUDE.md（symlink → AGENTS.md，Claude Code 自动读取），
  阶段规则文件（rules/）保留在 skill 目录按需读取，并可选同步到其他 AI 工具。

  **架构**：G 系列全局规则 + §1~§4 阶段编号 + 流程声明头机制（含**四值 blocking** true/false/gated/audit-required）+ 动态加载 + **执行自审统一机制**（跨对话开局 + 单会话每节进入两个触发点）+ **context.md `produced` 字段**（产物路径 + 锚点 + SHA-256 前 8 位，仅 §2.4 / §3.6 / §3.7 三章强制）+ **审计起手清单**（§3.6 进入时 ≥3 怀疑点 + 验证）+ **上节产物回灌**（§2.5 / §3.7 / §3.8 进入时 cat 上节产物 + 哈希校验）+ 13 个 Slash Commands，兼容多 AI 工具。

  **必须在以下场景触发：**
  - 用户说"安装 SDD"、"安装 AGENTS"、"安装 AI 工作流"、"配置开发规范"
  - 用户运行 `/sdd-init` 命令
  - 用户说"启动工作流"、"开始开发" **且项目根目录无 `AGENTS.md`**（兜底：未装 SDD 时帮用户先装好；安装完成后**自动接续 G0 对话初始化**，用户无需再触发一次"启动工作流"）
  - 新项目需要建立 AI 编码工作流规范时
  - 用户说"更新工作流"、"更新 SDD"

  **注意**：
  - Claude Code 内置的 /init 命令（生成独立 CLAUDE.md）会覆盖本工作流生成的 CLAUDE.md symlink，请勿混用。
  - 用户说"启动工作流"或运行 `/sdd-start`：默认是**进入项目开发流程**（G0 对话初始化）。仅当 AGENTS.md 不存在时才转入本 Skill 完成基础设施安装；**自然语言"启动工作流"触发的兜底安装完成后自动接续 G0 首次路径**（详见 Step 0 入口类型检测 + Step 7 路由分支），用户无需重复触发；仅 `/sdd-init` 显式安装才保留"装完停下等用户验证"的两阶段设计。

  产出：① 项目根目录 AGENTS.md（{SKILL_DIR} 已替换为实际路径）② CLAUDE.md（symlink → AGENTS.md，Windows 用复制兜底）③ 各 AI 工具指令文件 symlink ④ Slash Commands 安装（用户级 / 项目级 / 跳过 三选一）⑤ 初始化状态报告
---

# SDD Workflow 初始化 Skill

本 skill 将 SDD Workflow v1.0.3 安装到当前项目，自动适配多 AI 工具。

## 安装过程多轮交互处理

SKILL.md A 分支安装期间，AI 与用户有多轮交互（Step 3 同步工具、Step 4 命令位置等）。**用户回复偏离当前 Step 的预期选项时**（非该 Step 列出的 A/B/C/D 答案，且非"取消" / "继续"等明确指令），AI 必须：

1. **暂停当前 Step**，不强行解析用户回复为答案
2. 按 **G2 停车信号**格式输出：列出当前 Step 编号 + 用户回复内容 + 建议处理方式
3. 提供三选一让用户确认：
   - A. 继续当前 Step（请用户重新回复对应选项）
   - B. 取消安装（回滚已生成的文件，输出已执行步骤摘要）
   - C. 跳到指定 Step（用户指定跳转目标，如"跳到 Step 5"）
4. 等待用户明确选择后再推进

**取消时的回滚**（B 选项）：

- 已生成 AGENTS.md → 删除
- 已创建 CLAUDE.md symlink → 删除
- 已创建其他 AI 工具 symlink → 删除
- 已安装 slash commands → 删除（仅本次安装新增的）
- 不删除 .docs/ / .project/ 等用户目录（即便是 G0.2 创建的，可能含用户内容）
- 输出回滚摘要让用户确认

**动态加载架构**：

```
AGENTS.md（始终加载）
  └── G0 对话初始化 + G1 写码门禁 + G2 停车信号 + G3 未覆盖场景兜底 + 阶段路由表
        ↓ AI 根据 context.md 状态按需读取
{SKILL_DIR}/rules/phase-init.md         §1 项目启动
{SKILL_DIR}/rules/phase-spec.md         §2 需求/设计/评审
{SKILL_DIR}/rules/phase-coding.md       §3 编码变更通道（§3.1~§3.11）
{SKILL_DIR}/rules/phase-archive.md      §4 归档
{SKILL_DIR}/rules/quality-standards.md  审计标准（审计时读取）
{SKILL_DIR}/rules/skill-routing.md      Skill 路由（安装/调用时读取）
{SKILL_DIR}/rules/slash-commands.md     Slash Commands 详细路由（用户触发 /sdd-* 命令时读取）
{SKILL_DIR}/rules/project-structure.md  .project 完整目录结构（用户询问 / 追溯具体路径时读取）

{SKILL_DIR}/templates/project-profile.tpl.md   初始化 profile 时读取
{SKILL_DIR}/templates/project-overview.tpl.md   生成 overview 时读取

外部 Skill（§1.2 按需调用）：
reverse-scan Skill    深度业务代码扫描（知识卡片+调用图+模块地图+逆向DES/REQ）
```

**关键机制**：安装时 `{SKILL_DIR}` 被替换为实际路径（本地安装→相对路径，全局安装→绝对路径），AGENTS.md 中写死真实值，AI 可直接读取。

---

## 第一步：确认操作类型

询问用户：

```
【SDD Workflow】
请选择操作：
  A. 初始化（首次安装，生成 AGENTS.md + 各工具 symlink）
  B. 更新（更新 AGENTS.md 到最新版本）
  C. 查看状态（检查各文件安装情况）
  D. 卸载（清理 symlink，保留 AGENTS.md）
```

---

## 第二步：执行对应操作

### A. 初始化

**Step 0：入口类型检测**

执行 A 分支前，AI **必须先识别原始触发入口**（影响 Step 6 报告内容 + Step 7 是否自动接续 G0）：

| 入口类型 | 触发判定 | 后续行为 |
|---|---|---|
| **install**（显式安装意图）| 用户运行 `/sdd-init`；或自然语言含"安装 SDD"/"安装工作流"/"安装 AGENTS"/"配置开发规范"等明显安装词 | Step 6 输出"下一步：运行 /sdd-start"提示，**Step 7 停下不接续**（保留两阶段设计，让用户验证安装结果） |
| **develop**（开发意图被兜底引导）| 用户自然语言含"启动工作流"/"开始开发"/"开始项目"；或运行 `/sdd-start`（场景 A 自动转入本 SKILL.md，与自然语言路径一致），且项目根无 AGENTS.md 被兜底进入 | Step 6 输出"已自动接续 G0"提示，**Step 7 自动继续执行 G0 首次路径**（避免用户重复触发） |
| **ambiguous**（无法判定）| 用户首条消息既不含安装词也不含开发词（罕见，如直接说"运行 SKILL.md A 分支"）| 按 install 处理（保守，等用户确认） |
| **兼有 install + develop 词**| 用户首条消息同时含安装词（"安装"/"配置"）和开发词（"启动"/"开始开发"），如"安装并启动 SDD 工作流" | **按 install 处理（保守）**——让用户验证安装结果后再触发开发；安装报告里特别标注"检测到你同时表达了安装与开发意图，本次按 install 处理，安装完后请确认无误再说'启动工作流'" |

AI 必须在本次会话内**记忆**此 entry_type 直到 Step 7，作为路由依据。

**Step 1：确定 skill 安装路径**

检测本 skill 的安装位置，用于生成 AGENTS.md 中的文件引用路径。**检测必须基于 SKILL.md 实际存在性**（空骨架目录不算有效安装），按以下顺序判定：

1. **检测项目本地安装**：
   ```bash
   # 路径有效性 = 目录存在 + SKILL.md 实际可读
   [ -f "$(pwd)/.agents/skills/ny-sdd-workflow/SKILL.md" ]
   ```
   - ✅ 通过 → 使用**相对路径** `.agents/skills/ny-sdd-workflow`
   - ❌ 不通过（含"目录存在但 SKILL.md 缺失"的**空骨架场景**——例如 `npx skills add ... -a claude-code` 误创建的空 `.agents/` 目录）→ **视为非本地安装，回退到第 2 步**

2. **检测全局安装（回退路径）**：
   ```bash
   # 用户级标准位置
   [ -f "$HOME/.claude/skills/ny-sdd-workflow/SKILL.md" ]
   ```
   - ✅ 通过 → 使用**完整展开的绝对路径**（用 `echo $HOME` 获取，禁止 `~`）
   - ❌ 不通过 → 报错并退出：「Skill 未正确安装：本地 `.agents/skills/ny-sdd-workflow/` 与全局 `~/.claude/skills/ny-sdd-workflow/` 均无 SKILL.md。请先运行 `npx skills add https://git.nykjsrv.cn/ai-coding/skills.git --skill ny-sdd-workflow --yes` 完成安装」

3. **空骨架告知（不删除）**：若第 1 步检测到本地路径**目录存在但 SKILL.md 缺失**（明确判定为空骨架），在 Step 6 初始化报告中追加一行提示：
   ```
   ⚠️ 检测到 .agents/skills/ny-sdd-workflow/ 为空骨架（无 SKILL.md），已自动回退到全局安装路径。
      这通常是 `npx skills add ... -a claude-code` 误建的占位目录，可手动清理：
      rm -rf .agents/skills/ny-sdd-workflow
      （或保留亦无影响，工作流不会再误判）
   ```

**最终路径形态**：

- 项目本地安装（路径校验通过）→ 使用**相对路径**：`.agents/skills/ny-sdd-workflow`
- 全局安装（本地路径不通过的回退）→ 使用**完整展开的绝对路径**

> **绝对路径必须完整展开**（最高优先级约束）：
> - ❌ **禁止**写成 `~/.claude/skills/ny-sdd-workflow`（`~` 在 Read 工具中不展开，会导致后续读取失败）
> - ✅ **必须**写成 `/Users/{username}/.claude/skills/ny-sdd-workflow`（macOS）/ `/home/{username}/.claude/skills/ny-sdd-workflow`（Linux）/ `C:\Users\{username}\.claude\skills\ny-sdd-workflow`（Windows）
> - 检测方法：用 Bash 工具运行 `echo $HOME` 或 `pwd`（在 skill 目录内），获取完整展开后的绝对路径
> - 走本地 CLI 路径（`node <SDD_DIR>/bin/cli.js init`）时，cli.js 的 `path.resolve()` 自动完整展开，无需手动处理；走 SKILL.md 路径（AI 对话中说"安装 SDD"）时，AI 必须用 Bash 工具显式获取完整展开后的路径再写入 AGENTS.md

**Step 2：生成 AGENTS.md + CLAUDE.md**

检查项目根目录是否已存在 AGENTS.md：
- 已存在 → 提示用户「AGENTS.md 已存在，跳过。如需更新请选 B」
- 不存在 → 读取本 skill 目录下的 `templates/AGENTS.md`，将其中所有 `{SKILL_DIR}` 替换为 Step 1 确定的实际路径，写入项目根目录 `AGENTS.md`

**生成 CLAUDE.md**（自动，无需用户选择）：
- macOS/Linux：创建 symlink `CLAUDE.md → AGENTS.md`
- Windows：复制 `cp AGENTS.md CLAUDE.md`
- 若 CLAUDE.md 已存在且为非 symlink → 跳过并提示（避免覆盖用户自定义内容）

```bash
AGENTS_FILE="$(pwd)/AGENTS.md"

# 创建 CLAUDE.md symlink（macOS/Linux），Windows 用 cp 兜底
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  [ ! -f CLAUDE.md ] && cp "$AGENTS_FILE" CLAUDE.md && echo "✅ CLAUDE.md (复制自 AGENTS.md)"
else
  [ ! -e CLAUDE.md ] && ln -s "$AGENTS_FILE" CLAUDE.md && echo "✅ CLAUDE.md → AGENTS.md (symlink)"
fi
```

**Step 3：询问用户是否同步到其他 AI 工具**

```
【AI 工具同步】
是否将 AGENTS.md 同步到其他 AI 编码工具？（创建 symlink 指向 AGENTS.md）
请选择需要同步的工具（多选，用逗号分隔，或输入 A 全选，N 跳过）：
  1. Cursor        → .cursor/rules/ny-sdd-workflow.md
  2. GitHub Copilot → .github/copilot-instructions.md
  3. Cline         → .clinerules
  4. Windsurf      → .windsurfrules
  5. Augment       → .augment/rules/ny-sdd-workflow.md
  6. Continue      → .continue/rules/ny-sdd-workflow.md
```

用户选择后，仅为选中的工具创建 symlink：

```bash
AGENTS_FILE="$(pwd)/AGENTS.md"

# Cursor
mkdir -p .cursor/rules && [ ! -e .cursor/rules/ny-sdd-workflow.md ] && ln -s "$AGENTS_FILE" .cursor/rules/ny-sdd-workflow.md
# GitHub Copilot
mkdir -p .github && [ ! -e .github/copilot-instructions.md ] && ln -s "$AGENTS_FILE" .github/copilot-instructions.md
# Cline
[ ! -e .clinerules ] && ln -s "$AGENTS_FILE" .clinerules
# Windsurf
[ ! -e .windsurfrules ] && ln -s "$AGENTS_FILE" .windsurfrules
# Augment
mkdir -p .augment/rules && [ ! -e .augment/rules/ny-sdd-workflow.md ] && ln -s "$AGENTS_FILE" .augment/rules/ny-sdd-workflow.md
# Continue
mkdir -p .continue/rules && [ ! -e .continue/rules/ny-sdd-workflow.md ] && ln -s "$AGENTS_FILE" .continue/rules/ny-sdd-workflow.md
```

> **注意**：其他 AI 工具（Cursor/Copilot 等）只能读取 AGENTS.md 中的核心规则（~170行）。
> 动态加载阶段文件的能力仅 Claude Code / Codex 支持。
> 核心规则（G1 门禁 + G2 停车信号）已足够保障其他工具的基本流程。

**Step 4：Slash Commands 安装**（策略 C — 用户级 / 项目级 / 跳过）

根据 Step 1 检测到的 SKILL_DIR 类型，给出推荐选项：

```
【Slash Commands 安装位置】
检测到当前 SDD 安装位置：{SKILL_DIR}
  → 类型：{全局安装 / 项目本地安装}

请选择 slash 命令安装位置：
  A. 用户级 ~/.claude/commands/（推荐：所有项目可用，一次安装永久可见）
  B. 项目级 .claude/commands/（仅当前项目可见）
  C. 跳过（不安装命令，仅用自然语言触发）

默认推荐：
  · 全局安装 → A（用户级）
  · 项目本地安装 → B（项目级）
```

用户选择后，对 13 个命令文件创建 symlink（Windows 兜底为 `cp`）：

> **AI 执行前**：将下方 bash 脚本中的 `{SKILL_DIR}` 替换为 Step 1 确定的实际路径（绝对路径或相对路径，与 AGENTS.md 中烧录的值一致）。

```bash
COMMANDS_SRC="{SKILL_DIR}/.claude/commands"   # ← AI 替换为实际路径

# A. 用户级
if [ "$CHOICE" = "A" ]; then
  mkdir -p ~/.claude/commands
  for f in "$COMMANDS_SRC"/sdd-*.md; do
    name=$(basename "$f")
    [ ! -e "$HOME/.claude/commands/$name" ] && ln -s "$f" "$HOME/.claude/commands/$name"
  done
fi

# B. 项目级
if [ "$CHOICE" = "B" ]; then
  mkdir -p .claude/commands
  for f in "$COMMANDS_SRC"/sdd-*.md; do
    name=$(basename "$f")
    [ ! -e ".claude/commands/$name" ] && ln -s "$f" ".claude/commands/$name"
  done
fi
```

**已存在检测**：
- A 选项：若 `~/.claude/commands/sdd-*.md` 已部分/全部存在 → 询问「检测到部分命令已存在（可能其他项目已安装），是否覆盖？」
- B 选项：若 `.claude/commands/sdd-*.md` 已存在且非 symlink → 跳过该文件并提示

**Slash Commands 清单**（13 个）：
- 流程触发类（4 个）：`sdd-init` / `sdd-start` / `sdd-prd-change` / `sdd-bug-fix`
- 工具触发类（9 个）：`sdd-prd-audit` / `sdd-front-context` / `sdd-back-context` / `sdd-frontend-standards` / `sdd-java-create` / `sdd-wap-create` / `sdd-reverse-scan` / `sdd-test-case` / `sdd-unit-test`

**⚠️ 重启提示**（创建 symlink 后必须明确告知用户）：

Slash 命令安装完成后，AI **必须立即输出以下提示**：

```
⚠️ Slash 命令 symlink 已创建（13 个）
   Claude Code 启动时缓存了命令列表，新装命令需**重启 Claude Code** 后才能识别。

   重启前可用自然语言获得同等效果，例如：
   · "启动工作流" = /sdd-start
   · "需求变了" = /sdd-prd-change
   · "修复 bug" = /sdd-bug-fix
   · "生成功能测试用例" = /sdd-test-case
   · "生成单元测试" = /sdd-unit-test
   （完整 13 个命令 + 详细路由见 {SKILL_DIR}/rules/slash-commands.md）
```

**Step 5：输出 .gitignore 建议**（仅在创建了 symlink 时提示）

```
# SDD Workflow symlink（由 ny-sdd-workflow skill 生成，不提交）
.cursorrules
.clinerules
.windsurfrules
# 项目级 slash commands（如选择策略 B）— 是否提交按团队约定
# .claude/commands/sdd-*.md
# AGENTS.md 需要提交（源文件）
```

**Step 6：输出初始化报告**

报告头部共用，**"下一步"段按 Step 0 检测的 entry_type 分支**：

```
【SDD Workflow v1.0.3 安装完成】

✅ AGENTS.md（核心规则 G0~G3 + 编号流程规约，始终加载）
✅ CLAUDE.md → AGENTS.md（symlink，Claude Code 自动读取）
✅ 阶段规则文件位于：{实际 skill 路径}/rules/（§1~§4 按需加载）
{用户选择的 AI 工具列表}
{未选择的 AI 工具}

✅ Slash Commands（{用户级 ~/.claude/commands/ / 项目级 .claude/commands/ / 已跳过}）
   - 流程：/sdd-init /sdd-start /sdd-prd-change /sdd-bug-fix
   - 工具：/sdd-prd-audit /sdd-front-context /sdd-back-context /sdd-frontend-standards
           /sdd-java-create /sdd-wap-create /sdd-reverse-scan /sdd-test-case /sdd-unit-test

入口来源：{install / develop / ambiguous}
```

**entry_type = install 时**（显式安装意图，保留两阶段设计）：

```
下一步：
  · 运行 /sdd-start 进入此项目的开发流程（或直接说"启动工作流"）
  · 阶段规则按需动态加载，无需一次性读取全部内容
  · 如需定制项目铁律，编辑 .project/specs/rules/project-profile.md
```

**entry_type = develop 时**（开发意图被兜底引导，自动接续 G0）：

```
下一步：
  · 基础设施已就绪，正在自动接续 G0 对话初始化（无需你再次触发）
  · 阶段规则按需动态加载，无需一次性读取全部内容
  · 如需定制项目铁律，编辑 .project/specs/rules/project-profile.md
  · 若想中断接续（先验证安装结果），直接说"等等"打断 AI 即可
```

**entry_type = ambiguous 时**：按 install 文案输出。

**Step 7：路由分支**

按 Step 0 检测的 entry_type 决定本 Skill 执行结束后的行为：

- **entry_type = install / ambiguous**：本 Skill 执行**结束**，等待用户后续指令（用户可自由验证安装结果，确认无误后运行 /sdd-start 或自然语言"启动工作流"进入 G0）
- **entry_type = develop**：本 Skill 输出 Step 6 报告后**不停止**，立即接续以下动作：
  1. 输出过渡提示一行：`【自动接续 G0 对话初始化】（原始触发：用户说"启动工作流"，已消费，不再作为待处理输入）`
  2. **直接进入 AGENTS.md G0 首次路径**（按场景 B 路由）：G0.1 项目类型确认 → G0.2 目录骨架初始化（已存在跳过）→ G0.3 文档补充确认 → G0.5 阶段路由
  3. G0.0 用户输入预处理段中的"暂存用户首条消息"动作：原始消息"启动工作流"视为**已消费的触发词**，不再作为「待处理输入」；若用户的首条消息同时含项目特征（如"启动工作流，做个砍价小程序"），则**项目特征部分作为「待处理输入」**保留，按 G0.1 模式 A 推断模式输出
     
     **项目特征提取规则**（确定性）：
     - 触发词列表（按完整匹配优先，匹配后从原文移除）：`启动工作流` / `开始开发` / `开始项目` / `开始 SDD` / `/sdd-start` / `安装 SDD` / `安装工作流` / `安装 AGENTS`
     - 去除触发词后，剥离首尾标点（`，` `。` `、` `,` `.` 等）和空白字符
     - 剩余文本作为「项目特征片段」保留为 G0.1 模式 A 的输入
     - 剩余文本为空 / 仅含通用问候词（"你好" / "请帮我" / "麻烦" 等）→ 视为模式 B（无项目特征），G0.1 走模式 B 文案
     - 示例：
       - 输入 `启动工作流，做个砍价小程序` → 提取 `做个砍价小程序`
       - 输入 `安装 SDD 然后帮我搭 Vue3 项目` → 提取 `然后帮我搭 Vue3 项目` → 进一步去除"然后"等连接词 → `帮我搭 Vue3 项目`
       - 输入 `/sdd-start` → 剩余空 → 模式 B
       - 输入 `启动工作流，你好啊` → 提取 `你好啊` → 仅问候 → 模式 B
  4. 进入 G0.1 等任何 §N.N 章节时，仍受 G0.5 阶段执行约束（输出流程声明头、执行自审等所有约束）

**安装异常中断时的兜底**：

- Step 1~5 任一步执行失败（路径检测失败 / 文件已存在冲突 / symlink 创建失败等）→ **停下报错**，无论 entry_type 是什么都不进入 Step 7 接续；输出错误原因 + 修复建议，等待用户处理
- Step 3/Step 4 用户选"N 跳过"或局部"取消"是合法局部跳过，不视为失败，正常进入 Step 6 + Step 7

### B. 更新

1. 重新确定 skill 路径（同 Step 1）
2. 备份旧文件：`cp AGENTS.md AGENTS.md.bak`
3. 读取 `templates/AGENTS.md`，替换 `{SKILL_DIR}`，覆盖写入项目根目录 `AGENTS.md`
4. **Slash Commands 同步**：检查 `~/.claude/commands/` 与 `.claude/commands/` 中的 `sdd-*.md` symlink 是否完整：
   - 若已有 symlink → 自动同步到最新版本（symlink 指向 skill 源文件，无需重建）
   - 若部分缺失 → 询问用户是否补齐（默认推荐补齐）
5. 提示：「AGENTS.md 已更新到 v1.0.3，旧版已备份为 AGENTS.md.bak。CLAUDE.md (symlink) 自动同步，Windows 需重新复制。其他工具 symlink 自动同步所有工具与 slash commands」

### C. 查看状态

```bash
echo "=== 核心文件 ==="
echo "AGENTS.md: $([ -f AGENTS.md ] && echo '✅ 存在' || echo '❌ 不存在')"
if [ -L CLAUDE.md ]; then echo "CLAUDE.md: ✅ symlink → AGENTS.md"
elif [ -f CLAUDE.md ]; then echo "CLAUDE.md: ⚠️ 文件（非 symlink，可能为用户自定义）"
else echo "CLAUDE.md: ❌ 不存在"
fi

echo ""
echo "=== Skill 目录 ==="
# 检查 rules/ 和 templates/ 是否完整
SKILL_DIR=".agents/skills/ny-sdd-workflow"
for f in rules/phase-init.md rules/phase-spec.md rules/phase-coding.md rules/phase-archive.md rules/quality-standards.md rules/skill-routing.md rules/slash-commands.md rules/project-structure.md templates/project-profile.tpl.md templates/project-overview.tpl.md; do
  echo "$SKILL_DIR/$f: $([ -f "$SKILL_DIR/$f" ] && echo '✅' || echo '❌')"
done

echo ""
echo "=== AI 工具同步 ==="
for f in .cursor/rules/ny-sdd-workflow.md .github/copilot-instructions.md .clinerules .windsurfrules .augment/rules/ny-sdd-workflow.md .continue/rules/ny-sdd-workflow.md; do
  if [ -L "$f" ]; then echo "$f: ✅ symlink"
  elif [ -f "$f" ]; then echo "$f: ⚠️ 文件（非 symlink）"
  else echo "$f: ❌ 未安装"
  fi
done

echo ""
echo "=== Slash Commands ==="
COMMANDS=(sdd-init sdd-start sdd-prd-change sdd-bug-fix sdd-prd-audit sdd-front-context sdd-back-context sdd-frontend-standards sdd-java-create sdd-wap-create sdd-reverse-scan sdd-test-case sdd-unit-test)
echo "[用户级 ~/.claude/commands/]"
for c in "${COMMANDS[@]}"; do
  f="$HOME/.claude/commands/$c.md"
  if [ -L "$f" ]; then echo "  $c.md: ✅ symlink"
  elif [ -f "$f" ]; then echo "  $c.md: ⚠️ 文件（非 symlink）"
  else echo "  $c.md: ❌ 未安装"
  fi
done
echo "[项目级 .claude/commands/]"
for c in "${COMMANDS[@]}"; do
  f=".claude/commands/$c.md"
  if [ -L "$f" ]; then echo "  $c.md: ✅ symlink"
  elif [ -f "$f" ]; then echo "  $c.md: ⚠️ 文件（非 symlink）"
  else echo "  $c.md: ❌ 未安装"
  fi
done
```

### D. 卸载

```bash
# 1. AI 工具 symlink
for f in .cursor/rules/ny-sdd-workflow.md .github/copilot-instructions.md .clinerules .windsurfrules .augment/rules/ny-sdd-workflow.md .continue/rules/ny-sdd-workflow.md; do
  [ -L "$f" ] && rm "$f" && echo "🗑 $f"
done

# 2. 项目级 Slash Commands（默认随 AGENTS.md 卸载一起清理）
COMMANDS=(sdd-init sdd-start sdd-prd-change sdd-bug-fix sdd-prd-audit sdd-front-context sdd-back-context sdd-frontend-standards sdd-java-create sdd-wap-create sdd-reverse-scan sdd-test-case sdd-unit-test)
for c in "${COMMANDS[@]}"; do
  f=".claude/commands/$c.md"
  [ -L "$f" ] && rm "$f" && echo "🗑 $f"
done

# 3. 用户级 Slash Commands（默认保留，需用户主动确认是否卸载）
echo ""
echo "用户级 Slash Commands（~/.claude/commands/sdd-*.md）默认保留，因可能被其他项目使用。"
echo "如需卸载，请手动确认后执行："
echo "  for c in ${COMMANDS[@]}; do f=\"\$HOME/.claude/commands/\$c.md\"; [ -L \"\$f\" ] && rm \"\$f\"; done"

echo ""
echo "AGENTS.md 已保留"
# CLAUDE.md 清理：symlink 则删除，普通文件则保留（可能为用户自定义）
if [ -L CLAUDE.md ]; then
  rm CLAUDE.md && echo "🗑 CLAUDE.md (symlink 已移除)"
elif [ -f CLAUDE.md ]; then
  echo "CLAUDE.md 保留（非 symlink，可能为用户自定义内容）"
fi
```

---

## 注意事项

- **路径依赖**：AGENTS.md 中的路径指向 skill 安装目录。skill 被删除后 AI 会提示"文件不存在"，重新安装即可恢复
- **Windows 兼容**：不支持 symlink，AI 工具同步与 Slash Commands 安装自动改用文件复制（`cp`），更新时需重新执行
- **不覆盖**：AGENTS.md / CLAUDE.md 已存在时跳过；各工具指令文件、slash commands 已存在且非 symlink 时跳过并提示
- **Git 提交**：AGENTS.md 需要提交；CLAUDE.md（symlink → AGENTS.md）需要提交；其他 symlink 文件（.clinerules 等）不提交；项目级 slash commands（`.claude/commands/sdd-*.md`）按团队约定决定
- **不要手动改 rules/ 和 tools/**：skill 目录中的 rules/、templates/、tools/、.claude/commands/ 通过更新 ny-sdd-workflow 整包更新，手动修改会被覆盖
- **其他 AI 工具限制**：Cursor/Copilot 等只能读 AGENTS.md 的核心规则（G0 对话初始化 + G1 门禁 + G2 停车 + G3 兜底），无法动态加载阶段文件（§1~§4）及其流程声明头，也不识别 slash commands。完整体验需 Claude Code / Codex
- **Slash Commands 边界**：`/sdd-init` = 装"地基"（一次性，等价本 SKILL.md）；`/sdd-start` = 上"工地"（进入 G0 对话初始化，开始/恢复项目开发）。两者不可混淆
