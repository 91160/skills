---
description: 进入此项目的 SDD 开发流程（触发 G0 对话初始化）
---

# /sdd-start — 启动项目开发

显式触发 SDD Workflow 的 G0 对话初始化，按 `.project/context.md` 状态走首次路径或后续路径。

## 强制前置：必读 context.md

执行本命令时，**必须先读取项目根目录下的 `AGENTS.md` 与 `.project/context.md`**（即便 AI 因上下文丢失"忘了"流程，也必须按本指令重新读取并按四场景路由），不得凭记忆跳过。

## 四场景路由

按以下顺序判定，命中即停：

### 场景 A：未装工作流
**检测**：项目根目录无 `AGENTS.md`

**处理**：**自动转入 SKILL.md A 分支兜底安装（entry_type=develop）+ 接续 G0**，与自然语言"启动工作流"路径一致：

```
【SDD Workflow】
检测到 AGENTS.md 不存在，工作流尚未安装。
原始触发：/sdd-start（开发意图）→ 自动转入兜底安装路径，安装完毕后自动接续 G0 对话初始化。

【转入 SKILL.md A 分支】
  · Step 0 入口类型：develop（来源：/sdd-start）
  · Step 1~6：执行标准安装流程（路径检测 / AGENTS.md 生成 / 工具同步选项 / Slash Commands 安装位置 / .gitignore 建议 / 初始化报告）
  · Step 7：方案 B 自动接续 G0 首次路径（G0.1 → G0.2 → G0.3 → G0.5），无需用户再次触发
```

> **设计对齐**：`/sdd-start` 和自然语言"启动工作流"在 AGENTS.md 不存在场景下行为一致——都自动兜底安装 + 接续 G0。区别仅在原始触发记录（/sdd-start vs 自然语言）。仅 `/sdd-init` 显式安装入口保留两阶段设计（装完停下等用户验证）。

> **用户想验证安装结果再开发**：自动接续期间可随时说"等等"打断，AI 停在 Step 6 报告处，用户验证后再说"继续"或"启动工作流"恢复 G0。

---

### 场景 B：首次开发
**检测**：`AGENTS.md` 存在，且 `.project/context.md` 不存在或无有效记录

**处理**：走 **G0 首次路径**：
1. G0.1 项目类型确认（A 新项目 / B 旧项目-feature / C 旧项目-bug / D 旧项目-refactor）
2. G0.2 目录骨架初始化（已存在跳过；同时生成 `.test/.test-env.md` 模板）
3. G0.3 文档补充确认（`.docs/prd/` 与 `.docs/tech/` 检查）
4. G0.5 阶段路由（按状态进入 §1 / §2 / §3 / §4）

详见 `AGENTS.md` 的 G0 章节。

---

### 场景 C：已在开发中
**检测**：`.project/context.md` 已有记录（含 `last` 字段）

**处理**：先输出当前进度，再三选一：
```
【SDD 工作流】检测到正在进行中的开发：
  · 上次进度：{last 字段}（{模块名/任务名}）
  · 当前类型：{feature / bug / refactor}
  · 已完成模块：{N}/{M}（仅 feature 且 task.md 存在时显示）

请选择：
  A. 继续上次（走 G0.4 状态恢复 → G0.4.1 意图推断 → G0.5 阶段路由）
  B. 重新开始（强制备份现有 .project/ 后从 G0.1 重启）
  C. 取消
```

- **A. 继续上次** → 走 **G0 后续路径**（G0.4 → G0.4.1 → G0.5）
- **B. 重新开始**：
  1. **强制全量备份**（避免误删，统一备份到 `.sdd-bak.{YYYYMMDDHHmm}/`）：
     - `.project/` → `.sdd-bak.{时间戳}/.project/`
     - `.test/`（如存在） → `.sdd-bak.{时间戳}/.test/`
     - `.outdocs/`（如存在） → `.sdd-bak.{时间戳}/.outdocs/`
     - `AGENTS.md` 是否手动修改？询问用户：「检测到 AGENTS.md 存在，是否一并备份后重置（重置会从 SKILL.md 模板重新生成）？A. 备份并重置 / B. 保留现状」
       - 选 A → `cp AGENTS.md .sdd-bak.{时间戳}/AGENTS.md` 后删除原文件，再走首次路径会通过 SKILL.md 重新生成
       - 选 B → 保留 AGENTS.md，仅重置工作流状态目录
  2. 备份完成后输出备份路径列表（让用户知道在哪能找回）
  3. 走 G0 首次路径（同场景 B）
- **C. 取消** → 退出，保持现状

---

### 场景 D：异常状态（有 .project 无 context）
**检测**：`.project/` 目录存在，但 `.project/context.md` 缺失或为空

**异常状态预扫描**：

进入场景 D 处理前，AI **必须先扫描 `.project/specs/master/` 子目录现状**，作为询问用户的上下文输入：

```bash
# 扫描清单
ls .project/specs/master/index.md          # 模块索引
ls .project/specs/master/requirements/*.md # REQ 文件
ls .project/specs/master/design/*.md       # DES 文件
ls .project/specs/master/prototypes/       # 原型目录
ls .test/testcases/*.md                    # 功能测试用例
ls .outdocs/*.md                            # 交付文档
```

记录每项是否存在 + 文件数量。

**处理**：扫描结果作为输入，三选一询问（不再二选一）：

```
【SDD 工作流】检测到异常状态：
  · .project/ 目录已存在
  · .project/context.md 缺失或为空（无法恢复进度）

【.project/ 现状扫描】
  · index.md: {存在 / 不存在}
  · REQ 文件: {N} 个
  · DES 文件: {N} 个
  · prototypes 目录: {存在 / 不存在}（含 {M} 个模块）
  · 功能测试用例: {N} 个
  · 交付文档: {N} 个

请选择：
  A. 按首次路径重新走一遍 G0（保留 .project/ 现有内容，G0.2 骨架已存在会跳过；适用：.project/ 是新建的空骨架）
  B. 手动指定恢复点（你告诉我当前最后在哪一节，AI 据此创建 context.md 一条记录后走 G0.4 后续路径；适用：曾走过工作流但 context.md 误删）
  C. 取消（保持现状，请手动检查 .project/context.md）

⚠️ 警告：如果扫描显示有大量 REQ/DES/原型，但你选 A → 这些已有内容**不会**被识别，下次 G0.5 路由可能走 §1 重新启动，造成混乱。
  这种场景建议选 B 手动恢复，或先备份 .project/ 再选 A。
```

**B 选项的恢复流程**：
1. AI 列出可能的 last 取值（从扫描结果推断的候选项，如 `§2.1` / `§2.3` / `§3.5` / `§4`）+ "其他（你输入）"
2. 用户选定后，AI 在 .project/context.md 创建一条记录：
   ```
   {今日日期} [手动恢复] 从异常状态恢复 — last: §X.Y {章节名}
   ```
3. 注意：B 选项的恢复记录**不写 produced 字段**（手动恢复时无法补全哈希）
4. 走 G0.4 后续路径，执行自审表按"produced 缺失辅助判定"处理（提示用户三选一：A 补写 produced / B 重做该节 / C 触发 G2）

不自动反推（避免误判已有 specs/index.md 的状态）；让用户参与决策。

---

## 阶段执行约束（与 G0.5 一致）

本命令进入 §1 / §2 / §3 / §4 任一阶段时，AI **必须**先输出该章节的流程声明头作为可见凭证（6 字段：phase / step / prev / next / gate / blocking，其中 `blocking ∈ {true, false, gated, audit-required}`），再执行该章节正文动作。

**关键行为约束**：
- 进入 `blocking=gated` 章节（§2.5 / §3.7 / §3.8）时还需立即追加「上节产物回灌」段（cat 上节产物 + 哈希校验 + 锚点校验）
- 进入 `blocking=audit-required` 章节（§3.6）时还需立即追加「审计起手清单」段（≥3 怀疑点 + 验证 + ≥3 finding 或辩护）
- 场景 C 选 A（继续上次）触发后续路径时，开局必须先执行「执行自审」（按 context.md 最后一条 produced 字段校验产物哈希 / 锚点 / 文件存在性，任一不通过回滚到该节重做）

详见 AGENTS.md `G0.5 阶段执行约束（声明式校验 + 四值 blocking + 反惯性强制）`段 + G0.0「执行自审」段。

## 与 /sdd-init 的边界

- `/sdd-init`：一次性安装 AGENTS.md + 各工具 symlink + Slash Commands。
- `/sdd-start`：每次开始/恢复开发都可运行；本质是显式触发 AGENTS.md 的 G0 对话初始化。

## 参数

`$ARGUMENTS`（可选）：场景 C 下直接指定选择
- `continue` → A. 继续上次
- `restart` → B. 重新开始（仍会执行强制备份）
- 留空 → 按四场景路由询问用户
