---
name: ny-sdd-workflow
description: >
  初始化 SDD Workflow 开发工作流到项目中，生成 AGENTS.md 并自动创建各 AI 工具的指令文件 symlink。

  **必须在以下场景触发：**
  - 用户说"初始化工作流"、"安装 SDD"、"配置开发规范"
  - 用户说"初始化 AGENTS"、"安装 AI 工作流"
  - 新项目需要建立 AI 编码工作流规范时
  - 用户说"更新工作流"、"更新 SDD"

  产出：① 项目根目录 AGENTS.md ② 各 AI 工具指令文件 symlink ③ 初始化状态报告
---

# SDD Workflow 初始化 Skill

本 skill 的目标是：将 SDD Workflow v3.4 工作流规则安装到当前项目（主文件 AGENTS.md + .agents/workflow/ 子文件），并自动适配多个 AI 编码工具。

---

## 第一步：确认操作类型

询问用户：

```
【SDD Workflow】
请选择操作：
  A. 初始化（首次安装，生成 AGENTS.md + 各工具 symlink）
  B. 更新（更新 AGENTS.md 到最新版本）
  C. 查看状态（检查各工具安装情况）
  D. 卸载（清理 symlink，保留 AGENTS.md）
```

---

## 第二步：执行对应操作

### A. 初始化

**Step 1：生成 AGENTS.md**

检查项目根目录是否已存在 AGENTS.md：
- 已存在 → 提示用户「AGENTS.md 已存在，跳过。如需更新请选 B」
- 不存在 → 将下方「AGENTS.md 模板内容」部分的完整内容写入项目根目录 `AGENTS.md`

**Step 2：询问用户是否同步到其他 AI 工具**

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
# 获取 AGENTS.md 绝对路径
AGENTS_FILE="$(pwd)/AGENTS.md"

# 根据用户选择，为对应工具创建 symlink（以下为各工具命令，按选择执行）
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

用户选择 N（跳过）→ 不创建任何 symlink，仅 AGENTS.md 生效（Claude Code / Codex 原生读取）。

**Step 3：输出 .gitignore 建议**（仅在创建了 symlink 时提示）

提示用户将以下内容添加到 `.gitignore`（如尚未包含）：

```
# SDD Workflow symlink（由 ny-sdd-workflow skill 生成，不提交）
.cursorrules
.clinerules
.windsurfrules
# AGENTS.md 需要提交（源文件）
```

**Step 4：输出初始化报告**

```
【SDD Workflow 初始化完成】

✅ AGENTS.md（Claude Code / Codex 原生读取）
✅ .agents/workflow/（6 个工作流子文件）
{用户选择的工具列表，每项一行，格式：✅ {路径} → AGENTS.md（{工具名}）}
{未选择的工具：⏭ {工具名}（未同步）}

下一步：
  · AGENTS.md + .agents/workflow/ 已生效，AI 将按 SDD Workflow v3.4 执行
  · 如需定制项目铁律，编辑 .project/specs/rules/project-custom.md
  · 如需后续添加其他工具同步，重新运行初始化
```

### B. 更新

1. 将下方「AGENTS.md 模板内容」覆盖写入项目根目录 `AGENTS.md`
2. 提示：「AGENTS.md 已更新到 v3.0，symlink 自动同步所有工具」

### C. 查看状态

检查各文件是否存在，输出状态表：

```bash
echo "AGENTS.md: $([ -f AGENTS.md ] && echo '✅ 存在' || echo '❌ 不存在')"
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

## AGENTS.md 模板内容

> **AI 执行说明**：执行初始化（A）或更新（B）时，将以下 `<agents-template>` 标签内的完整内容写入项目根目录 AGENTS.md。

<agents-template>

此处放置 SDD Workflow v3.0 的完整 AGENTS.md 内容。
由于内容较长，实际使用时应读取同仓库目录下的 templates/AGENTS.md 文件。

AI 执行时：读取 .agents/skills/ny-sdd-workflow/ 目录下的 templates/AGENTS.md，
如果不存在则提示用户「模板文件缺失，请重新安装 skill」。

</agents-template>

---

## 注意事项

- Windows 系统不支持 symlink，自动改用文件复制（`cp`），更新时需重新执行
- 初始化前检查项目根目录是否已有 AGENTS.md，避免覆盖用户自定义内容
- 各工具指令文件如已存在且非 symlink，不覆盖，提示用户手动处理
- 生成的 symlink 文件不应提交到 git，AGENTS.md 源文件需要提交
