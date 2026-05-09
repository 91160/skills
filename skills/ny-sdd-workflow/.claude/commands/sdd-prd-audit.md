---
description: 对 PRD 文档执行结构化审计（绑定 SDD §1.1 / §1.2(feature) / §2.6[prd]）
---

# /sdd-prd-audit — PRD 需求审计

调用 SDD Workflow 内置的 `prd-audit` Skill，对 PRD 文档执行 6 维度结构化审计。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}` 真实路径。不存在 → 提示「请先 `/sdd-init`」并退出。
2. 读取 `{SKILL_DIR}/rules/skill-routing.md`，按统一 Skill 执行流程处理。
3. 读取 `{SKILL_DIR}/tools/prd-audit/SKILL.md`，按其规范在**当前工作目录**执行审计。
4. 输出标准 Skill 执行日志：
   ```
   【Skill 执行日志】
     阶段: {绑定阶段，如 §1.1 / §2.6[prd] / 独立调用}
     Skill: prd-audit
     路径: {SKILL_DIR}/tools/prd-audit/
     执行: 调用Skill / 内置兜底
   ```
5. 输出标准化审计报告（覆盖完整性、一致性、可行性、边界清晰度、优先级合理性、安全与合规六大维度）。

## 流程冲突保护

### 类 1：阶段冲突（last 字段与命令绑定阶段不一致时）

读取 `.project/context.md` 的 `last` 字段判断当前阶段。**B 选项「工作流内执行」按 `last` 动态路由**，不同阶段进入不同流程：

| 当前 `last` 阶段 | B 选项实际进入的流程 | 说明 |
|---|---|---|
| `last` 在 G0.x / §1.1 / §1.2(feature) | §1.1 / §1.2 内的 PRD 审计循环 | 首次审计，P0 必须解决后才继续后续步骤 |
| `last` 在 §2.x / §3.x / §4 | §2.6 Spec Sync `[prd]` 全流程 | 当成需求变更同步，触发级联（REQ/DES/api-doc/TC/单测） |
| `last` 不明或在 §1.3 / §1.4 等中间状态 | 触发 G2 停车，让用户裁决 | 避免误判 |

冲突提示：

```
【流程冲突提示】
当前工作流阶段：{last 字段}
本命令绑定阶段：§1.1 / §1.2(feature) / §2.6[prd]
冲突点：{具体冲突，如"当前在 §3 编码阶段，重审 PRD 可能涉及级联变更"}

请选择处理方式：
  A. 独立执行（仅产出审计报告，不更新 context.md / index.md / 不触发级联）
  B. 作为工作流的一部分执行（按当前阶段动态路由：§1 阶段 → 走首次审计循环；§2~§4 阶段 → 走 §2.6 Spec Sync [prd]）
  C. 取消
```

> 当前 `last` 与命令绑定阶段一致（如刚好在 §1.1 或 §2.6 触发期间）→ **不弹冲突提示，直接按工作流约定执行**。

### 类 2：产出物冲突

本命令产出物（PRD 审计报告）每次执行都会重新生成，无产出物冲突场景。

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/prd-audit/SKILL.md` 不存在 → 使用 `{SKILL_DIR}/rules/quality-standards.md` 中 PRD 审计标准兜底（新项目 6 维度 / 单功能 4 维度），执行日志的"执行"字段标注为 `内置兜底(quality-standards.md)`。

## 参数

`$ARGUMENTS`（可选）：指定 PRD 文件或路径。留空 → 默认扫描 `.docs/prd/` 全部文件。
