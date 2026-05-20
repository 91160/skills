---
inclusion: always
description: "SDD 开发工作流 v1.0.4 — G 系列全局规则始终加载，§1~§4 阶段规则按需读取，流程声明头机械跳转 + 四值 blocking 防偷懒（gated 回灌 / audit-required 审计起手清单 / 执行自审 / produced 哈希校验），14 个 Slash Commands 显式入口"
---
# SDD Workflow — AI 执行规则 v1.0.4

> **最高指令**：严禁在未确认变更通道的情况下直接编写或修改生产代码。每次回复优先使用中文。
>
> **防误触**（本文件被加载意味着 AGENTS.md 已存在）：
> - 用户说"安装 SDD"、"安装工作流"、"安装 AGENTS"或运行 `/sdd-init` → 走 SKILL.md 基础设施安装流程（更新/状态/卸载等场景）。
> - 用户说"启动工作流"、"开始开发"或运行 `/sdd-start` → 走本文件 G0 对话初始化流程（首次/后续路径）。
> - **禁止执行 Claude Code 内置的 `/init` 命令**（/init 会覆盖本工作流生成的 CLAUDE.md symlink，导致 AGENTS.md 核心规则丢失）。
>
> （AGENTS.md 不存在的场景由 SKILL.md 顶部触发条件接管，本文件不消费）

---

## 编号与流程声明规约

本工作流使用两套编号体系，AI 读取时必须严格区分：

| 前缀 | 含义 | 位置 | 加载时机 |
| --- | --- | --- | --- |
| **G0~G3** | 全局规则（Global）— 对话初始化 + 三大机制 | AGENTS.md（本文件） | 始终加载 |
| **§1~§4** | 阶段流程（Stage）— 项目启动/需求设计/编码/归档 | `{SKILL_DIR}/rules/phase-*.md` | 按需加载 |

**流程声明头**：`{SKILL_DIR}/rules/phase-*.md` 中的每个 §N.N 章节顶部必须有一段「流程声明」引用块，字段固定顺序为 `phase / step / prev / next / gate / blocking`，格式示例：

````markdown
## §3.5 代码变更

> **流程声明**
> - phase: coding
> - step: 5/11
> - prev: §3.4 影响面评估
> - next: §3.6 代码审计
> - gate: G1 写码门禁
> - blocking: true

...正文...
````

**AI 执行约束**：

1. 所有章节使用 `§N.N` 两级编号（§3.1 内部允许三级 §3.1.N），禁止半整数
2. **进入任何 §N.N 章节前，必须先读取该章节顶部的流程声明引用块**（按 `prev` / `next` / `gate` 字段执行跳转与门禁检查），**并在执行该章节正文动作前输出该声明头作为可见凭证**（详见下方 G0.5 阶段执行约束）
3. 正文与声明头冲突时，以正文为准；同时修复声明头
4. G 系列章节（G0~G3）常驻 AGENTS.md，不使用声明头；阶段章节（§1~§4）必须带声明头
5. 字段取值规范：
   - `phase ∈ {init, spec, coding, archive}`；空值统一用 `none`
   - **`step: {N}/{总数}` 语义**：`总数` = 该 phase-*.md 文件内 §N.N 章节总数（**含横切章节**，如 §1.5、§2.6）；`N` = 该章节在文件内的章节序号，**不代表线性执行路径上的位置**。横切章节（prev/next=none）也占用一个序号，因此线性 `next` 链可能"跳号"（如 §2.5 → §2.7，§2.6 是横切占第 6 号）——这是设计预期，不是断链。执行自审「声明头字段正确」只比对 AI 输出的 step 与 phase-*.md 章节顶部**字面声明**是否一致，不重算线性位置
   - `next` 多分支用 `/` 分隔，条件写括号内
   - `gate ∈ {G1 写码门禁, none}`
   - **`blocking ∈ {true, false, gated, audit-required}`**（四值语义详见下方 G0.5 阶段执行约束）：
     - `true` — 必须执行（按条件触发时），跳过 = 流程错误，触发 G2 停车
     - `false` — 可选 / 无前置依赖
     - `gated` — blocking=true 的特化：进入前必须输出「上节产物回灌 + 本节输入承诺」两段；缺回灌 = 视为未进入，执行自审会回滚到上节重做
     - `audit-required` — blocking=true 的特化：进入前必须输出「审计起手清单（≥3 怀疑点 + 验证 + 最低 finding 数）」；不满足 = 视为敷衍，执行自审回滚到本节重做
6. 其他 AI 工具（Cursor/Copilot 等）只读 AGENTS.md，不消费流程声明；动态加载 + 声明头机制 + 四值 blocking 仅 Claude Code / Codex 启用
7. **context.md 状态标记规约**：AI 在关键节点追加 `.project/context.md` 记录时，**每条记录必须在末尾标注 `last: §N.N {章节名}`**（或 `last: G0.N` 如果处于全局初始化阶段），用于下次对话 G0.4 状态恢复时精确定位当前所处章节。关键节点包括：§2.1 任务拆分完成 / §2.2 REQ 完成 / §2.3 DES 完成 / §2.4 原型规格完成 / §2.5 评审通过 / §2.6 Spec Sync 完成 / §2.7 功能测试用例设计完成 / §3.0 直通通道完成 / §3.6 审计完成 / §3.7 自测完成 / §3.11 写入 context.md / §4 归档完成。G0.4 状态恢复时，AI 读取 context.md **最后一条含 `last:` 的记录的 `last` 字段**即可反查阶段文件（纯 `ref:` E2E 续行跳过，见第 8 条），无需推理
8. **produced 字段规约**：context.md 记录的格式与解析规约：

   **格式（行关系）**：
   - 一条 context.md 记录 = 1~3 行**连续无空行**的文本
   - **第 1 行**末尾必须含 `last: §X.Y {章节名}` 或 `last: G0.N`
   - **第 2 行**（条件性）以 `produced: ` 开头，**紧跟第 1 行**，中间无空行；该 produced 行属于上一条 last 记录
   - **第 3 行**（条件性，仅 §4 归档记录的 E2E 附加验收用）以 `ref: ` 开头，**紧跟所属记录**（无空行），属于上一条 last 记录的附加痕迹（详见下方「E2E 附加验收」）
   - 跨记录之间用 1 个空行隔开
   - **`last:` 字段定位规则**：G0.4 状态恢复 / 跨对话执行自审「last 字段存在」校验时，扫描 **context.md 最后一条含 `last:` 的记录**；纯 `ref:` 续行不构成独立记录，不参与 last 定位，不会导致「context.md 格式异常」误判
   
   **强制范围**：produced 字段**仅以下 3 个主流程章节强制**写入：
   | 章节 | blocking | 产物 |
   |---|---|---|
   | §2.4 原型生成 | true | `.project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md` |
   | §3.6 代码审计 | audit-required | `.outdocs/audit-report.md#{锚点-slug}` |
   | §3.7 开发自测 | gated | `.outdocs/unit-test-report.md#{锚点-slug}` |
   
   其他章节（§1.1 / §1.2 / §2.1 / §2.2 / §2.3 / §2.7 / §3.3 / §3.4 / §3.5 / §3.11 / §4 等）**blocking=true 但豁免 produced**——其产物语义不是单一可锚定的文件（如 §3.5 是 git diff、§2.1 是 task.md + index.md 双产物）；这些章节的完整性靠各自的章节正文规约 + G1 写码门禁 + §4 归档检查兜底。

   **E2E 附加验收**（最高优先级约束，phase-archive.md / sdd-e2e-test.md 必须遵守本条）：

   E2E 是**附加验收功能**，不属于 SDD 主流程状态机。无论单模块 / 多模块 / 连续模式 / 逐个确认模式，**E2E 只能在所有 dev-order 模块全部归档完成后执行**，且**绝不影响、不阻塞、不改写任何主流程章节状态**。落地规约：

   - **不新增独立 context.md 记录**：E2E 完成 / SKIP **不写新的 `last:` 行**，不臆造「§4 E2E 测试」这种伪章节状态
   - **不写 `produced:`**：E2E 报告不纳入 produced 强制范围，不参与哈希校验、不参与执行自审回滚
   - **只追加 `ref:` 续行**：E2E 痕迹作为**第 3 行 `ref:` 续行**，紧跟「§4 归档通用动作」写入的那条 `last: §4 归档` 记录之后（无空行）。该记录始终是 context.md 最后一条带 `last:` 的记录，跨对话 G0.4 / 执行自审据此定位，E2E 不干扰状态机
   - **`ref:` 续行格式**：
     ```
     ref: e2e {结论 PASS/PARTIAL/SKIP/FAIL} {.outdocs/e2e-report.md 或 "未生成"} ({日期}; {N通过/N失败/N跳过/N阻塞 或 SKIP原因})
     ```
   - **执行自审豁免**：`ref:` 续行不是「产物」，跨对话 / 单会话执行自审均**跳过对 `ref:` 的存在性 / 哈希 / 锚点校验**；E2E 报告文件丢失或被改不触发任何回滚
   - **独立重跑（/sdd-e2e-test）**：若全部模块尚未归档（last 不在 §4 归档），E2E **只能作为独立参考执行**，不写 context.md 任何 `last:` / `produced:` / `ref:`，仅生成报告（详见 sdd-e2e-test.md 阶段冲突保护）
   
   **格式（共用）**：
   ```
   produced: <产物路径>[#锚点-slug] <SHA-256 前 8 位>[, <产物路径2> <SHA-256-2>, ...]
   ```
   - **SHA-256 计算粒度**：
     - **单文件无锚点产物**（如 §2.4 prototype-spec.md 整个文件即一个产物）→ `shasum -a 256 <文件路径> | cut -c1-8` 针对整个文件
     - **多模块共享文件 + 锚点定位产物**（如 §3.6 / §3.7 的 `.outdocs/audit-report.md` / `unit-test-report.md`，多模块章节追加在同一文件）→ **针对锚点段内容计算哈希**，避免后续模块追加导致前模块哈希过时：
       ```bash
       # 提取锚点段（从锚点行到下一个 ^## 之前，或文件末尾）
       awk -v anchor='## {锚点完整文本}' '
         $0 ~ anchor {found=1}
         found && /^## / && $0 !~ anchor {exit}
         found {print}
       ' <文件路径> | shasum -a 256 | cut -c1-8
       ```
     - 跨对话执行自审校验时按上述粒度规则重算哈希，与 produced 记录值比对
   
   **锚点 slug 化伪代码（确定性规则）**：
   ```js
   slug = title
     .replace(/[\(\)（）\[\]【】《》「」]/g, '')   // 移除所有括号类
     .replace(/\s+/g, '-')                          // 空白转 -
     .replace(/-+/g, '-')                           // 合并连续 -
     .toLowerCase()                                 // 小写（保留中文不变）
   ```
   示例：`## 01-用户认证 代码审计报告（2026-05-11 第 2 轮）` → `01-用户认证-代码审计报告-2026-05-11-第-2-轮`
   
   **G0.4 校验**：状态恢复时按本字段校验产物文件是否存在 + 哈希是否一致 + 锚点是否命中；任一不通过 → 视为该章节未完成，触发"执行自审"回滚到该节重做（详见下方 G0.0 执行自审）

---

## G0.0 用户输入预处理（强制 / 最高优先级）

**每次对话开始时**（在执行 G0 任何步骤之前），AI 必须先做：

1. **暂存用户首条消息**为「待处理输入」，不立即执行
2. **完整跑完 G0 路径**：
   - 首次：G0.1 → G0.2 → G0.3 → G0.5
   - 后续：G0.4 → G0.4.1 → G0.5
3. **G0 完成后**才处理「待处理输入」

**禁止行为**（违反触发 G2 停车信号）：
- ❌ G0 未完成时调用任何 Skill（含 prd-audit / java-project-creator 等所有 tools/）
- ❌ G0 未完成时创建/修改任何文件（**G0.2 目录骨架除外**）
- ❌ 跳过 G0.1 项目类型确认（即便用户首条消息含"新项目""做 XXX"等明显信号）

**多轮交互处理规则**（用户在 G0.X 期间发新消息时）：

- 新消息**是 G0.X 询问的答复**（如 A/B/C/D / "新项目" / "放好了" 等）→ 当作答复处理，继续推进 G0
- 新消息**含新需求/指令**（如 "改成 XXX 需求" / "加个功能"）→ 追加到「待处理输入」，G0 完成后一并处理
- 新消息**与 G0 询问无关**（如 "现在几点" / 闲聊）→ 暂不响应，提示 "请先完成项目类型确认 / 文档补充" 后继续

**全局多轮交互打断规则**（适用于所有 slash 命令 + SKILL.md + §N.N 章节询问）：

任何工作流询问（G0.X / SKILL.md Step 3~4 / `/sdd-bug-fix` G2 三选一 / `/sdd-prd-change` 各步询问 / §2.5 评审等）期间，**用户回复偏离当前 Step 预期选项时**（非该 Step 列出的 A/B/C/D 答案，且非"取消"/"继续"等明确指令），AI 必须：

1. **暂停当前 Step**，不强行解析用户回复为答案
2. 按 **G2 停车信号**格式输出：
   ```
   【G2 停车 - 多轮交互打断】
   当前章节/Step：{§X.Y 章节名 / Skill Step N / 命令体 Step}
   预期选项：{A/B/C/D 或具体格式}
   用户回复：{用户原文}
   AI 判断：用户回复未匹配预期格式，可能想改变流程方向 / 表达新需求 / 暂停验证
   ```
3. 提供三选一让用户确认：
   - **A. 继续当前 Step**（请用户重新回复对应选项；AI 重复一次原询问）
   - **B. 取消当前流程**（视情况回滚已生成内容；详见各命令体 / SKILL.md / 章节本身的回滚清单）
   - **C. 跳到指定 Step**（用户指定跳转目标，如"跳到 Step 5" / "回到 G0.1"）
4. 等待用户明确选择后再推进

**SKILL.md / `/sdd-bug-fix` / `/sdd-prd-change` 等命令体保留各自的具体回滚清单**（如 SKILL.md 取消时回滚 AGENTS.md / symlinks / commands；`/sdd-bug-fix` 取消时清除 §3.0 通道选择记录等）。本节是行为统一规约，具体差异化处理见各命令体 / SKILL.md。

**执行自审（统一机制，强制）**：

「执行自审」是反偷懒校验的统一机制，**在两个触发点都要执行**：

1. **跨对话开局触发**（仅后续路径）：G0.0 预处理完成后，扫描 context.md **最后一条含 `last:` 的记录**（纯 `ref:` E2E 续行不构成记录，跳过），校验上次会话最后一节是否完整
2. **单会话每节进入前触发**（每次进入新 §N.N 章节前）：扫描**当前回答**中上一节的可见凭证，校验上节是否完整

两个触发点共用同一套校验表 + 输出格式 + 处理规则。

**校验表（统一标准）**：

| 检查项 | 适用范围 | 通过条件 | 不通过处理 |
|---|---|---|---|
| `last` 字段存在 | 跨对话 | **最后一条含 `last:` 的记录**末尾含 `last: §N.N` 或 `last: G0.N`（纯 `ref:` E2E 续行跳过，不算缺失） | 全文件无任何 `last:` → 触发 G2 停车「context.md 格式异常」，三选一：A 按 `/sdd-start` 场景 D 流程恢复 / B 用户手动指定当前章节后继续 / C 取消 |
| 声明头存在 | 单会话 | 上节回答含 `【进入 §X.Y】` 标识 + 6 字段流程声明头 | 视为违反 G2 "路由不确定"，回滚到 §X.Y 重做 |
| 声明头字段正确 | 单会话 | 6 字段值与 phase-*.md 真实定义一致 | Read phase-*.md 后修正 |
| produced 字段（仅 §2.4 / §3.6 / §3.7 三个主流程章节强制；其他 blocking 章节豁免，见第 8 条规约）| 两者 | 记录含 `produced: <路径>[#锚点] <hash>` | 缺 produced → **辅助判定**：若产物文件存在且含本模块本日的锚点 → 提示用户「产物存在但 produced 缺失，三选一：A 补写 produced 后继续 / B 重做该节 / C 触发 G2 停车，由用户进一步说明原因或选择处理方式」；否则视为该节未完成，回滚 |
| 产物文件存在 | 两者 | `ls <路径>` 成功 | 文件缺失 = 伪造产物，回滚到该节重做 |
| 哈希一致 | 跨对话 | `shasum -a 256 <文件> \| cut -c1-8` = produced 记录值 | 不一致 = 产物被外部改动或当时未真写入，回滚（外部改动场景由用户判定是接受新版本还是回滚）|
| 锚点存在（含 #锚点-slug 时）| 两者 | `grep -F '<二级标题文本>' <文件>` 命中 | 锚点缺失 = 章节内容缺失，回滚 |
| gated 章节回灌段 | 单会话 | 进入 blocking=gated 章节的回答含「上节产物回灌」段且回灌内容非空 / 哈希一致 | 缺回灌或回灌伪造 → 回滚到上节重做 |
| audit-required 起手清单 | 单会话 | 进入 blocking=audit-required 章节的回答含「审计起手清单」段且怀疑点 ≥ 3 | 缺清单或怀疑点不足 → 回滚到本节重做 |

**输出格式（必须输出作为可见凭证）**：

**跨对话开局触发**：

```
【执行自审 - 跨对话】上次 last: §X.Y {章节名}（blocking: {true|false|gated|audit-required}）
- last 字段: {✅ 存在 / ❌ 缺失 → G2 请用户决策}
- produced: {✅ 存在 / ⚠️ 该章节豁免 / ❌ 缺失 → 辅助判定三选一}
- 产物文件: {✅ <路径> / ❌ 回滚 §X.Y}
- 哈希一致: {✅ 匹配 / ❌ 记录 {h1} vs 实际 {h2} 回滚 / N/A 豁免}
- 锚点存在: {✅ 命中 / ❌ 回滚 / N/A 无锚点}
- 辅助判定: {N/A / ⚠️ 三选一}
结论: {✅ 继续 G0.4.1 / ❌ 回滚到 §X.Y / ⚠️ 用户决策中}
```

**单会话每节进入触发**（两版按 blocking 选用）：

| 触发版本 | 用于 | 输出格式 |
|---|---|---|
| **完整版** | blocking ∈ {true, gated, audit-required}，或自愈循环 / §4 整链重走（强制完整版）| `【执行自审 - 进入 §X.Y】上一节 §A.B (blocking: ...)`<br>`- 声明头/字段正确/gated 回灌/起手清单/出口产物` 5 项校验<br>`结论: ✅ 本节正式开始 / ❌ 回滚 §A.B` |
| **简化版** | 当前 blocking=false 且上一节 blocking=false 或 G 系列，且非自愈/重走场景 | `【执行自审 - 进入 §X.Y】上一节 §A.B (blocking: false) ✅ 无强制校验项` |

完整版输出示例（每项校验状态枚举）：

```
【执行自审 - 进入 §X.Y】上一节 §A.B {章节名}（blocking: {...}）
- 声明头: {✅ 完整 / ❌ 缺失，回滚 §A.B}
- 字段正确: {✅ 与 phase-*.md 一致 / ❌ Read 修正}
- gated 回灌（§A.B 是 gated 时）: {✅ 完整 / N/A / ❌ 回滚}
- 起手清单（§A.B 是 audit-required 时）: {✅ ≥3 怀疑点 / N/A / ❌ 回滚}
- 出口产物（§A.B 是 §2.4/§3.6/§3.7 时）: {✅ 文件+锚点+produced / ❌ 回滚}
结论: {✅ 上节完整，本节正式开始 / ❌ 回滚 §A.B}
```

完整版适用场景：blocking ∈ {true, gated, audit-required} 章节进入时；或自愈循环 / 整链重走时（任何 blocking 值都必须用完整版核验）。

**处理规则**：

- 任一不通过 → **立即回滚到对应章节重做**，禁止"将错就错"继续
- 回滚不视为流程失败，是负责任的兜底；告知用户原因并请用户确认（参考 G2 停车信号语义）

**特殊豁免**：

- **G 系列豁免**：上一节属于 G 系列（G0.0 / G0.1 / G0.2 / G0.3 / G0.4 / G0.4.1 / G0.5 / G1 / G2 / G3）时，**单会话每节进入触发的执行自审中**「上一节声明头 / 字段正确 / 回灌 / 起手清单 / 出口产物」全部检查豁免——G 系列章节不带声明头（AGENTS.md 第 4 条规定），不消费这些校验。仍输出执行自审段作为可见凭证，但相应字段标 `N/A（上一节为 G 系列）`。
- **跨对话已校验简化**：若本次会话 G0.0 跨对话执行自审已对某产物章节通过校验（含 shasum + 锚点 + 文件存在），同一会话内首次进入下一节时（如 G0.0 校验 §3.7 通过 → 路由到 §3.8 进入回灌段），shasum 重跑可标注 `（哈希已在 G0.0 跨对话自审校验，本节简化）`；锚点 + 文件存在 + 子节齐全度仍需现场校验。

**与 G2 停车信号的关系**：执行自审 = 入口检查 + 出口审计 + 跨对话校验三合一；G2 停车信号是 5 类"中途异常"。两者互补，前者管"流程合规性"，后者管"业务异常"。

> **Slash 命令豁免**：当用户首条消息是 slash 命令（`/sdd-init` / `/sdd-start` / `/sdd-prd-change` / `/sdd-bug-fix` / `/sdd-prd-audit` / `/sdd-front-context` / `/sdd-back-context` / `/sdd-frontend-standards` / `/sdd-java-create` / `/sdd-wap-create` / `/sdd-reverse-scan` / `/sdd-test-case` / `/sdd-unit-test` / `/sdd-e2e-test` 任意一个）时：
> - **G0.0 不强制**走 G0 路径，由命令体自己负责前置检查和阶段路由
> - 命令体内部仍受 G0.5 阶段执行约束 + Skill 调用强制约束（见下方）
> - 此豁免**仅对 slash 命令直接触发**生效；用户用自然语言（"启动工作流"等）触发 G0 时不豁免

---

## G0 对话初始化

**每次对话开始时**（先经过 G0.0 预处理后），AI 先检查 `.project/context.md` 是否存在且有内容：

- **不存在 或 无有效记录**（首次对话 / 项目启动未完成）→ 走**首次路径**：G0.1 → G0.2 → G0.3 → G0.5
- **存在且包含至少 1 条状态记录（含 `last` 字段）**（后续对话）→ 走**后续路径**：G0.4 → G0.4.1（推断，非阻塞）→ G0.5

> **`/sdd-start` 触发约束（强制）**：用户运行 `/sdd-start` 时，AI **必须重新读取 `AGENTS.md` 与 `.project/context.md`**，不得凭记忆跳过。读取后按以下四场景路由：
>
> | 场景 | 检测 | 处理 |
> |---|---|---|
> | A. 未装工作流 | 项目根目录无 `AGENTS.md` | 提示「请先 `/sdd-init`」并退出 |
> | B. 首次开发 | `AGENTS.md` 存在，`context.md` 不存在或无有效记录 | 走 G0 首次路径 |
> | C. 已在开发中 | `context.md` 已有 `last` 字段 | 输出当前进度，三选一：A 继续上次（G0 后续路径）/ B 重新开始（**强制全量备份**到 `.sdd-bak.{YYYYMMDDHHmm}/`，含 `.project/` + `.test/` + `.outdocs/`，并询问 `AGENTS.md` 是否一并备份重置后走首次路径）/ C 取消 |
> | D. 异常状态 | 有 `.project/` 但无 `context.md` | 先扫描 `.project/specs/master/` 现状（index.md / REQ / DES / 原型 / TC-F / 交付文档）作为决策上下文，三选一询问：A 走首次路径（保留现有内容）/ B 手动指定恢复点（创建 context.md 一条记录后走后续路径，恢复记录 produced 字段留空，下次正常进入对应章节时补写）/ C 取消。详见 `{SKILL_DIR}/.claude/commands/sdd-start.md` 场景 D |
>
> 即便 AI 因上下文丢失"忘了"流程，也必须按本约束重新执行；这是 `/sdd-start` 的最高优先级路由。详细备份步骤见 `{SKILL_DIR}/.claude/commands/sdd-start.md`。

---

### 首次路径（G0.1 → G0.2 → G0.3 → G0.5）

> 仅在 `.project/context.md` 不存在或为空时执行。后续对话跳过本段。

**G0.1 项目类型确认**：

AI 根据「待处理输入」是否含项目特征，分两种模式输出：

**模式 A：「待处理输入」含项目特征**（如 "做新项目 XXX" / "砍价模拟器" / "搭建 Vue3 项目" 等明显项目意图）

```
【项目确认】
基于你**首次启动时**描述的「{项目特征片段，如"做个砍价小程序"}」，我推断这是「A 新项目」。
请确认或修正：
  A. 新项目（请提供 PRD）  ← AI 推断
  B. 旧项目 — 新增需求
  C. 旧项目 — Bug 修复
  D. 旧项目 — 技术优化

（你的需求描述将作为"对话粘贴的 PRD"在 §1.1 处理，不必重复）
```

> {项目特征片段} 由 AI 从原始消息提取（去掉"启动工作流"等触发词后的剩余文字）。

**模式 B：「待处理输入」不含项目特征**（如纯 "启动工作流" / "开始" / "你好" 等）

```
【项目确认】
请问这是新项目还是旧项目？
  A. 新项目（请提供 PRD）
  B. 旧项目 — 新增需求
  C. 旧项目 — Bug 修复
  D. 旧项目 — 技术优化

需求输入方式提示（首次启动时）：
  · 如果你想直接告诉我需求（不走 PRD 文件流程），可以在本条回复中**同时**描述项目意图（如"A，做个砍价小程序，Vue 前端"），我会自动按模式 A 推断处理，并把你的描述作为「对话粘贴的 PRD」在 §1.1 消费。
  · 如果 PRD 文档已经在 .docs/prd/ 里，选 A 后我会在 G0.3 提示你确认并自动读取。
  · 都没有也没关系，选 A 后到 G0.3 还会再问一次"放好了 / 粘贴需求 / 跳过"。
```

用户回复确认后，AI 才进入 G0.2。**若用户回复同时含项目特征**（如"A 做个砍价小程序"），AI 直接按模式 A 路径处理（推断已确认 + 项目特征作为「对话粘贴的 PRD」入 §1.1），跳过等待确认环节。

> **判别规则**：「项目特征」指消息中含具体项目类型（如 Vue/Java）、产品名（"砍价模拟器"等）、功能描述（"做个 XXX 系统"）、明确角色（"新项目"/"旧项目"）。模糊不清时按模式 B 处理。

**G0.2 目录骨架初始化**（已存在则跳过）：

```
.docs/prd/                                 ← PRD 文字需求（md/pdf）
.docs/prd/prototype/                       ← 原型图（线框图 png/jpg/pdf）
.docs/prd/ui/                              ← UI 设计稿（高保真 png/jpg/pdf）
.docs/prd/ui-spec/                         ← UI 解析文件（Figma/蓝湖导出 md）
.docs/tech/                                ← 技术文档（API/建表/中间件）
.project/specs/master/requirements/
.project/specs/master/design/
.project/specs/master/prototypes/          ← §2.4 原型产出（HTML + prototype-spec.md）
.project/specs/rules/
.project/changelog/
.test/                                    ← 测试产出根目录（独立于 .project）
.test/.test-env.md                       ← 测试运行环境声明（§2.7 / §3.7.1 生成；§4 E2E 缺失时可创建/补全）
.test/testcases/                          ← §2.7 功能测试用例
.test/unit/                               ← §3.7 单元测试
.outdocs/
.agents/skills/
```

> **`.test/.test-env.md` 不在 G0.2 生成**：测试环境配置文件由 §2.7 / §3.7.1 首次进入时**按需生成 + 自动扫描项目实际配置补全**；若前序未生成，§4 E2E 可创建/补全安全默认字段后读取 `e2e.*` / `vars.*` / `selectors.*`。详见 phase-spec.md §2.7 / phase-coding.md §3.7.1 的「`.test/.test-env.md` 按需生成 + 自动检测」段。

**G0.3 文档补充确认**（已存在则跳过）：

检查 `.docs/prd/` 和 `.docs/tech/` 是否为空：
- 均为空 → 必须暂停，询问用户（三选项明示）：

```
【文档补充】目录已创建，请告诉我下一步（三选一）：

  A. 已放好文档（回"放好了"，我重新扫描 .docs/）
     可放: .docs/prd/{,prototype,ui,ui-spec}/ + .docs/tech/，不确定的文件直接放 .docs/prd/ 根目录
  B. 没 PRD 但现在直接粘贴需求（写在本条回复，AI 当作"对话粘贴的 PRD"入 §1.1）
  C. 都没有也不粘贴（回"跳过"，§1.1 询问技术栈直接脚手架）
```

- 仅 `.docs/prd/` 及其子目录（prototype/、ui/、ui-spec/）全空 → 同上三选一提示
- 仅 `.docs/tech/` 为空 → 不阻断
- 均不为空 → 跳过本节

> **选项处理**：A → 重扫 `.docs/` 进入 G0.5；B → 粘贴内容入 §1.1 进入 G0.5；C → §1.1 询问技术栈推进。

→ 进入 G0.5 阶段路由

---

### 后续路径（G0.4 → G0.4.1 → G0.5）

> 仅在 `.project/context.md` 已存在且有内容时执行。跳过 G0.1/G0.2/G0.3。

**G0.4 状态恢复**：读取以下文件恢复状态：

- `.project/context.md` — 恢复工作进度。**读取最后一条含 `last:` 的记录的 `last: §N.N` 字段**作为当前章节位置（规约见本节第 7、8 条；纯 `ref:` E2E 续行跳过）；若全文件无任何 `last:` 字段 → 触发 G2 停车「context.md 格式异常」，三选一：A 按 `/sdd-start` 场景 D 流程恢复 / B 用户手动指定当前章节后继续 / C 取消
- `.project/task.md` — 恢复子任务进度（如存在）
- `.project/specs/rules/project-profile.md` — 恢复项目级认知（铁律/技术栈/外部依赖/业务架构）
- `.project/specs/rules/frontend-context.md` — 恢复前端规范（如存在）
- `.project/specs/rules/backend-context.md` — 恢复后端规范（如存在）

**produced 字段校验**（last 指向的章节 blocking ∈ {true, gated, audit-required} 时强制）：

按 G0.0「执行自审 - 跨对话」表执行 produced + 产物文件 + 哈希 + 锚点四项校验（详见 G0.0 段）。任一不通过 → 视为该章节未完成，**先回滚到该章节重做**，再进入 G0.4.1 推断意图。执行自审在 G0.0 已发生；G0.4 此处是其结果落地：若 G0.0 自审标记回滚 §X.Y，G0.4 直接定位到 §X.Y 而不是 last 字段值。

**G0.4.1 任务意图推断**（替代首次路径的 G0.1，后续对话时执行）：

AI 根据用户**首条消息**推断当前意图，**直接执行，不等待确认**。推断后输出一行简短状态提示（非阻塞）。下表合并初步推断 + bug 二次判定：

| 用户表述示例 | 推断意图 | 处理 |
|---|---|---|
| "继续" / "接着做" / 无明确新任务 | 延续上次 | 按 context.md `last` 字段定位，继续原任务原类型 |
| "加功能" / "新增 XXX" / "做 XXX 需求" | 新增 feature | 新任务，类型=feature |
| "优化 XXX" / "重构 XXX" / "性能问题" | refactor | 新任务，类型=refactor |
| **bug 类**："有个 bug" / "XXX 报错" / "XXX 不正常"，且 `last` 在 §3.x/§4 + bug 涉及模块与 context.md 当前模块一致 | **当前需求 bug** | 加载 phase-coding.md，**直接 §3.0 跳过 G0.5** |
| **bug 类**：同上但 `last` 不在 §3.x/§4 或 bug 与当前模块无关 | **新 bug 工单** | 新任务 type=bug，G0.5 → §2.2 |
| **bug 类**：归属无法判定 | 不确定 | G2 询问"是当前 {模块} 的 bug 还是新 bug？" |
| 无法推断（模糊） | 不确定 | G2 停车请用户明确意图 |

> **排他**：以下意图不进入 bug 修复回环，即使 `last` 在 §3.x~§4 也走原流程：
> - "需求变更" / "改一下需求" / "加个字段" → feature 或 §2.6 Spec Sync
> - "评审批注改完了" / "继续" → 延续上次
> - "优化 XXX" / "重构 XXX" → refactor

**状态提示格式**（非阻塞，AI 输出后直接继续执行）：

```
【状态恢复】上次进度：{last 字段}（{模块名/任务名}）| 本次：{推断结果}
```

当前需求 bug 时的状态提示：
```
【状态恢复】上次进度：{last 字段}（{模块名}）| 本次：当前需求 bug 修复 → §3.0 通道判断
```

- AI 推断后**不等待用户回复**，直接进入 G0.5 阶段路由（当前需求 bug 则直接进入 §3.0，跳过 G0.5）
- 用户如发现推断错误，随时说 `"不是，我要做 XXX"` 打断，AI 重新推断

---

### G0.5 阶段路由（首次/后续共用）

根据状态判断当前阶段，**读取对应的阶段规则文件**：

| 当前状态 | 阶段编号 | 加载规则文件 | 说明 |
|---------|---------|-------------|------|
| 无 `.project/` 目录 | **§1** | `{SKILL_DIR}/rules/phase-init.md` | 项目启动初始化 |
| 有 `.project/` 但需求/设计未完成 | **§2** | `{SKILL_DIR}/rules/phase-spec.md` | 需求分析与方案设计 |
| REQ+DES `review-status: approved`，准备编码 | **§3** | `{SKILL_DIR}/rules/phase-coding.md` | 编码变更通道 |
| 模块子任务全 done，准备归档 | **§4** | `{SKILL_DIR}/rules/phase-archive.md` | 归档 |

> **重要**：按下方「G0.5 阶段执行约束」处理 — 进入每个 §N.N 章节前先输出流程声明头作为凭证；详细规则按需 Read 对应 phase-*.md（不强制每次都重读，速查表 + 已加载的 G 系列规则覆盖大部分场景）。

#### G0.5 阶段执行约束（声明式校验 + 四值 blocking + 反惯性强制）

进入任何 §N.N 章节执行动作前，AI **必须**先输出该章节的流程声明头作为凭证。**输出格式必须与 phase-*.md 章节顶部真实声明头完全一致**（含"流程声明"标题 + 6 字段：phase / step / prev / next / gate / blocking），并在前面加一行 `【进入 §X.Y {章节名}】` 作为 AI 标识：

```
【进入 §X.Y {章节名}】
> **流程声明**
> - phase: {init|spec|coding|archive}
> - step: {N}/{总数}
> - prev: {严格按 phase-*.md 章节顶部声明头复制，不得简化}
> - next: {严格按 phase-*.md 章节顶部声明头复制}
> - gate: {G1 写码门禁 | none}
> - blocking: {true | false | gated | audit-required}
```

输出后才执行该章节正文动作。

##### blocking 四值语义

| 取值 | 含义 | 进入约束 | 跳过后果 |
|---|---|---|---|
| `true` | 必须执行（按条件触发时） | 仅输出声明头 | 跳过 = 流程错误，触发 G2 停车 |
| `false` | 可选 / 无前置依赖 | 仅输出声明头 | 可按条件跳过，不视为违反 |
| `gated` | 必须先回灌上节产物才能进入 | 声明头后立即输出「上节产物回灌 + 本节输入承诺」两段 | 缺回灌 = 视为未进入，下次执行自审回滚到上节重做 |
| `audit-required` | 必须输出审计起手清单（怀疑点驱动） | 声明头后立即输出「审计起手清单（≥3 具体怀疑点 + 验证 + 最低产出承诺）」 | 缺审计起手清单段或怀疑点 < 3 = 视为敷衍，回滚到本节重做 |

##### gated 章节进入约束

进入 blocking=gated 的章节时，声明头**之后**必须立即追加「上节产物回灌 + 本节输入承诺」两段，格式严格遵循对应 phase-*.md 章节的「上节产物回灌」段落规约：

```
【上节产物回灌】（gated 章节强制）
执行 Bash: <章节正文规定的 cat / grep / shasum 命令>
粘贴实际输出（不是描述/总结，必须是工具回显原文）：
"""
<工具回显原文>
"""

本节输入承诺：基于上述产物中的 <具体 ID / 路径 / 锚点> 执行 <本节核心动作>
```

回灌内容不存在 / 内容为空 / 仅含空骨架（无 path:line 证据） / 哈希与 context.md `produced` 字段不一致 → 视为上节未真做，**立即回滚到上节重做**，禁止继续本节。

##### audit-required 章节进入约束

进入 blocking=audit-required 的章节时，声明头**之后**必须立即输出「审计起手清单」（至少 3 个具体怀疑点 + 验证 + 最低产出承诺）：

```
【审计起手清单】（audit-required 章节强制）
进入正式审计前，必须先列出至少 3 个具体怀疑点（基于本次改动 + 本节标准维度），格式：
  - 怀疑点 1：针对 {标准项编号}，{改动文件 path:line}，反向假设"如果 {具体场景} 会怎样？"
  - 怀疑点 2：...
  - 怀疑点 3：...

逐条对照代码验证：每个怀疑点必须给出"成立 / 不成立 + path:line 证据"。

最低产出：
  · 至少 3 个 finding（成立的怀疑点 + 验证过程中发现的新问题），或修复项 ≥ 3
  · 若全部不成立且 finding < 3 且修复项 < 3 → 必须追加「我为什么相信代码无问题」辩护段，逐条引用 path:line 证据反驳常见失败模式

反惯性约束：禁止输出"代码符合预期 / 逻辑正确 / 实现合理"等无 path:line 证据的肯定句；任何 PASS 判定必须附改动文件的 path:line
```

输出后再执行本节正文。

##### 单会话每节进入前的执行自审

进入下一节前，AI **必须**按 G0.0「执行自审」段的"单会话每节进入触发"格式输出可见凭证（见 G0.0 输出格式 + 校验表）。该输出**逐字必现**，不得省略。

校验表（gated 回灌 / audit-required 起手清单 / 出口产物 / 哈希 / 锚点）与 G0.0 跨对话自审共用，详见 G0.0「执行自审」段。

跳过此输出 = 流程违规，用户有权要求回滚。

##### 横切章节豁免

横切动作章节（§2.6 Spec Sync、§1.5 技术文档处理等）可在任意阶段触发，**无固定 prev**，因此豁免：
- 声明头照常输出，**prev / next 字段豁免严格比对**：phase-*.md 中横切章节真实 prev=none，但 AI 按当前真实触发源填写时**不视为字段不符**；同时建议在声明头下方追加一行 `> 触发源: §X.Y`，作为补充信息
- gated 回灌段免输出（无上节固定产物）
- audit-required 不适用（横切章节无审计语义）
- 执行自审单会话每节进入触发的输出改为：① 触发源是什么？② 触发前 last 是什么（用于回归路由）？③ 本次横切动作产出是什么？

##### 何时主动 Read phase-*.md（按需，节省 token）

- AI 自感不确定章节内容（流程声明头与下方"阶段速查表"对不上）
- 用户明确要求"请按 phase-X.md §X.Y 执行"
- 进入审计/自测等需要详细规则的章节（§3.6 / §3.7 → quality-standards.md）
- 进入 blocking=gated / audit-required 章节时（需读出口产物 schema 才能正确回灌 / 起手清单）

##### 何时跳过 Read（绝大多数日常场景）

- AI 已能从下方"阶段速查表" + AGENTS.md G 系列规则推导出执行步骤
- 已经在当前会话上下文中读过该章节

> **Slash 命令的差异化执行**：
> - 工具触发类命令选「A 独立执行」：仅 Read SKILL.md（按 Skill 调用强制约束），**不强制**输出阶段声明头（独立执行不进入工作流阶段）
> - 工具触发类命令选「B 工作流内」：必须按 last 字段映射阶段，输出对应声明头（含四值 blocking 相应约束）
> - 流程触发类命令（4 个）：命令体自有路由机制，按命令体的"前置检查 / 四场景路由 / 二次判定"执行，不强制叠加本约束；但若命令体内部进入 §X.Y 时仍受四值 blocking 约束

**类型映射**（贯穿后续所有阶段）：

| 来源 | 匹配 | 任务类型 | 对应 §2.2 模板 |
|---|---|---|---|
| G0.1 选项（首次） | A / B | feature | 新增需求 |
| G0.1 选项（首次） | C | bug | Bug 修复 |
| G0.1 选项（首次） | D | refactor | 技术优化 |
| G0.4.1 推断（后续） | 延续上次 | 上次类型 | 无需重映射 |
| G0.4.1 推断（后续） | 新增功能 | feature | 新增需求 |
| G0.4.1 推断（后续） | bug 描述 | bug | Bug 修复 |
| G0.4.1 推断（后续） | 优化/重构 | refactor | 技术优化 |

---

## G1 写码门禁（Code Gate）

> AI 每次准备写/改生产代码前，必须自检以下条件，**全部 ✅ 才可执行**：

| # | 检查项                                              | 未通过处理                     |
| - | --------------------------------------------------- | ------------------------------ |
| 1 | `.project/` 已初始化                              | → 先完成项目启动              |
| 2 | 当前功能有 REQ + DES 且 `review-status: approved` | → 先完成需求分析+方案设计    |
| 3 | 阻塞依赖已就绪（用户明确说"跳过"的视为就绪）        | → 等待用户提供或确认跳过      |
| 4 | 技术栈对应的编码/审计 Skill 已安装                  | → 读取 `{SKILL_DIR}/rules/skill-routing.md` 按流程安装 |
| 5 | task.md 中当前模块有 **pending 或 in-progress** 子任务（跨对话恢复时 in-progress 视为合法继续状态）| → 定位下一个 pending 或当前 in-progress 子任务 |
| 6 | 本次变更与项目铁律无冲突                            | → 列冲突点 + 替代方案，触发 G2 停车信号 |

**检查项 #4 Skill 安装检查规则**：根据 project-profile.md「技术栈」声明，检查以下目录是否存在：

- 技术栈含前端 → 检查 `{SKILL_DIR}/tools/frontend-code-standards/` 是否存在
- 技术栈含 Java → 无内置编码 Skill，使用内置规约 C-01~C-10
- 代码审计 → 无内置审计 Skill，使用 `{SKILL_DIR}/rules/quality-standards.md` 中 S-01~S-07 + S-08
- 内置 Skill 缺失 → 读取 `{SKILL_DIR}/rules/skill-routing.md` 按兜底规则处理

**检查项 #5 Task 定位规则**：读取 `.project/task.md`，**优先定位当前模块的 in-progress 子任务（跨对话恢复场景），否则定位下一个 pending 子任务**，输出：

```
【当前任务】{ID} [{类型}] {描述}（状态：{in-progress / pending}）
【模块进度】{done}/{总数}
```

- task.md 不存在（bug 类型无 task.md；refactor 类型用户选择不创建时无 task.md）→ 跳过此检查项
- 当前模块**既无 in-progress 也无 pending 子任务** → 进入归档（读取 `{SKILL_DIR}/rules/phase-archive.md`）

**快速通道豁免**：仅样式/文案的快速通道任务，检查项 #2 简化为：REQ + DES 可各简化为一句话描述，免评审。AI 在进入 §3.1 前，在对应 REQ + DES 文件中追加一句话记录（文件不存在则新建）。检查项 #5 跳过（快速通道不更新 task.md，样式/文案改动不对应独立子任务）。

**Bug 修复回环豁免**：从 G0.4.1 二次判定进入 §3.0 的当前需求 bug 修复，检查项 #5 跳过（bug 修复不是 task.md 中的子任务，不受子任务状态约束）。修复完成后的归档由 §3.11 路由规则控制（原始 last 在 §4 → 重新归档；原始 last 在 §3.x → 回到原位继续开发）。

- 任一 ❌ → **停止**，输出缺失项，等待用户指示
- **禁止将"继续"、"开始"等模糊指令默认理解为"直接写代码"**，应先执行门禁自检

---

## G2 停车信号

以下情况必须暂停，向用户报告并等待指示：

| 信号 | 处理 |
|------|------|
| 路由不确定 | 说明两种判断及理由，请用户选择 |
| 影响面超预期 | 列出影响范围，建议升级通道 |
| 循环超限 | 列出未通过项 + 错误模式，请用户判断（审计循环超 3 次 / 自愈循环超 5 次） |
| 规则冲突 | 列出矛盾点（Spec 间 / 铁律 / DES 冲突），请用户裁决 |
| 未覆盖场景 | 描述场景 + 建议处理方式，请用户确认 |

**停车不是失败，是负责任。** AI 不应在不确定的情况下"猜着往前走"。

---

## G3 未覆盖场景兜底

发现本规则未覆盖的场景时，按 G2 停车信号「未覆盖场景」处理：描述场景 + 建议处理方式，暂停等待用户确认。

---

## 按需加载的规则文件索引

以下文件位于 `{SKILL_DIR}/` 目录，在对应阶段由 AI 主动读取：

| 文件 | 用途 | 何时读取 |
|------|------|---------|
| `rules/phase-init.md` | **§1 项目启动**（§1.1 新项目 / §1.2 旧项目 / §1.3 前后端规范提取 / §1.4 深度扫描 / §1.5 技术文档处理） | 项目首次初始化 |
| `rules/phase-spec.md` | **§2 需求与设计**（§2.1 任务拆分 / §2.2 需求分析 / §2.3 方案设计 / §2.4 原型生成 / §2.5 评审 / §2.6 Spec Sync / §2.7 功能测试用例设计） | 进入需求/设计阶段 |
| `rules/phase-coding.md` | **§3 编码变更通道**（§3.0 通道判断 / §3.1~§3.11 标准通道步骤） | 进入编码阶段 |
| `rules/phase-archive.md` | **§4 归档** | 模块编码完成后 |
| `rules/quality-standards.md` | 审计标准（PRD/REQ/DES/代码/自测） | 执行审计时 |
| `rules/skill-routing.md` | Skill 路由表 + 安装/执行流程 | 需要安装或调用 Skill 时 |
| `rules/slash-commands.md` | **Slash Commands 详细路由**（4 流程触发 + 10 工具触发 + 流程冲突保护两类）| 用户触发 `/sdd-*` 命令或 AI 决定如何路由命令时 |
| `rules/project-structure.md` | **.project 完整目录树状结构图**（含每个文件 + 注释）| 用户询问目录结构 / AI 需追溯具体路径时 |
| `rules/fallback/frontend-scan.md` | 前端内置扫描（兜底） | 前端 context skill 不可用时 |
| `rules/fallback/backend-scan.md` | 后端内置扫描（兜底） | 后端 context skill 不可用时 |
| `templates/project-profile.tpl.md` | project-profile.md 模板（仅项目级） | 初始化 profile 时 |
| `templates/project-overview.tpl.md` | project-overview.md 输出结构模板 | 生成 overview 时 |

---

## Slash Commands 入口（概览，详细路由按需 Read）

14 个命令，命令文件位于 `{SKILL_DIR}/.claude/commands/`，由 `/sdd-init` 安装到用户级或项目级。

| 类型 | 命令 | 简述 |
|---|---|---|
| **流程触发**（4 个）| `/sdd-init` | SKILL.md 安装/更新/状态/卸载 |
| | `/sdd-start` | G0 对话初始化（四场景路由）|
| | `/sdd-prd-change` | §2.6 Spec Sync `[prd]` 入口 |
| | `/sdd-bug-fix` | G0.4.1 当前需求 bug 二次判定 → §3.0 回环 |
| **工具触发**（10 个）| `/sdd-prd-audit` | §1.1 / §1.2(feature) / §2.6[prd] PRD 审计 |
| | `/sdd-front-context` | §1.3 前端规范提取 |
| | `/sdd-back-context` | §1.3 后端规范提取 |
| | `/sdd-frontend-standards` | §3.5 前端代码变更规范 |
| | `/sdd-java-create` | §1.1 后端项目初始化（Java）|
| | `/sdd-wap-create` | §1.1 前端项目初始化（WAP）|
| | `/sdd-reverse-scan` | §1.4 深度业务代码扫描 |
| | `/sdd-test-case` | §2.7 功能测试用例设计 |
| | `/sdd-unit-test` | §3.7.1 自动化单测 |
| | `/sdd-e2e-test` | §4 全部模块归档后 E2E 测试 |

> **G0.0 豁免规则**：slash 命令首条触发时 G0.0 不强制走 G0 路径，由命令体自有路由处理；自然语言触发不豁免。命令体内进入 §X.Y 仍受 G0.5 阶段执行约束 + Skill 调用强制约束。

> **详细路由 + 流程冲突保护**：AI 需要决定如何路由 `/sdd-*` 命令时，**Read `{SKILL_DIR}/rules/slash-commands.md`**——含完整路由表（4 流程 + 10 工具）、流程冲突保护两类（阶段冲突 / 产出物冲突）+ 各命令体行为细则。命令体本身见 `{SKILL_DIR}/.claude/commands/sdd-*.md`。

---

## .project 目录结构（概览）

| 顶级目录 | 用途 |
|---|---|
| `.project/` | 项目管理：`context.md`（每次对话必读）、`task.md`（子任务）、`specs/master/`（REQ/DES/index/prototypes）、`specs/rules/`（profile + context）、`changelog/`、`reverse-scan/`（可选）|
| `.docs/` | 用户文档：`prd/`（PRD + prototype/ui/ui-spec 子目录）、`tech/`（技术文档）|
| `.test/.test-env.md` | 测试运行环境（§2.7 / §3.7.1 生成；§4 E2E 缺失时可创建/补全并读取 e2e.* / vars.* / selectors.*）|
| `.test/` | 测试产出：`testcases/`（TC-F + CSV）、`unit/`（UT + skeleton + report）|
| `.outdocs/` | 交付文档：project-overview / api-doc / audit-report / unit-test-report / task-report / prd-change-log |
| `.agents/skills/` | ny-sdd-workflow 安装目录（子 Skill 内置在 tools/ 下）|

> **完整树状结构图**（含每个具体文件 + 注释）：**Read `{SKILL_DIR}/rules/project-structure.md`**。AI 日常执行流程不依赖该图（各 phase-*.md 直接给出实际路径），仅在用户询问目录结构或追溯具体路径时按需 Read。

---

## 阶段速查表（始终加载，免去 phase-*.md 重读）

> **使用方式**：AI 在执行任何 §N.N 时按此表快速定位关键动作；如需详细规则（如 §3.6 S-01~S-08 完整描述、§2.6 Spec Sync 级联规则等），按需 Read 对应 `phase-*.md` 或 `quality-standards.md`。

### §1 项目启动（rules/phase-init.md）

| § | 动作 | 关键产出 / 前置 |
|---|---|---|
| §1.1 | 新项目：PRD 审计 → 业务流程提取 → 询问技术栈 → 脚手架 → §1.3 → §2.1 | PRD 审计 P0 必须解决；脚手架前需技术栈确定 |
| §1.2 | 旧项目：扫描代码 → 技术栈识别 → §1.3 → §1.4 → feature/bug/refactor 分流 | 兜底：浅层业务架构推断 |
| §1.3 | 调用 front-/back-project-context Skill 提取规范 → mv 到 `.project/specs/rules/` | 兜底：`fallback/{frontend,backend}-scan.md` |
| §1.4 | 调用 reverse-scan Skill 深度业务代码扫描 | 仅 §1.2 旧项目；产出在 `.project/reverse-scan/` |
| §1.5 | 技术文档处理规则（横切，被 §1.1/§1.2/§2.3/§3.5 引用） | 按 `.docs/{prd,tech}/` 分流处理 |

### §2 需求与设计（rules/phase-spec.md）

| § | 动作 | 关键产出 / 前置 |
|---|---|---|
| §2.1 | 模块排序 + 子任务拆分 + 写入 `task.md` + 选执行模式（连续/逐个确认） | feature 类型；首次进入 §2 |
| §2.2 | 需求分析 → REQ 文件（`review-status: draft`）+ REQ 自审 | feature/bug/refactor 分模板 |
| §2.3 | 方案设计 → DES 文件 + `api-doc.md` 自动追加 + DES 自审 | DES 含 API 时自动写 api-doc |
| §2.4 | 原型生成 → `prototype-spec.md`（+ HTML 线框图条件性） | 仅 feature 含前端；**blocking: true**（触发条件满足时必做）；出口产物哈希写入 context.md `produced` |
| §2.5 | 人工评审 → REQ/DES `review-status: approved` | 阻塞，待用户确认；**blocking: gated**（feature 含前端时强制回灌 §2.4 产物） |
| §2.6 | Spec Sync（PRD/specs/tech 三种触发源）→ 级联更新 | 横切动作，可在 §1~§4 任意触发 |
| §2.7 | 调用 test-case-design Skill → TC-F + CSV | **blocking: true**（feature/bug/refactor 均执行；Skill 缺失时兜底产出手工 TC-F 大纲，触发 G2 由用户决策）|

### §3 编码变更通道（rules/phase-coding.md）

| § | 动作 | 关键产出 / 前置 |
|---|---|---|
| §3.0 | 通道判断（直通/快速/标准 + bug 修复回环） | 受 G1 门禁前置 |
| §3.1 | 加载规范+铁律（4 子步骤：铁律 / 已有代码 / 编码上下文 / UI 上下文） | — |
| §3.2 | 加载 Spec（sync-status + coding-skill + audit-skill 状态检查） | — |
| §3.3 | 文档学习（按需，优先 `.docs/`） | — |
| §3.4 | 影响面评估（6 维度） | **blocking: true**（产物为对话内影响面清单，produced 字段豁免）|
| §3.5 | 代码变更（C-01~C-10 + U-01~U-06） | 调用 frontend-code-standards Skill 或 context 文件 |
| §3.6 | 代码审计（S-01~S-08）→ `audit-report.md` | **blocking: audit-required**（审计起手清单 ≥3 怀疑点 + ≥3 finding 或辩护；至少 1 个怀疑点针对 ≥10 行代码段）；**反向假设 8 类速查**：空值 / 并发 / 时序 / 输入 / 异常 / 边界 / 权限 / 状态；锚点首轮 `## {模块编号-模块名} 代码审计报告（YYYY-MM-DD）`，第 N 轮加 `第 N 轮` 后缀；跨多模块 feature 每模块独立锚点；context.md `produced` 必填 |
| §3.7 | 自动化单测（unit-test-generator）+ T-01~T-06 自动补充 | **blocking: gated**（强制回灌 §3.6 锚点 + finding 列表）；报告 PASS/SKIP/FAIL；产出 `.test/unit/`；锚点首轮 / 第 N 轮规则同 §3.6；context.md `produced` 必填 |
| §3.8 | 更新 `task.md`（feature 类型，或 refactor 有 task.md 时） | **blocking: gated**（强制回灌 §3.7 锚点 + 结论字段） |
| §3.9 | 生成 Changelog → `.project/changelog/` | 所有通道 |
| §3.10 | Spec 状态同步（含 bug 修复回环留痕） | 更新 sync-status / change-log-specs.md |
| §3.11 | 写入 `context.md`（含 bug 回环路由） | **blocking: true**（产物即 context.md 新记录本身，是状态机锚定点，produced 字段豁免）；路由：原始 last 在 §3.x→回原位 / §4→重新归档 |

### §4 归档（rules/phase-archive.md）

| 动作 | 关键产出 / 前置 |
|---|---|
| 15 项检查清单 → 通过即归档 | 任一不通过回对应阶段 |
| 标签 `[Feature/Bug/Refactor]` + `task-report.md` | — |
| feature 连续模式 → 自动下一模块；逐个确认模式 → 询问；bug/refactor → 询问下一步 | — |

> **覆盖范围**：本速查表覆盖**自然语言路径**和**slash 命令路径**的所有阶段动作。AI 进入任何 §N.N 时先按此表定位关键动作 + 输出流程声明头，详细规则按需 Read。

### 必读边界清单（即便有速查表，以下场景仍必须 Read 详细文件）

| 场景 | 必读文件 | 原因 |
|---|---|---|
| §3.5 代码变更 | `quality-standards.md` 的 C-01~C-10 | 10 条编码规约逐项核对 |
| §3.5 前端代码变更 | `quality-standards.md` 的 U-01~U-06 | 6 条 UI 还原规约 |
| §2.4 原型生成（feature 含前端） | `phase-spec.md` §2.4 完整段 | 出口产物 schema（prototype-spec.md 必备二级标题）+ context.md `produced` 字段写法 |
| §2.5 评审进入 | `phase-spec.md` §2.5「上节产物回灌」段 | gated 回灌格式（cat / shasum / 校验 4 项） |
| §3.6 代码审计 | `quality-standards.md` 的 S-01~S-08 + `phase-coding.md` §3.6 审计起手清单段 | 8 条审计规约 + 审计起手清单 + 锚点 schema + finding 最低数 |
| §3.7 开发自测进入 | `phase-coding.md` §3.7「上节产物回灌」段 + `quality-standards.md` T-01~T-06 | gated 回灌格式（grep 锚点 / awk 提取章节 / shasum）+ 6 条自测规约 |
| §3.8 更新 task.md 进入 | `phase-coding.md` §3.8「上节产物回灌」段 | gated 回灌格式（grep §3.7 锚点 / 结论字段校验） |
| §2.2 REQ 自审 / §2.3 DES 自审 | `quality-standards.md` 的 REQ/DES 审计标准 | 审计循环上限 / 自审项清单 |
| §2.6 Spec Sync 级联 | `phase-spec.md` §2.6 完整段 | 5 张级联规则表 / Step 1~6 详细流程 |
| §3.10 bug 修复回环留痕 | `phase-coding.md` §3.10 完整段 | a~e 5 项留痕动作 + 文档级联 |
| §1.4 reverse-scan 合并 | `phase-init.md` §1.4 + scan-summary.md | 合并到 profile/overview/api-doc/context 的具体规则 |
| §4 归档检查 | `phase-archive.md` 完整段 | 15 项检查清单 + 各项验证细节 |
| 调用任何 Skill | `tools/{skill}/SKILL.md` | 必读全文（详见 skill-routing.md 的 Skill 调用强制约束） |
| 兜底（Skill 缺失时） | `quality-standards.md` 或 `rules/fallback/*.md` | 内置兜底规则的详细描述 |

> 这些场景速查表无法承载完整规则，**Read 不可省**。AI 必须在执行该场景时显式 Read 对应文件。
