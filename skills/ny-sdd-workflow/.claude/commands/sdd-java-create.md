---
description: 创建符合公司规范的 Java/Spring Boot 微服务项目脚手架（绑定 SDD §1.1 后端项目初始化）
---

# /sdd-java-create — Java 项目脚手架

调用 SDD Workflow 内置的 `java-project-creator` Skill，基于公司架构规范快速创建 Spring Boot 微服务项目，并产出配套规范文档。

## 执行步骤

1. 读取项目根目录 `AGENTS.md`（如存在）；若 SDD 未初始化，本命令仍可独立执行（但产出不会自动接入工作流）。
2. 读取 `{SKILL_DIR}/rules/skill-routing.md`（仅在 SDD 已初始化时）。
3. 读取 `{SKILL_DIR}/tools/java-project-creator/SKILL.md`，按其规范在**当前工作目录**执行：
   - 第一步：使用 `AskUserQuestion` 一次性收集项目信息（artifactId / groupId / 中文描述 / 父 POM 等）
   - 第二步及之后：按 Skill 规范生成完整项目脚手架（pom.xml + 分层目录 + 核心代码 + 规范文档）
4. 输出标准 Skill 执行日志（阶段 / Skill / 路径 / 执行方式）。

## 流程冲突保护

### 类 1：阶段冲突（last 与命令绑定阶段不一致）

若 `.project/context.md` 已存在且 `last` 字段不在 §1.1（脚手架创建阶段），输出：

```
【流程冲突提示 — 阶段冲突】
当前工作流阶段：{last 字段}
本命令绑定阶段：§1.1 后端项目初始化

请选择处理方式：
  A. 独立执行（在当前目录或子目录创建新项目，不更新 SDD 工作流状态）
  B. 取消
```

### 类 2：产出物冲突（已有 Java 项目结构）

若当前目录已存在 `pom.xml` / `build.gradle` 或 Java 源码目录，输出：

```
【流程冲突提示 — 产出物冲突】
检测到当前目录已有 Java 项目结构（pom.xml / src/main/java 等）。

请选择处理方式：
  A. 在子目录创建新项目（如 ./{artifactId}/）
  B. 取消（避免覆盖现有项目）
```

## Skill 文件缺失兜底

`{SKILL_DIR}/tools/java-project-creator/SKILL.md` 不存在 → 使用 Spring Boot 官方 CLI 兜底（如 `npx create-spring-boot` 或 `spring init`），执行日志标注 `内置兜底(官方 CLI)`。

## 产出

- 完整可运行的 Java 项目脚手架（pom.xml / 分层目录 / 核心代码）
- 项目规范文档（.md）
- 若 SDD 已初始化，可通过 `/sdd-back-context` 进一步生成 `.project/specs/rules/backend-context.md`

## 参数

`$ARGUMENTS`（可选）：指定项目目录名。留空 → Skill 内交互询问。
