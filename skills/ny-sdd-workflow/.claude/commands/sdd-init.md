---
description: 安装 / 更新 / 查看状态 / 卸载 SDD Workflow（基础设施层）
---

# /sdd-init — SDD Workflow 基础设施安装

执行 SDD Workflow 的安装流程，等价于自然语言「安装 SDD」「初始化工作流」。

## 执行步骤

1. 定位本 Skill 的安装位置：
   - 项目本地：`.agents/skills/ny-sdd-workflow/`
   - 全局：`~/.claude/skills/ny-sdd-workflow/` 或其他绝对路径
2. 读取该位置下的 `SKILL.md`，按其规范执行 A/B/C/D 四选一：
   - **A. 初始化**（首次安装，生成 AGENTS.md + 各工具 symlink + Slash Commands 安装）
   - **B. 更新**（更新 AGENTS.md 到最新版本）
   - **C. 查看状态**（检查各文件安装情况，含 slash commands）
   - **D. 卸载**（清理 symlink，保留 AGENTS.md）
3. 严格按 SKILL.md 的「第二步：执行对应操作」流程执行，不得跳过任何步骤。

## 与 /sdd-start 的边界

- `/sdd-init` = 装"地基"（写入 AGENTS.md、AI 工具同步、Slash Commands 安装），一次性。
- `/sdd-start` = 上"工地"（进入 G0 对话初始化，开始/恢复项目开发）。

> 安装完成后，下一步请运行 `/sdd-start` 开始项目开发。

## 参数

`$ARGUMENTS`（可选）：直接指定操作，跳过用户选择
- `init` → A. 初始化
- `update` → B. 更新
- `status` → C. 查看状态
- `remove` → D. 卸载
- 留空 → 询问用户四选一
