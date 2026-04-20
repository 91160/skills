# Reverse Scan

深度业务代码扫描 Skill，为 SDD Workflow 的旧项目初始化提供函数级代码认知。

## 是什么

从已有代码**自底向上**提取完整的代码认知层：

- **知识卡片**：逐文件逐函数的业务语义、调用关系、数据操作
- **调用关系图**：全局函数调用链路 + 被多方调用的关键节点
- **模块地图**：从代码事实中涌现的模块划分 + 职责 + 依赖
- **Spec 快照**：每个已有模块的 DES + REQ（逆向生成，仅供参考）
- **数据库结构**：完整的表/字段/约束/索引定义

## 为什么需要

主工作流的内置扫描是目录级的浅层推断。对于中大型遗留项目，浅层扫描容易：

- 遗漏深藏在 Service 层的业务逻辑
- 猜错模块边界（从目录结构推断 vs 从调用关系涌现）
- 无法精确定位可复用的已有函数

本 Skill 通过逐函数级别的深度扫描解决这些问题，使后续编码时 AI 能精准复用已有的业务逻辑、函数方法、中间件封装和架构模式。

## 与 SDD Workflow 的关系

```
主工作流旧项目初始化
  ├── 基础扫描（技术栈/依赖/context）       ← 必执行
  ├── 调用 reverse-scan Skill               ← 有 Skill 时执行
  │     └── 知识卡片 + 调用关系图 + 模块地图 + Spec 快照
  │         → 生成合并就绪文件（profile-patch/overview/api-doc）
  │         → 跳过下方兜底
  └── 兜底：浅层业务架构推断                 ← Skill 不可用时执行
```

**安装了 = 深度扫描；没装 = 现有行为不变。**

## 产出物

所有产出在 `.project/reverse-scan/` 目录下（与正向 Spec 体系路径隔离）：

```
.project/reverse-scan/
├── knowledge-cards/           ← 知识卡片（逐文件）
│   ├── src--service--ReportService.md
│   ├── src--controller--ReportController.md
│   └── ...
├── call-graph.md              ← 全局调用关系图
├── module-map.md              ← 模块地图
├── db-schema.md               ← 数据库结构
├── specs/
│   ├── requirements/REQ-*.md  ← 已有模块 REQ（逆向，仅供参考）
│   └── design/DES-*.md        ← 已有模块 DES（逆向，仅供参考）
├── verification-report.md     ← 交叉验证报告
├── grey-decisions.md          ← 灰色决策日志
└── scan-summary.md            ← 扫描完成报告
```

## 下游如何使用

| 产出物 | 典型消费场景 | 用途 |
|--------|-------------|------|
| module-map.md | 任务拆分 | 新需求归入已有模块 or 新建模块 |
| 知识卡片 | 需求分析 / 方案设计 / 编码 / 审计 | 界定新旧边界、精准复用已有方法 |
| call-graph.md | 方案设计 / 影响面评估 | 确保不重复、评估波及范围 |
| db-schema.md | 方案设计 / 文档学习 / 影响面评估 | 确认表结构、评估数据关联 |
| REQ / DES | 需求分析 / 方案设计 / 编码 | 了解已有功能和技术方案 |
| profile-patch.md | 初始化合并 | 业务架构/流程 |
| overview.md / api-doc.md | 初始化合并 | 项目全景 / 接口文档 |

## 安装

**已内置在 ny-sdd-workflow 的 `tools/reverse-scan/` 目录下**，安装 ny-sdd-workflow 后即可使用，无需单独安装。

## 执行流程

```
Phase 1: 基础设施增强（db-schema + 公共能力细化）
         ↓ 审计 A1 通过
Phase 2: 底层知识提取（逐文件知识卡片 + 调用关系图）
         ↓ 审计 A2 通过
Phase 3: 知识聚合与模块发现（四维聚类 → 模块地图）
         ↓ 审计 A3 通过
Phase 4: 已有模块 Spec 生成（逐模块 DES + REQ）
         ↓ 每模块 A4-DES + A4-REQ 通过
Phase 5: 项目级文档整合（生成合并就绪文件：profile-patch + overview + api-doc）
         ↓ 审计 A5 通过
Phase 6: 全局交叉验证 + 收尾
         ↓ 审计 A6 通过
完成 → 输出扫描报告 → 控制权交还调用方
```

每个阶段之间有审计关卡，不通过则循环修复（上限 5 次）。

## Skill 目录结构

```
reverse-scan/
├── SKILL.md              ← Skill 入口
├── README.md             ← 本文件
└── rules/
    ├── scan-workflow.md   ← 完整扫描流程（6 Phase + 审计）
    └── card-template.md   ← 所有产出物的格式模板
```
