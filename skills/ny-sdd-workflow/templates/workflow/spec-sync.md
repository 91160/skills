# 人工批注同步 & 需求变更（Spec Sync）

用户可随时触发 specs 同步，支持三种触发源。

---

## 触发方式

- **A. specs 文件变更**：用户说"我改了 XXX" / "重新读取 XXX" / "specs 有更新" / "REQ/DES 有改动" / "我更新了文档" → 直接进入 Step 1
- **B. PRD 需求变更**：用户说"需求变了" / "PRD 改了" / "PRD 更新了" / "新增需求 XXX" / "新增模块 XXX" / "需求有调整" / "功能改了" / "加个功能" / "删掉 XXX 功能" / "XXX 模块要改" → 先执行 Step 0，再进入 Step 1
- **C. 技术文档变更**：用户说"文档更新了" / ".docs 有新文件" / "我加了文档" / "API 文档改了" / "建表脚本更新了" / "接口变了" / "数据库结构改了" → AI 自动判断变更文件位置：
  - `.docs/prd/` 下新增或变更 → 转为触发源 B（PRD 变更），执行 Step 0
  - `.docs/tech/` 下新增或变更 → 执行 Step 0.5
  - `.docs/` 根下文件 → 按内容判断归属，同上分流

---

## 执行步骤

```
Step 0: PRD 变更识别（仅触发源 B 执行）
  → AI 重读 PRD 变更内容
  → 对变更内容执行 PRD 审计（按质量标准 PRD 审计标准，调用 /prd-audit Skill 或兜底 6 维度），P0 问题必须解决后才继续
  → 判断变更类型：
    a. 新增模块：
       - index.md 新增行（编号、模块名、类型、优先级、sync-status: pending、skill-status: pending）
       - 分析与现有模块的依赖关系 → 填入 depends
       - 插入 dev-order（按优先级+依赖关系）
       - 拆子任务（按 §2.0 Step 2 维度）→ 写入 task.md（新增模块章节 + 更新模块总览）
       - 创建 REQ + DES 文件
    b. 已有模块变更：
       - 定位受影响的 REQ + DES
       - 更新 REQ（需求描述、验收标准）→ review-status 重置为 draft
       - 更新 DES（技术方案、接口设计）→ review-status 重置为 draft
       - 可能需要重新拆子任务 → 同步更新 task.md（新增/删除/修改子任务 + 更新模块总览计数）
  → 输出变更摘要，用户确认后
  → 同步更新 project-profile.md「业务架构」「业务流程」区块（如变更涉及业务流程，仅旧项目）
  → 同步更新 project-profile.md「模块架构索引」+ 对应 patterns/*.md（如变更涉及页面/模块新增/删除/架构调整）
  → 同步更新 .outdocs/project-overview.md 的业务相关章节（如变更涉及业务流程）
  → 写入 .outdocs/prd-change-log.md（追加一条变更记录）
```

**prd-change-log.md 记录格式**：

```markdown
### 变更 — {YYYY-MM-DD}
- **变更类型**：{新增模块 / 已有模块变更}
- **变更原因**：{为什么改，谁提出}
- **变更内容**：{具体改了什么}
- **影响模块**：{受影响的模块编号和名称}
- **影响范围**：{REQ/DES/代码/api-doc/dev-order/task.md 哪些受影响}
- **进度影响**：{dev-order 是否调整，当前开发是否受阻}
```

```
Step 0.5: 技术文档变更识别（仅触发源 C 执行）
  → 重新扫描 .docs/，与 project-profile.md「外部依赖」索引对比，识别变更内容
  → 判断影响：
    a. 外部 API 变更 → 定位依赖此 API 的模块 → 更新对应 DES 的接口设计
    b. 数据库结构变更 → 定位涉及此表的模块 → 更新对应 DES 的数据模型
    c. 中间件配置变更 → 定位涉及此中间件的模块 → 更新对应 DES
    d. 新增文档（之前没有的内容）→ 仅更新索引，不影响已有模块
    e. 构建/部署相关变更 → 更新 project-profile.md「构建与运行」区块
  → 输出变更摘要，用户确认后
  → 更新 project-profile.md「外部依赖」索引
  → 进入 Step 1

Step 1: 重读变更涉及的文件（触发源 A 为用户指定文件；触发源 B 为 Step 0 更新的文件；触发源 C 为 Step 0.5 更新的文件）
Step 2: 识别改动点（与 AI 上次已知内容对比），输出改动摘要
Step 3: 用户确认改动识别是否正确
Step 4: 级联更新关联 specs 文件（规则见下表）
Step 5: 一致性扫描与状态更新
         - index.md ↔ 实际文件是否对齐（编号、名称、文件存在性）
         - DES → REQ 引用是否一致
         - task.md ↔ index.md 模块一致性（index.md 有的模块，task.md 是否都有对应章节；缺失 → 自动执行子任务拆分并补入 task.md）
         - patterns/*.md ↔ 模块架构索引一致性（索引中列出的文件是否存在；已删除的页面/模块是否清理了对应 pattern 文件和索引行）
         - 发现不一致 → 输出清单（含影响说明），等待用户确认后修复
         - 检查涉及模块是否已有代码实现：已编码 → sync-status 标记为 outdated，未编码 → 保持不变
Step 6: 写入 change-log-specs.md（用户改动 + AI 级联改动分别记录，触发源 B 标注「PRD 变更」，触发源 C 标注「技术文档变更」）
Step 7: 检查是否存在 outdated 模块，若有则询问：
```

```
【同步确认】
本次改动导致以下模块 specs 与代码不一致：
  - {模块名}（outdated）
是否现在同步代码？
  A. 立即同步（进入标准通道）
  B. 稍后处理（保持 outdated，下次开发时自动触发）
```

---

## 级联规则

| 被改文件 | 可能影响的关联文件 |
|---------|-------------------|
| requirements/REQ-xx | → 对应 design/DES-xx → index.md |
| design/DES-xx | → 对应 requirements/REQ-xx → index.md → context.md → .outdocs/api-doc.md 对应模块章节（如含 API 定义） |
| index.md | → context.md → task.md（模块状态同步） |
| task.md | → index.md（模块状态同步） |
| context.md | → 无级联（终端文件） |
| project-profile.md | → 铁律变更时检查所有 DES 是否冲突 |

---

## 留痕规则

所有改动必须记录到 `.project/specs/change-log-specs.md`，格式：

```markdown
| 序号 | 时间 | 操作人 | 改动文件 | 改动摘要 | 级联更新 |
```

- 操作人标注「用户」或「AI」
- 用户改动：记录改了什么
- AI 级联改动：记录改了哪些文件、改了什么、为什么改
