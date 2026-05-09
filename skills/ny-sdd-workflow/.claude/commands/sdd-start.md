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

**处理**：
```
【SDD Workflow】
检测到 AGENTS.md 不存在，工作流尚未安装。
请先执行 /sdd-init 完成基础设施安装后，再运行 /sdd-start 开始开发。
```
退出，不执行 G0。

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

**处理**：保守询问：
```
【SDD 工作流】检测到异常状态：
  · .project/ 目录已存在
  · .project/context.md 缺失或为空（无法恢复进度）

请选择：
  A. 按首次路径重新走一遍 G0（保留 .project/ 现有内容，G0.2 骨架已存在会跳过）
  B. 取消（保持现状，请手动检查 .project/context.md）
```

不自动反推（避免误判已有 specs/index.md 的状态）。

---

## 阶段执行约束（与 G0.5 一致）

本命令进入 §1 / §2 / §3 / §4 任一阶段时，AI **必须**先输出该章节的流程声明头作为可见凭证（5 字段：phase / step / prev / next / gate / blocking），再执行该章节正文动作。详见 AGENTS.md `G0.5 阶段执行约束（声明式校验）`段。

## 与 /sdd-init 的边界

- `/sdd-init`：一次性安装 AGENTS.md + 各工具 symlink + Slash Commands。
- `/sdd-start`：每次开始/恢复开发都可运行；本质是显式触发 AGENTS.md 的 G0 对话初始化。

## 参数

`$ARGUMENTS`（可选）：场景 C 下直接指定选择
- `continue` → A. 继续上次
- `restart` → B. 重新开始（仍会执行强制备份）
- 留空 → 按四场景路由询问用户
