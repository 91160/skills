---
description: 深度业务代码扫描，建立函数级代码认知层（绑定 SDD §1.4 深度业务代码扫描）
---

# /sdd-reverse-scan — 深度业务代码扫描

调用 SDD Workflow 内置的 `reverse-scan` Skill，从已有代码自底向上提取函数级知识卡片、调用关系图、模块地图，并为每个已有模块反推 DES + REQ。

## 核心原则

代码是唯一事实源。所有上层知识（模块划分、业务架构、业务流程）必须从底层代码事实中聚合涌现，**禁止从目录结构或文件命名猜测先入为主**。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}`。不存在 → 提示「请先 `/sdd-init` 并完成 §1.1/§1.2 项目初始化」并退出。
2. 读取 `{SKILL_DIR}/rules/skill-routing.md`。
3. 读取 `{SKILL_DIR}/tools/reverse-scan/SKILL.md`，按其规范在**当前工作目录**执行扫描。
4. 产出位置（**与正向 Spec 体系路径隔离**）：`.project/reverse-scan/`
   - `knowledge-cards/*.md`（逐文件函数级知识卡片）
   - `call-graph.md`（全局调用关系图）
   - `module-map.md`（已有模块划分 + 职责 + 依赖）
   - `db-schema.md`（完整数据库结构）
   - `specs/design/DES-*.md`（已有模块逆向设计规格）
   - `specs/requirements/REQ-*.md`（已有模块逆向需求规格）
   - `profile-patch.md` / `overview.md` / `api-doc.md` / `scan-summary.md`（合并就绪文件）
5. **AI 执行合并**（Skill 不直接写入主工作流文件，由本命令统一合并）：
   - `profile-patch.md` → 合并到 `project-profile.md`「业务架构」「业务流程」区块
   - `overview.md` → 写入 `.outdocs/project-overview.md`
   - `api-doc.md` → 写入 `.outdocs/api-doc.md`
   - `scan-summary.md` → 追加到 `.project/context.md`
6. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致）

读取 `.project/context.md` 的 `last` 字段。若 `last` 不在 §1.4（深度扫描阶段），输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§1.4 深度业务代码扫描

请选择处理方式：
  A. 独立执行（仅产出 .project/reverse-scan/ 文件，不合并到 profile/overview/api-doc/context）
  B. 作为工作流的一部分执行（按 §1.4 流程合并到主工作流文件）
  C. 取消
```

### 类 2：产出物冲突（.project/reverse-scan/ 已存在）

若 `.project/reverse-scan/` **已存在**（此前已扫描过），输出：

```
【流程冲突提示 — 产出物冲突】
检测到 .project/reverse-scan/ 已存在。
工作流约定：Skill 在旧项目初始化流程的 §1.4 深度业务代码扫描阶段（隶属 §1.2 旧项目流程）调用一次，产出为快照。

请选择处理方式：
  A. 全量重新扫描（备份现有产出为 .project/reverse-scan.bak.{时间戳}/，重新执行）
  B. 取消
```

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/reverse-scan/SKILL.md` 不存在 → 执行 `phase-init.md` §1.2 中「兜底：业务架构与流程提取」（浅层扫描：路由/控制器 + 服务层入口方法 → 写入 `project-profile.md`「业务架构」「业务流程」区块），执行日志标注 `内置兜底(浅层业务架构推断)`。

## 后续阶段消费

存在 `.project/reverse-scan/` 时，后续阶段自动加载：
- §2.1 任务拆分 → `module-map.md`
- §2.2 需求分析 → 知识卡片 + 逆向 REQ
- §2.3 方案设计 → 知识卡片 + 逆向 DES + `call-graph.md` + `db-schema.md`
- §3.1.2 编码上下文 → 知识卡片 + 调用链路
- §3.4 影响面评估 → `call-graph.md` 关键节点

## 参数

`$ARGUMENTS`（可选）：指定扫描的子目录或入口（如某个模块路径）。留空 → 全量扫描。
