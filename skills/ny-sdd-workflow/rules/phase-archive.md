# §4 归档

> **流程声明**
> - phase: archive
> - step: 1/1
> - prev: §3.11 写入 context.md
> - next: 见「§4 归档后路由」决策树（自动进入下一模块 / 询问用户 / E2E 确认 / 完结）
> - gate: none
> - blocking: true

模块完成后，逐项检查以下清单，全部 ✅ 才可归档：

| # | 检查项 | 适用条件 | 未通过处理 |
|---|--------|---------|-----------|
| 1 | 代码审计通过（§3.6）— **细化校验**：`.outdocs/audit-report.md` 含本次锚点 `## {模块编号-模块名} 代码审计报告（YYYY-MM-DD[ 第 N 轮]）`、S-01~S-08 八个三级标题齐全（前端改动附加 U-01~U-06）、≥3 finding 或修复项 ≥3 或有辩护段、含「### 待回归测试清单（§3.7 必读）」、context.md `produced` 字段哈希与文件一致 | 标准通道 | 任一不通过 → 回 §3.6 重做，**且必须依次重走 §3.7（产物哈希变化触发 gated 回灌重做）→ §3.8 → §3.9 → §3.10 → §3.11，回到本 §4 重新检查**；禁止单点修补哈希后跳过 §3.7~§3.11 |
| 2 | 开发自测通过（§3.7）— **细化校验**：`.outdocs/unit-test-report.md` 含本次锚点 `## {模块编号-模块名} 开发自测报告（YYYY-MM-DD[ 第 N 轮]）`、含「### 自动化单测（§3.7.1）」+「### 补充验证（§3.7.2）」两个三级标题、末尾「结论」行明确为 PASS / SKIP / FAIL、context.md `produced` 字段哈希与文件一致；**SKIP 结论处理**：结论 = SKIP 时也允许通过归档（已降级，§3.7.2 T-01~T-06 全量补充覆盖），但 `task-report.md` 自动标注 `[测试覆盖降级 - 原因: {Skill 缺失 / 依赖缺失 / 无 Bash / 环境配置 / 自愈超限}]` 便于团队后续补全 | 标准通道 | 结论 FAIL → 回 §3.5 修复 → 重走 §3.6 → §3.7 → §3.8 → §3.9 → §3.10 → §3.11；结论 SKIP → ✅ 通过（带降级标注）；锚点 / 子节 / 哈希不通过 → 回 §3.7 重做 → 重走 §3.8~§3.11；**禁止单点修补后跳过后续章节** |
| 3 | REQ + DES 存在且 `review-status: approved` | 标准通道 | 回 §2.2/§2.3 |
| 4 | changelog 写入（§3.9） | 标准 + 快速 | 执行 §3.9 |
| 5 | task.md 当前模块子任务全 `done`，模块状态更新为 `[done]` | 有 task.md 时 | 未全done → 输出未完成清单，询问用户；全done → 更新模块header为 `[done]` |
| 6 | api-doc.md 已更新 | 有新增或变更 API 时 | 从 DES 提取追加或更新对应章节 |
| 7 | context 文件已更新（新公共能力） | 编码中发现新能力时 | 追加到对应 context 文件（frontend-context.md / backend-context.md）的「内部公共能力」章节 |
| 8 | index.md sync-status → `synced` | feature 类型（index.md 有对应条目） | 执行 §3.10 |
| 9 | index.md `coding-skill` 和 `audit-skill` → `pending` | feature 类型（index.md 有对应条目） | 重置 |
| 10 | context.md 写入（§3.11） | 所有通道 | 执行 §3.11 |
| 11 | 受影响模块 DES 已同步更新 | Bug / Refactor 类型且 REQ 有 `affected-module` | 对照 DES「受影响 Spec 变更清单」逐项确认已更新到受影响模块 DES |
| 12 | api-doc.md 已同步更新（级联） | Bug / Refactor 涉及 API 行为变更时 | 确认 api-doc.md 对应章节已反映变更后的 API 定义 |
| 13 | prototype-spec.md 已同步更新 — **feature 含前端的细化校验**：`.project/specs/master/prototypes/{模块编号}-{模块名}/prototype-spec.md` 文件存在、含「# {模块编号}-{模块名} 原型规格」一级标题 + 「## 基准来源 / ## 交互流程图 / ## 页面结构说明」三个二级标题、context.md `produced` 字段哈希与文件一致 | feature 视觉内容变更时 / Bug / Refactor 涉及 UI 或视觉内容变更时 | 对照「基准来源」表逐项确认已更新（基准文件/页面结构说明）；feature 含前端时文件 / 标题 / 哈希任一不通过 → 回 §2.4 重做 → 重走 §2.5（gated 回灌）→ §2.7 → §3.x（如已在 §3.x 后归档触发本检查）依链路重走 |
| 14 | 功能测试用例文档已生成 | feature 类型且 §2.7 已执行 | 确认 `.test/testcases/TC-F-*.md` 存在且覆盖率矩阵完整 |
| 15 | 单元测试已通过（#2 的从属交叉校验，**权威源以 #2 的 `.outdocs/unit-test-report.md` 为准**） | 标准通道 | 检查**本模块**的模块级原始报告 `.test/unit/report.md`（§3.7.1 unit-test-generator 每模块覆盖写）：结论 PASS → ✅；结论 SKIP → ✅（已降级，§3.7.2 全量验证已补充覆盖）；结论 FAIL → 回 §3.7。**与 #2 不一致时以 #2 为准**：若 #2 的 `.outdocs/unit-test-report.md` 本模块锚点结论为 PASS/SKIP 但本文件缺失或结论相左 → 不单独判 FAIL，回 §3.7 重新生成两份报告使其一致后重走 §3.8~§3.11（避免 #2/#15 判定打架）|

> **prototype-spec.md 归档说明**：
> - **feature 类型**：prototype-spec.md 是 §2.4 过程性产出，编码正常结束即完成使命，无需独立 sync-status 字段
> - **Bug / Refactor 类型涉及 UI 变更**：必须同步更新受影响模块的 prototype-spec.md（执行详见 §3.10 Spec 状态同步）

> **整链重走时 §3.9 / §3.10 / §3.11 的处理规则**：
>
> §4 #1/#2/#13 不通过 → 回对应章节重做 → 依次重走后续章节直到 §3.11 → 回到 §4 重新检查。重走时**非破坏性章节**采用以下规则避免重复污染：
>
> | 章节 | 重走时的处理 |
> |---|---|
> | §3.9 生成 Changelog | **同日同 ID 文件覆盖**（`.project/changelog/{YYYY-MM-DD}-{xx}-{简述}.md` 文件名重合时覆盖；不新增独立文件，避免历史目录污染）|
> | §3.10 Spec 状态同步 | **change-log-specs.md 追加新留痕条目**（每轮重做的留痕独立保留，便于追溯审计修复历程；index.md sync-status 字段直接更新为 synced）|
> | §3.11 写入 context.md | **追加新记录**（每轮重做独立一条记录，produced 字段引用本轮最新一轮的 §3.6/§3.7 锚点哈希；G0.4 状态恢复始终读最后一条，所以历史轮次仅作审计痕迹保留）|
>
> 这条规则覆盖 §4 整链重走的衔接细节，避免 changelog 文件复制、留痕条目错位或 context.md last 字段紊乱。

归档通用动作（所有类型）：
- 标注任务类型标签：`[Feature]` / `[Bug]` / `[Refactor]`
- 生成任务执行摘要：汇总 REQ、子任务完成情况（含 task.md 进度）、接口清单、代码变更概要，以模块章节形式追加到 `.outdocs/task-report.md`
- **更新 context.md**：追加一条记录 `{日期} [{Feature/Bug/Refactor}] {模块名/任务名} 已归档 — last: §4 归档（下次 {§2.2 下一模块需求分析 / 等待用户指令}）`
  - **此记录是状态机锚定点**。当本次归档为「情况 A 全部模块完成」时，它是 context.md 最后一条带 `last:` 的记录；后续 E2E 附加验收（若执行）的痕迹**作为 `ref:` 续行追加到这条记录之后**（无空行），**不新增独立 `last:` 记录、不写 `produced:`**（强制遵守 AGENTS.md 编号规约第 8 条「E2E 附加验收」）

---

### §4 归档后路由

> 通用动作完成后，按以下决策树路由：

**Step 0：确定当前模块位置**

从 `index.md` 读 `dev-order`，判断当前模块在所有 dev-order 模块中的位置：

- `dev-order` = 最后一个（之后无更高 dev-order 的模块）且**所有更低 dev-order 模块均已 `[done]` 归档** → **情况 A：全部模块完成**
- `dev-order` 非最后一个，或存在未归档的更低 / 其他 dev-order 模块 → **情况 B：还有下一模块**
- 单模块项目（仅 1 个模块且已归档）→ **情况 A**
- 无法确定是否全部模块已归档（index.md 缺失 / dev-order 紊乱 / 模块状态不全）→ **不自动进入情况 A，触发 G2「路由不确定」**，请用户确认"是否所有功能模块均已开发并归档"：确认是 → 情况 A；确认否或不确定 → 情况 B（按逐个确认模式询问下一模块）

> **E2E 触发铁律（贯穿情况 A/B/C）**：E2E 是**附加验收**，**仅情况 A（所有 dev-order 模块全部归档完成）才可触发**。无论单模块 / 多模块 / 连续模式 / 逐个确认模式，**任何模块未归档时一律不得进入 E2E**；情况 B（还有下一模块）、情况 C（bug/refactor）**不触发 E2E**。E2E 不影响、不阻塞、不改写任何模块的主流程章节状态。

---

#### 情况 A：全部模块完成（最后一个模块 / 仅 1 个模块 / dev-order 无法确定）

> **覆盖**：连续模式 last 模块、逐个确认 last 模块、单模块项目、index.md 缺失

```
【全部模块完成】所有 dev-order 模块已归档。
```

先执行 E2E 适用性判断，再决定是否询问执行。AI 必须从 `.project/context.md` / `index.md` / 当前 REQ 头部读取项目类型与任务类型；无法判定时输出 G2「路由不确定」让用户确认。

**E2E 适用性判断表**：

| 场景 | 是否默认进入 E2E 确认 | 处理 |
|---|---|---|
| 新项目 feature | 是 | 若存在可浏览器访问的 Web/H5/管理后台/响应式页面，则询问是否执行；若不能做 E2E，必须告知用户原因并记录 `SKIP` 留痕，不生成 E2E 报告 |
| 旧项目 feature / 新增需求 | 是 | 若本次新增需求有可浏览器访问产品端且 TC-F 中有 `channel=e2e`，则询问是否执行；若不能做 E2E，必须告知用户原因并记录 `SKIP` 留痕，不生成 E2E 报告 |
| bug 修复 | 否 | 不执行 E2E；只依赖 §3.7 自测、§3.6 审计与必要的补充验证，完结信号标注「Bug 修复场景不进行 E2E」，记录 `SKIP` 留痕，不生成 E2E 报告 |
| refactor / 技术优化 | 条件判断 | 仅当优化影响用户主流程、页面路由、接口契约、权限链路或跨模块状态流转，且存在可浏览器访问产品端时，才询问是否执行；否则告知用户「无必要或不可做 E2E」并记录 `SKIP` 留痕，不生成 E2E 报告 |

**不能做 E2E 的常见原因**：
- 产品端不是 Playwright 可自动化范围：小程序原生容器、原生 iOS/Android、桌面客户端（含 Electron）、硬件强依赖
- 无可访问 `base_url`，且无法启动本地/测试环境
- `.test/.test-env.md` 可自动创建 / 补全，但 `e2e.base_url`、`e2e.test_command` 或账号类 `vars.*` 缺失且用户不提供 / 不确认
- TC-F 中没有 `channel=e2e` 或所有 e2e 用例缺少可执行契约
- 旧项目缺少可用测试账号 / fixture / seed，且用户不提供

若判断结果为「不执行」，不调用 `e2e-test-runner`，不生成 `.outdocs/e2e-report.md/html` 或 `.test/e2e/report.md/html`。只追加 context.md 留痕，结论为 `SKIP`，原因写明「场景不适用 / 无必要 / 不可执行 / 用户跳过」之一。

判断结果需要执行或可执行时，输出：

```
【E2E 测试确认】
所有功能模块已开发完成。是否执行 E2E 端到端测试？
（E2E 测试消费 §2.7 产出的 TC-F 功能测试用例，执行时间较长）
  A. 执行 E2E 测试（调用 e2e-test-runner，仅 Playwright）
  B. 跳过（不执行 E2E 测试）
```

> **E2E 前置校准提示（用户选 A 前必读，强制输出给用户）**：§2.7 的 `e2e-exec` 是在**编码前**按 PRD/DES 文字设计的，此时真实前端 DOM 尚不存在。现在全部模块已实现并归档，**首次 E2E 跑绿的前提是真实环境对齐**，AI 选 A 后、调用 Runner 前必须提示用户确认：
> 1. **Selector 校准（可选但强烈建议）**：按真实已实现页面，校准/补全 `.test/.test-env.md` 的 `## Selectors`（`selectors.*`）。**不补也能跑**——`${selectors.*}` 缺失时 Runner 自动回退 `role/name/label/placeholder/text` 定位（详见 playwright-adapter.md §一/§四），但补准映射能显著降低首轮 locator 失败率。
> 2. **真实账号 / 数据**：旧项目须在 `.test/.test-env.md` 的 `vars.*` 填可用测试账号 / seed；新项目确认是否允许 AI 造数（`ai_generated`）。账号类硬依赖缺失会使相关用例 `BLOCKED`。
> 3. **可达 base_url**：确认 `e2e.base_url` 可访问或 `e2e.start_command` 可拉起服务。
> 预期管理：首轮 E2E 出现部分 `FAIL/BLOCKED` 属正常（编码前设计用例 + 真实 DOM 偏差），按 E2E 报告结论路由处理（FAIL → bug 修复回环 / 标记已知 / 人工排查），不影响已归档模块状态。

用户选 A 时，AI 必须读取 `{SKILL_DIR}/rules/skill-routing.md`，按 Skill 调用强制约束读取并执行 `{SKILL_DIR}/tools/e2e-test-runner/SKILL.md`。

用户选 B 时，不调用 `e2e-test-runner`，不生成 E2E 报告；只追加 context.md 留痕，结论为 `SKIP`，原因写 `用户跳过`。

**E2E 执行边界**：
- 默认执行所有 `channel=e2e` 用例（P0/P1/P2 全量尝试），不按优先级缩减
- `channel=visual` 生成截图/报告入口；无基准时不做像素断言
- `channel=manual` 进入未自动执行清单
- `.test/.test-env.md` 缺失时由 `e2e-test-runner` 自动创建并补全可安全确定字段；`base_url` / `test_command` / 账号类变量不能猜测
- 若 `base_url` 不可达，Runner 先尝试使用 `.test/.test-env.md` 的 `e2e.start_command` 启动服务；缺少启动命令时从项目脚本中选择可信候选并自动启动，无法唯一判断时才询问用户
- 不支持 Cypress、小程序、原生 App、桌面客户端（含 Electron）
- 不修改 §3.1 / §3.5 / §3.7，也不向业务代码提出 selector / data-testid 类要求或建议
- 只做能做 E2E 且有必要做 E2E 的场景；不适用时必须清楚告知用户原因

**E2E 产物**（仅实际执行 E2E 时生成；不执行 E2E 时不生成报告）：
```
.test/e2e/
├── E2E-PLAN.md
├── playwright.config.ts
├── results.json
├── data/
├── specs/
├── artifacts/
├── report.md
└── report.html

.outdocs/
├── e2e-report.md
└── e2e-report.html
```

**E2E 报告结论路由**（仅实际执行 E2E 后适用）：

| 结论 | 处理 |
|---|---|
| `PASS` | 继续输出工作流完结信号 |
| `PARTIAL` | 允许完结，但完结信号标注 E2E 覆盖降级（列出未自动执行 / BLOCKED 用例） |
| `SKIP` | 仅当 Runner 已进入执行阶段但 Playwright 未实际运行时出现；允许完结，完结信号标注 E2E 未执行原因（依赖 / 环境） |
| `FAIL` | 不直接完结，先输出「E2E 失败处理」三选一 |

FAIL 时输出：
```
【E2E 失败处理】
检测到 E2E 失败：
  - {TC-ID} {场景名}：{失败摘要}

请选择：
  A. 进入 bug 修复回环（等价 /sdd-bug-fix，推荐）
  B. 标记为已知问题并完结
  C. 停止，人工排查环境
```

**context.md 留痕（强制遵守 AGENTS.md 规约第 8 条）**：

E2E 痕迹**不新增独立记录**，只作为 `ref:` 续行**紧跟在「§4 归档通用动作」写入的那条 `last: §4 归档` 记录之后**（无空行，无 `produced:`）。该 `last: §4 归档` 记录始终是 context.md 最后一条带 `last:` 的记录，跨对话 G0.4 / 执行自审据此定位，E2E 不进入状态机、不参与哈希校验、不触发回滚。

E2E 实际执行完成后，在 `last: §4 归档` 记录下追加续行：
```markdown
{日期} [Feature/...] {模块名} 已归档 — last: §4 归档（下次 等待用户指令）
ref: e2e {PASS/PARTIAL/FAIL} .outdocs/e2e-report.md ({日期}; {N}通过/{N}失败/{N}跳过/{N}阻塞)
```

E2E 未执行 / 跳过时，追加 SKIP 续行（同样不写 `produced:`，不写新 `last:`）：
```markdown
{日期} [Feature/...] {模块名} 已归档 — last: §4 归档（下次 等待用户指令）
ref: e2e SKIP 未生成 ({日期}; 原因: {场景不适用 / 无必要 / 不可执行 / 用户跳过 / Bug 修复场景不进行 E2E})
```

> 上方各 E2E 适用性表 / 结论路由表中提到的「记录 SKIP 留痕」「追加 context.md 留痕」均指本节的 `ref:` 续行，不得写 `last: §4 E2E 测试` 之类伪章节状态。

E2E 执行完毕、用户选择跳过，或 FAIL 后用户选择 B 标记已知问题完结时，输出完结信号：

```
【SDD 工作流完结】
所有模块已归档，E2E 测试 {PASS / PARTIAL / SKIP / 已知问题完结}。
SDD 工作流阶段已全部完成。

后续如需继续：
  · 新功能需求 → 说"新需求"或运行 /sdd-start
  · Bug 修复   → 描述 bug 现象或运行 /sdd-bug-fix
  · 代码优化   → 说"优化 XXX"
```

---

#### 情况 B：还有下一模块（非最后一个模块）

根据 §2.1 Step 4 选择的执行模式路由：

**B-1 连续模式**：自动进入下一模块

```
【模块完成】{当前模块名} 已归档。
自动进入下一模块：{编号}-{模块名}（dev-order: {N}，子任务: {M} 项）
```

→ 加载 `{SKILL_DIR}/rules/phase-spec.md`，从 §2.2 需求分析开始下一模块。

**B-2 逐个确认模式（默认）**：询问用户

```
【模块完成】{当前模块名} 已归档。
下一模块：{编号}-{模块名}（dev-order: {N}）
是否进入？
  A. 进入（task.md 已有子任务明细，直接进入 §2.2）
  B. 跳过，选择其他模块
  C. 暂停开发
```

用户选 A → 进入 §2.2 需求分析。
用户选 B → 列出剩余模块（index.md 中 dev-order 更高的未归档模块）供选择。
用户选 C → 结束本次对话。

---

#### 情况 C：bug / refactor 类型

不按模块路由，归档后询问用户下一步：

```
【任务完成】{当前任务} 已归档。
下一步？
  A. 继续处理其他 Bug / 优化
  B. 回到 feature 开发（按 dev-order 继续）
  C. 暂停
```
