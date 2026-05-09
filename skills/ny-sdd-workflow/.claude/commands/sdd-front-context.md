---
description: 扫描前端项目并生成规范文档 frontend-context.md（绑定 SDD §1.3 前端规范提取）
---

# /sdd-front-context — 前端项目规范提取

调用 SDD Workflow 内置的 `front-project-context` Skill，扫描前端项目，提取编码规范、基础配置、公共能力，生成规范文档供后续编码参照。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}`。不存在 → 提示「请先 `/sdd-init`」并退出。
2. 读取 `{SKILL_DIR}/rules/skill-routing.md`。
3. 读取 `{SKILL_DIR}/tools/front-project-context/SKILL.md`，按其规范在**当前工作目录**执行扫描。
4. Skill 默认产出 `FRONT_PROJECT_CONTEXT.md` 在项目根目录 → **必须移动并重命名**为 `.project/specs/rules/frontend-context.md`（与工作流路径一致）。
5. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致）

读取 `.project/context.md` 的 `last` 字段。若 `last` 不在 §1.3（前端规范提取阶段），输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§1.3 前端规范提取

请选择处理方式：
  A. 独立执行（仅扫描产出，不更新 context.md / 不影响工作流状态）
  B. 作为工作流的一部分执行（按 §1.3 流程更新 context.md，并触发"产出物冲突"检查见类 2）
  C. 取消
```

### 类 2：产出物冲突（frontend-context.md 已存在）

若 `.project/specs/rules/frontend-context.md` **已存在**（无论是否走类 1 选 B），输出：

```
【流程冲突提示 — 产出物冲突】
检测到：frontend-context.md 已存在

请选择处理方式：
  A. 备份后重建（备份现有为 frontend-context.md.bak，新产出 mv 后与备份合并：新产出为主，编码期间追加内容保留）
  B. 独立产出（保存为 frontend-context.{时间戳}.md，不影响工作流）
  C. 取消
```

> 工作流约定：context skill 仅在 §1.3 初始化时调用一次，编码过程中新增公共能力直接追加到 frontend-context.md，不重新调用 Skill 覆盖。强制重建走 A 选项的备份合并机制。

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/front-project-context/SKILL.md` 不存在 → 读取 `{SKILL_DIR}/rules/fallback/frontend-scan.md`，按其指令扫描，产出直接写入 `.project/specs/rules/frontend-context.md`，执行日志标注 `内置兜底(fallback/frontend-scan.md)`。

## 参数

`$ARGUMENTS`（可选）：指定扫描的子目录或入口文件。留空 → 按 Skill 默认扫描整个前端代码根目录。
