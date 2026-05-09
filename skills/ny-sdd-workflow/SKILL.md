---
name: ny-sdd-workflow
description: >
  安装 SDD Workflow v1.0.2 开发工作流到项目中。自动解析 skill 安装路径，生成 AGENTS.md（核心规则 + 路径已烧录），
  阶段规则文件（rules/）保留在 skill 目录按需读取，并可选同步到其他 AI 工具。

  **v1.0.2 架构**：G 系列全局规则 + §1~§4 阶段编号 + 流程声明头机制 + 动态加载 + 13 个 Slash Commands，兼容多 AI 工具。

  **必须在以下场景触发：**
  - 用户说"安装 SDD"、"安装 AGENTS"、"安装 AI 工作流"、"配置开发规范"
  - 用户运行 `/sdd-init` 命令
  - 用户说"启动工作流"、"开始开发" **且项目根目录无 `AGENTS.md`**（兜底：未装 SDD 时帮用户先装好再让其再次"启动"）
  - 新项目需要建立 AI 编码工作流规范时
  - 用户说"更新工作流"、"更新 SDD"

  **注意**：
  - 不要与 Claude Code 内置的 /init 命令混淆。/init 是生成 CLAUDE.md 的命令，与本工作流无关。
  - 用户说"启动工作流"或运行 `/sdd-start`：默认是**进入项目开发流程**（G0 对话初始化）。仅当 AGENTS.md 不存在时才转入本 Skill 完成基础设施安装；安装完成后提示用户再说一次"启动工作流"或运行 `/sdd-start` 进入 G0。

  产出：① 项目根目录 AGENTS.md（{SKILL_DIR} 已替换为实际路径）② 各 AI 工具指令文件 symlink ③ Slash Commands 安装（用户级 / 项目级 / 跳过 三选一）④ 初始化状态报告
---

# SDD Workflow 初始化 Skill

本 skill 将 SDD Workflow v1.0.2 安装到当前项目，自动适配多 AI 工具。

**v1.0.2 动态加载架构**：

```
AGENTS.md（始终加载）
  └── G0 对话初始化 + G1 写码门禁 + G2 停车信号 + G3 未覆盖场景兜底 + 阶段路由表
        ↓ AI 根据 context.md 状态按需读取
{SKILL_DIR}/rules/phase-init.md      §1 项目启动
{SKILL_DIR}/rules/phase-spec.md      §2 需求/设计/评审
{SKILL_DIR}/rules/phase-coding.md    §3 编码变更通道（§3.1~§3.11）
{SKILL_DIR}/rules/phase-archive.md   §4 归档
{SKILL_DIR}/rules/quality-standards.md  审计标准（审计时读取）
{SKILL_DIR}/rules/skill-routing.md      Skill 路由（安装/调用时读取）

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

**Step 1：确定 skill 安装路径**

检测本 skill 的安装位置，用于生成 AGENTS.md 中的文件引用路径：

- 项目本地安装（`.agents/skills/ny-sdd-workflow/`）→ 使用**相对路径**：`.agents/skills/ny-sdd-workflow`
- 全局安装（`~/.claude/skills/ny-sdd-workflow/` 或其他位置）→ 使用**绝对路径**

> **绝对路径必须完整展开**（最高优先级约束）：
> - ❌ **禁止**写成 `~/.claude/skills/ny-sdd-workflow`（`~` 在 Read 工具中不展开，会导致后续读取失败）
> - ✅ **必须**写成 `/Users/{username}/.claude/skills/ny-sdd-workflow`（macOS）/ `/home/{username}/.claude/skills/ny-sdd-workflow`（Linux）/ `C:\Users\{username}\.claude\skills\ny-sdd-workflow`（Windows）
> - 检测方法：用 Bash 工具运行 `echo $HOME` 或 `pwd`（在 skill 目录内），获取完整展开后的绝对路径
> - 走本地 CLI 路径（`node <SDD_DIR>/bin/cli.js init`）时，cli.js 的 `path.resolve()` 自动完整展开，无需手动处理；走 SKILL.md 路径（AI 对话中说"安装 SDD"）时，AI 必须用 Bash 工具显式获取完整展开后的路径再写入 AGENTS.md

**Step 2：生成 AGENTS.md**

检查项目根目录是否已存在 AGENTS.md：
- 已存在 → 提示用户「AGENTS.md 已存在，跳过。如需更新请选 B」
- 不存在 → 读取本 skill 目录下的 `templates/AGENTS.md`，将其中所有 `{SKILL_DIR}` 替换为 Step 1 确定的实际路径，写入项目根目录 `AGENTS.md`

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

```
【SDD Workflow v1.0.2 安装完成】

✅ AGENTS.md（核心规则 G0~G3 + 编号流程规约，始终加载）
✅ 阶段规则文件位于：{实际 skill 路径}/rules/（§1~§4 按需加载）
{用户选择的 AI 工具列表}
{未选择的 AI 工具}

✅ Slash Commands（{用户级 ~/.claude/commands/ / 项目级 .claude/commands/ / 已跳过}）
   - 流程：/sdd-init /sdd-start /sdd-prd-change /sdd-bug-fix
   - 工具：/sdd-prd-audit /sdd-front-context /sdd-back-context /sdd-frontend-standards
           /sdd-java-create /sdd-wap-create /sdd-reverse-scan /sdd-test-case /sdd-unit-test

下一步：
  · 运行 /sdd-start 进入此项目的开发流程（或直接说"启动工作流"）
  · 阶段规则按需动态加载，无需一次性读取全部内容
  · 如需定制项目铁律，编辑 .project/specs/rules/project-profile.md
```

### B. 更新

1. 重新确定 skill 路径（同 Step 1）
2. 备份旧文件：`cp AGENTS.md AGENTS.md.bak`
3. 读取 `templates/AGENTS.md`，替换 `{SKILL_DIR}`，覆盖写入项目根目录 `AGENTS.md`
4. **Slash Commands 同步**：检查 `~/.claude/commands/` 与 `.claude/commands/` 中的 `sdd-*.md` symlink 是否完整：
   - 若已有 symlink → 自动同步到最新版本（symlink 指向 skill 源文件，无需重建）
   - 若部分缺失 → 询问用户是否补齐（默认推荐补齐）
5. 提示：「AGENTS.md 已更新到 v1.0.2，旧版已备份为 AGENTS.md.bak，symlink 自动同步所有工具与 slash commands」

### C. 查看状态

```bash
echo "=== 核心文件 ==="
echo "AGENTS.md: $([ -f AGENTS.md ] && echo '✅ 存在' || echo '❌ 不存在')"

echo ""
echo "=== Skill 目录 ==="
# 检查 rules/ 和 templates/ 是否完整
SKILL_DIR=".agents/skills/ny-sdd-workflow"
for f in rules/phase-init.md rules/phase-spec.md rules/phase-coding.md rules/phase-archive.md rules/quality-standards.md rules/skill-routing.md templates/project-profile.tpl.md templates/project-overview.tpl.md; do
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
```

---

## 注意事项

- **路径依赖**：AGENTS.md 中的路径指向 skill 安装目录。skill 被删除后 AI 会提示"文件不存在"，重新安装即可恢复
- **Windows 兼容**：不支持 symlink，AI 工具同步与 Slash Commands 安装自动改用文件复制（`cp`），更新时需重新执行
- **不覆盖**：AGENTS.md 已存在时跳过；各工具指令文件、slash commands 已存在且非 symlink 时跳过并提示
- **Git 提交**：AGENTS.md 需要提交，symlink 文件（.clinerules 等）不提交；项目级 slash commands（`.claude/commands/sdd-*.md`）按团队约定决定
- **不要手动改 rules/ 和 tools/**：skill 目录中的 rules/、templates/、tools/、.claude/commands/ 通过更新 ny-sdd-workflow 整包更新，手动修改会被覆盖
- **其他 AI 工具限制**：Cursor/Copilot 等只能读 AGENTS.md 的核心规则（G0 对话初始化 + G1 门禁 + G2 停车 + G3 兜底），无法动态加载阶段文件（§1~§4）及其流程声明头，也不识别 slash commands。完整体验需 Claude Code / Codex
- **Slash Commands 边界**：`/sdd-init` = 装"地基"（一次性，等价本 SKILL.md）；`/sdd-start` = 上"工地"（进入 G0 对话初始化，开始/恢复项目开发）。两者不可混淆
