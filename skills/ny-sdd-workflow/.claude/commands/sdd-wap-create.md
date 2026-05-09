---
description: 基于 template-vue3 创建符合公司规范的前端 H5 项目（绑定 SDD §1.1 前端项目初始化）
---

# /sdd-wap-create — 前端 H5 项目脚手架

调用 SDD Workflow 内置的 `wap-project-creator` Skill，基于公司内部 template-vue3 模板克隆并完成关键配置修改，输出配套规范文档 CONVENTIONS.md。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`（如存在）；若 SDD 未初始化，本命令仍可独立执行（但产出不会自动接入工作流）。
2. 读取 `{SKILL_DIR}/rules/skill-routing.md`（仅在 SDD 已初始化时）。
3. 读取 `{SKILL_DIR}/tools/wap-project-creator/SKILL.md`，按其规范在**当前工作目录**执行：
   - 第一步：使用 `AskUserQuestion` 一次性收集项目信息（appName / description）
   - 后续：克隆 template-vue3，修改 vite.config.mts / Jenkinsfile / package.json 关键配置，生成 CONVENTIONS.md
4. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致）

若 `.project/context.md` 已存在且 `last` 字段不在 §1.1（脚手架创建阶段），输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§1.1 前端项目初始化

请选择处理方式：
  A. 独立执行（在当前目录或子目录创建新项目，不更新 SDD 工作流状态）
  B. 取消
```

### 类 2：产出物冲突（已有前端项目结构）

若当前目录已存在 `package.json` / `vite.config.*` / `node_modules/` 等前端项目特征，输出：

```
【流程冲突提示 — 产出物冲突】
检测到当前目录已有前端项目结构（package.json 等）。

请选择处理方式：
  A. 在子目录克隆新项目（如 ./{appName}/）
  B. 取消（避免覆盖现有项目）
```

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/wap-project-creator/SKILL.md` 不存在 → 使用 Vue 官方 CLI 兜底（如 `npm create vue@latest`），执行日志标注 `内置兜底(官方 CLI)`。

## 产出

- 基于 template-vue3 克隆并配置好的完整项目目录
- 项目规范文档 CONVENTIONS.md
- 若 SDD 已初始化，可通过 `/sdd-front-context` 进一步生成 `.project/specs/rules/frontend-context.md`

## 参数

`$ARGUMENTS`（可选）：指定 appName。留空 → Skill 内交互询问。
