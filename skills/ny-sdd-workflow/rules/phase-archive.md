# 阶段：归档（§2.8）

模块完成后，逐项检查以下清单，全部 ✅ 才可归档：

| # | 检查项 | 适用条件 | 未通过处理 |
|---|--------|---------|-----------|
| 1 | 代码审计通过（§3 Step 5） | 标准通道 | 回 Step 5 |
| 2 | 开发自测通过（§3 Step 6） | 标准通道 | 回 Step 4 |
| 3 | REQ + DES 存在且 `review-status: approved` | 标准通道 | 回 §2.1/§2.2 |
| 4 | changelog 写入（§3 Step 7） | 标准 + 快速 | 执行 Step 7 |
| 5 | task.md 当前模块子任务全 `done`，模块状态更新为 `[done]` | 有 task.md 时 | 未全done → 输出未完成清单，询问用户；全done → 更新模块header为 `[done]` |
| 6 | api-doc.md 已更新 | 有新增或变更 API 时 | 从 DES 提取追加或更新对应章节 |
| 7 | context 文件已更新（新公共能力） | 编码中发现新能力时 | 追加到对应 context 文件（frontend-context.md / backend-context.md）的「内部公共能力」章节 |
| 8 | index.md sync-status → `synced` | feature 类型（index.md 有对应条目） | 执行 Step 7.5 |
| 9 | index.md `coding-skill` 和 `audit-skill` → `pending` | feature 类型（index.md 有对应条目） | 重置 |
| 10 | context.md 写入（§3 Step 8） | 所有通道 | 执行 Step 8 |
| 11 | 受影响模块 DES 已同步更新 | Bug / Refactor 类型且 REQ 有 `affected-module` | 对照 DES「受影响 Spec 变更清单」逐项确认已更新到受影响模块 DES |
| 12 | api-doc.md 已同步更新（级联） | Bug / Refactor 涉及 API 行为变更时 | 确认 api-doc.md 对应章节已反映变更后的 API 定义 |

归档后：
- 标注任务类型标签：`[Feature]` / `[Bug]` / `[Refactor]`
- 生成任务执行摘要：汇总 REQ、子任务完成情况（含 task.md 进度）、接口清单、代码变更概要，以模块章节形式追加到 `.outdocs/task-report.md`

**feature 类型**：根据执行模式（§2.0 Step 4 选择）衔接下一模块：

  **连续模式**：自动进入 dev-order 下一轮模块，输出简要通知后直接开始：

  ```
  【模块完成】{当前模块名} 已归档。
  自动进入下一模块：{编号}-{模块名}（dev-order: {N}，子任务: {M} 项）
  ```

  所有模块完成后输出：

  ```
  【全部模块完成】所有 dev-order 模块已归档。
  ```

  **逐个确认模式（默认）**：询问用户确认：

  ```
  【模块完成】{当前模块名} 已归档。
  下一模块：{编号}-{模块名}（dev-order: {N}）
  是否进入？
    A. 进入（task.md 已有子任务明细，直接进入 §2.1）
    B. 跳过，选择其他模块
    C. 暂停开发
  ```

**bug / refactor 类型**：不自动衔接，归档后询问用户下一步：

```
【任务完成】{当前任务} 已归档。
下一步？
  A. 继续处理其他 Bug / 优化
  B. 回到 feature 开发（按 dev-order 继续）
  C. 暂停
```
