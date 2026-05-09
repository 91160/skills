---
description: 应用前端编码规范（绑定 SDD §3.5 前端代码变更）
---

# /sdd-frontend-standards — 前端编码规范

调用 SDD Workflow 内置的 `frontend-code-standards` Skill，按通用前端编码规范编写、修改或审查代码；提交前必须运行检查清单。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}`。不存在 → 提示「请先 `/sdd-init`」并退出。
2. 读取 `{SKILL_DIR}/rules/skill-routing.md`。
3. 读取 `{SKILL_DIR}/tools/frontend-code-standards/SKILL.md`，按其规范在**当前工作目录**执行：
   - 自动识别 TS/JS 环境，按需加载规则
   - 应用编码、修改、审查、提交前检查清单
   - 项目特有规则（`CLAUDE.md` / `code_standards.md` / `frontend-context.md`）优先级高于本 Skill
4. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致）

读取 `.project/context.md` 的 `last` 字段。若 `last` 不在 §3.x（编码阶段），输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§3.5 前端代码变更

请选择处理方式：
  A. 独立执行（仅作前端编码规范参考，不更新 index.md 的 coding-skill 状态）
  B. 作为工作流的一部分执行（按 §3.5 流程更新 coding-skill 状态）
  C. 取消
```

### 类 2：产出物冲突（frontend-context.md 已存在）

若 `.project/specs/rules/frontend-context.md` **已存在**（旧项目场景），输出：

```
【流程冲突提示 — 产出物冲突】
检测到 frontend-context.md 已存在。工作流约定：
  · 有 context 文件（旧项目）→ 以 context 文件为编码规范，跳过 frontend-coding Skill
  · 无 context 文件（新项目）→ 使用 frontend-code-standards Skill

请选择处理方式：
  A. 强制执行 frontend-code-standards Skill（与 frontend-context.md 同时作为参考，融合优先级见下方）
  B. 跳过 Skill，仅以 frontend-context.md 为准（符合工作流约定）
  C. 取消
```

## 融合优先级（编码与审查时）

- 有 frontend-context.md：`project-profile.md 铁律 > frontend-context.md > frontend-code-standards Skill > C-01~C-10 / U-01~U-06`
- 无 frontend-context.md：`project-profile.md 铁律 > frontend-code-standards Skill > C-01~C-10 / U-01~U-06`

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/frontend-code-standards/SKILL.md` 不存在 → 使用内置 C-01~C-10（编码规约）+ U-01~U-06（UI 还原规约），执行日志标注 `内置兜底(C-01~C-10 + U-01~U-06)`。

## 参数

`$ARGUMENTS`（可选）：指定要检查的文件或目录。留空 → 按 Skill 默认扫描当前任务涉及的前端文件。
