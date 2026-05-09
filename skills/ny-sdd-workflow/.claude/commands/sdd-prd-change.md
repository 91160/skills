---
description: PRD 需求变动后的同步流程（触发 §2.6 Spec Sync [prd]）
---

# /sdd-prd-change — PRD 需求变动同步

触发 SDD Workflow 的 §2.6 Spec Sync 流程，触发源标签 `[prd]`。等价自然语言「需求变了」「PRD 改了」「新增模块 XXX」。

## 前置检查

1. 读取项目根目录 `AGENTS.md`，定位 `{SKILL_DIR}` 真实路径。不存在 → 提示「工作流尚未安装，请先 `/sdd-init`」并退出。
2. 读取 `.project/context.md`：
   - 不存在 → 提示「项目尚未启动开发，请先 `/sdd-start`」并退出。
   - 存在 → 记录**倒数第一条记录的 last 字段**作为「触发前状态」（执行结束后用于回归原阶段）。

## 阶段执行约束（与 G0.5 一致）

进入 §2.6 章节执行动作前，AI **必须**先输出 §2.6 的流程声明头作为可见凭证（严格与 `{SKILL_DIR}/rules/phase-spec.md` §2.6 章节顶部声明头一致）：

```
【进入 §2.6 Spec Sync（人工批注同步 & 需求变更）】
> **流程声明**
> - phase: spec
> - step: 6/7
> - prev: none
> - next: none
> - gate: none
> - blocking: true
```

> §2.6 是横切动作章节（可在任意阶段触发），prev/next 在真实头中均为 `none`；执行完毕后按"返回机制"读取倒数第二条 `last` 返回原阶段（详见 phase-spec.md §2.6）。

详见 AGENTS.md `G0.5 阶段执行约束（声明式校验）`段。

## 执行步骤（严格按 §2.6 流程）

读取 `{SKILL_DIR}/rules/phase-spec.md` 的 §2.6 章节，按其完整流程执行：

### Step 1：变更识别与审计（按 PRD 子目录分流）
- `.docs/prd/*.md` 变更 → 重读需求文档 → **调用 prd-audit Skill**（直接读取 `{SKILL_DIR}/tools/prd-audit/SKILL.md` 执行，不触发 `/sdd-prd-audit` slash 命令以免引发二次冲突保护提示），P0 必须解决
- `.docs/prd/prototype/*` 变更 → 重读原型图 → 更新交互流程/页面跳转
- `.docs/prd/ui/*` 变更 → 重读 UI 设计稿 → 更新视觉规范
- `.docs/prd/ui-spec/*` 变更 → 重读 UI 解析 md → 更新精确参数（最高优先级）

### Step 2：影响分析
- 重读变更文件，识别改动点，定位受影响模块和 specs
- 判断变更类型（新增模块 / 已有模块变更 / 仅索引配置变更）
- 输出变更摘要，等待用户确认

### Step 3：级联更新（用户确认后执行）
按 §2.6「级联规则」表更新关联文件：
- 同步更新 `project-profile.md`「业务架构」「业务流程」「PRD 内容索引」
- 视觉内容变更 → 更新受影响模块的 `prototype-spec.md`
- 增量更新 `.outdocs/project-overview.md` 受影响章节
- **功能测试用例联动**（§2.7 已产出 TC-F 时）：影响验收标准 → **调用 test-case-design Skill**（直接读取 `{SKILL_DIR}/tools/test-case-design/SKILL.md` 执行，不触发 `/sdd-test-case` slash 命令以免引发二次冲突保护提示）重新生成
- **单元测试联动**：标记受影响模块的单测产出为 `outdated`，下次 §3.7 自动重新生成

### Step 4：一致性扫描与状态更新
- 对齐 `index.md ↔ 实际文件 / DES ↔ REQ / task.md ↔ index.md / context 文件 ↔ 代码`
- 涉及已实现代码的模块 → `sync-status` 标记为 `outdated`

### Step 5：留痕
- 写入 `.project/specs/change-log-specs.md`（触发源标签 `[prd]`）
- 追加 `.outdocs/prd-change-log.md`
- **更新 context.md**：追加 `{日期} Spec Sync 完成（触发源: [prd]，影响模块: {列表}）— last: §2.6 Spec Sync（下次返回触发时所在阶段继续）`

### Step 6：后续处理
- 存在 outdated 模块 → 询问「立即同步代码 / 稍后处理」

## 执行后回归

按 §2.6「返回机制」：
1. 读取 `.project/context.md` **倒数第二条记录**（即本次 Spec Sync 触发前的最后状态）的 `last` 字段
2. 按该字段定位返回阶段，继续原流程
3. 倒数第二条无 `last` → 询问用户

## 参数

`$ARGUMENTS`（可选）：本次变更说明（如「新增订单模块」「调整登录字段」），辅助 AI 理解变更意图
