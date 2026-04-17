---
name: ny-sdd-workflow
description: >
  安装 SDD Workflow v3.7 开发工作流到项目中。自动解析 skill 安装路径，生成 AGENTS.md（核心规则 + 路径已烧录），
  阶段规则文件（rules/）保留在 skill 目录按需读取，并可选同步到其他 AI 工具。

  **v3.7 变更**：编号重构（G 系列全局规则 + §1~§4 阶段编号）+ 流程声明头机制，消灭半整数/跳号/错位，提升 AI 可读性。

  **必须在以下场景触发：**
  - 用户说"启动工作流"、"安装 SDD"、"配置开发规范"
  - 用户说"安装 AGENTS"、"安装 AI 工作流"
  - 新项目需要建立 AI 编码工作流规范时
  - 用户说"更新工作流"、"更新 SDD"

  **注意**：不要与 Claude Code 内置的 /init 命令混淆。/init 是生成 CLAUDE.md 的命令，与本工作流无关。

  产出：① 项目根目录 AGENTS.md（{SKILL_DIR} 已替换为实际路径）② 各 AI 工具指令文件 symlink ③ 初始化状态报告
---

# SDD Workflow 初始化 Skill

本 skill 将 SDD Workflow v3.7 安装到当前项目，自动适配多 AI 工具。

**v3.7 动态加载架构**：

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

**Step 4：输出 .gitignore 建议**（仅在创建了 symlink 时提示）

```
# SDD Workflow symlink（由 ny-sdd-workflow skill 生成，不提交）
.cursorrules
.clinerules
.windsurfrules
# AGENTS.md 需要提交（源文件）
```

**Step 5：输出初始化报告**

```
【SDD Workflow v3.7 初始化完成】

✅ AGENTS.md（核心规则 G0~G3 + 编号流程规约，始终加载）
✅ 阶段规则文件位于：{实际 skill 路径}/rules/（§1~§4 按需加载）
{用户选择的工具列表}
{未选择的工具}

下一步：
  · AGENTS.md 已生效，AI 将按 SDD Workflow v3.7 执行
  · 阶段规则按需动态加载，无需一次性读取全部内容
  · 如需定制项目铁律，编辑 .project/specs/rules/project-profile.md
```

### B. 更新

1. 重新确定 skill 路径（同 Step 1）
2. 备份旧文件：`cp AGENTS.md AGENTS.md.bak`
3. 读取 `templates/AGENTS.md`，替换 `{SKILL_DIR}`，覆盖写入项目根目录 `AGENTS.md`
4. 提示：「AGENTS.md 已更新到 v3.7，旧版已备份为 AGENTS.md.bak，symlink 自动同步所有工具」

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
```

### D. 卸载

```bash
for f in .cursor/rules/ny-sdd-workflow.md .github/copilot-instructions.md .clinerules .windsurfrules .augment/rules/ny-sdd-workflow.md .continue/rules/ny-sdd-workflow.md; do
  [ -L "$f" ] && rm "$f" && echo "🗑 $f"
done
echo "AGENTS.md 已保留"
```

---

## 注意事项

- **路径依赖**：AGENTS.md 中的路径指向 skill 安装目录。skill 被删除后 AI 会提示"文件不存在"，重新安装即可恢复
- **Windows 兼容**：不支持 symlink，AI 工具同步自动改用文件复制（`cp`），更新时需重新执行
- **不覆盖**：AGENTS.md 已存在时跳过；各工具指令文件已存在且非 symlink 时跳过并提示
- **Git 提交**：AGENTS.md 需要提交，symlink 文件（.clinerules 等）不提交
- **不要手动改 rules/**：skill 目录中的 rules/ 和 templates/ 通过 `npx skills add` 更新，手动修改会被覆盖
- **其他 AI 工具限制**：Cursor/Copilot 等只能读 AGENTS.md 的核心规则（G0 对话初始化 + G1 门禁 + G2 停车 + G3 兜底），无法动态加载阶段文件（§1~§4）及其流程声明头。完整体验需 Claude Code / Codex
