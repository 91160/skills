# TC 文档骨架模板

本文件定义 `TC-F-{module_id}-{module_name}.md` 文档的完整骨架结构。供 Skill 的 Step 6（组装 TC 文档）引用。

**核心原则**：元数据 + 覆盖矩阵 + 自审报告 **全部内嵌文档头部**，不拆独立文件。

**Sibling 输出**：TC 文档与 `testcases.detailed.csv` 是 **并行输出**（同一批用例的两种视图）：
- **TC-xx.md**：面向 **AI 自动执行**，含双层结构（人类描述 + tc-exec 契约）
- **testcases.csv**：面向 **QA 人工管理**，12 列精简 Schema，可导入测试管理工具（TestRail / Zephyr / Xray / 禅道 / 飞书多维表格）

两份文件从同一份用例蓝本（Step 3 产出）并行投影，而非互相派生。CSV 的详细规范见 `references/csv-export-schema.md`。

**定位**：本 Skill 只生成功能测试用例（manual/ui-dom/ui-visual channel）。单元测试（unit/api/db channel）由独立 Skill `/unit-test-generator` 负责。

---

## 一、完整骨架（直接复制填充）

````markdown
# TC-F-{module_id} {module_name} 功能测试用例集

## 元数据

- `module = {module_id}-{module_name}`
- `task-type = {feature|bug|refactor}`
- `req-ref = {REQ 文件路径}`
- `des-ref = {DES 文件路径}`
- `prd-ref = {PRD 文件路径，可选}`
- `affected-module = {bug/refactor 类型必填，feature 省略}`
- `review-status = draft`
- `test-case-status = draft`
- `total-cases = {N}`
- `executable-rate = {N}%`
- `channel-breakdown = manual:{N}, ui-dom:{N}, ui-visual:{N}`
- `inferred-des = {true|false}`
- `generated-at = {YYYY-MM-DD}`
- `generator = test-case-design Skill v1`

## 覆盖率矩阵

| REQ 验收标准 | DES 维度 | 对应 TC | 通道 |
| --- | --- | --- | --- |
| §2.1 正常登录 | 核心流程 §3.1 | TC-F-{module_id}-001 | manual |
| §2.1 正常登录 | UI §5.1 布局 | TC-F-{module_id}-002 | ui-dom |
| §2.2 密码错误 | 异常路径 | TC-F-{module_id}-003 | manual |
| §2.3 账号锁定 | 状态管理 §6.1 | TC-F-{module_id}-004 | manual |
| ... | ... | ... | ... |

**覆盖率统计**：
- REQ 验收标准覆盖率: {N}/{M} = {百分比}
- DES 维度覆盖率: 数据✅ / API✅ / 流程✅ / 状态✅ / 权限✅ / UI✅

**方法论使用统计**：
- 等价类划分: {N} 条
- 边界值分析: {N} 条
- 判定表: {N} 条
- 场景法: {N} 条
- 状态迁移: {N} 条
- 错误推测: {N} 条

## 自审报告（TC-01 ~ TC-06）

- **TC-01 验收标准覆盖**: ✅ 通过 | 覆盖率 {N}/{M} = 100%
- **TC-02 DES 维度覆盖**: ✅ 通过 | 已覆盖维度: {清单}
- **TC-03 边界值覆盖**: ✅ 通过 | 已修复 {N} 项
- **TC-04 异常路径覆盖**: ✅ 通过 | 已覆盖异常: {清单}
- **TC-05 用例可执行**: ✅ 通过
- **TC-06 优先级合理**: ✅ 通过 | P0:{n} / P1:{n} / P2:{n} | P0 占比 {%}

**一致性校验**: ✅ Markdown 描述与 tc-exec 块语义对齐
**修复次数**: {总次数}

## 用例总览

| TC ID | 描述 | 优先级 | 通道 | 可执行 | 方法论 |
| --- | --- | --- | --- | --- | --- |
| TC-F-{mod}-001 | 正常登录流程 | P0 | manual | — | 场景法 |
| TC-F-{mod}-002 | 登录页布局还原 | P1 | ui-dom | — | 场景法 |
| TC-F-{mod}-003 | 密码错误处理 | P0 | manual | — | 错误推测 |
| ... | | | | | |

---

## 一、业务流程测试

> 本章覆盖从 REQ 验收标准推导的正常流程 + 异常流程 + 状态流转。采用场景法 + 状态迁移 + 等价类划分。

#### TC-F-{mod}-001 {描述}

**channel**: manual | **priority**: P0 | **exec-mode**: manual | **source**: REQ-{xx} 验收标准 #{N}

**目的**：{一句话说明为什么需要这条用例}

**关联需求**：REQ §X.Y（文本引用）

**方法论**：场景法 - 主路径

**步骤**:
1. {操作步骤}
2. {操作步骤}
3. {操作步骤}

**预期结果**:
- {预期行为}
- {预期行为}

---

## 二、UI 交互测试

{若不涉及前端 → 写 "不涉及（后端任务）"}

> 本章覆盖 DES 的 UI 还原维度 + PRD 视觉内容。前端 DOM 操作验证。

#### TC-F-{mod}-010 登录页 - 正常表单提交流程

**channel**: ui-dom | **priority**: P1 | **exec-mode**: manual | **source**: DES-{xx} > UI 还原

**步骤**:
1. 打开登录页
2. 输入用户名和密码
3. 点击登录按钮
4. 等待页面跳转

**预期结果**:
- 跳转到首页
- 显示用户名

---

## 三、视觉回归测试

{若不涉及前端 → 写 "不涉及（后端任务）"}

> 本章覆盖页面视觉一致性验证。

#### TC-F-{mod}-020 登录页 - 视觉一致性

**channel**: ui-visual | **priority**: P1 | **exec-mode**: manual | **source**: PRD 视觉内容

**步骤**:
1. 打开登录页
2. 对比 PRD 设计稿与实际页面

**预期结果**:
- 布局与设计稿一致
- 颜色/字号/间距符合规范

---

## 四、异常与边界测试

> 本章覆盖异常路径 + 边界条件 + 错误推测法。bug / refactor 任务以此章为核心。

#### TC-F-{mod}-030 密码错误 - 错误提示

**channel**: manual | **priority**: P0 | **exec-mode**: manual | **source**: REQ-{xx} 验收标准 #{N}

**方法论**：错误推测

**步骤**:
1. 输入正确用户名和错误密码
2. 点击登录

**预期结果**:
- 提示"用户名或密码错误"
- 不跳转

---

## 五、覆盖率矩阵

（见文档头部覆盖率矩阵章节，此处为完整统计）

---

## 六、不测范围与理由

- **{范围 1}**: {理由}
- **{范围 2}**: {理由}

---

## 附录：相关文件

- 引用的 REQ: `{req-ref}`
- 引用的 DES: `{des-ref}`
````

---

## 二、字段说明

### 元数据字段（12 个固定字段）

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `module` | ✅ | `{id}-{name}` | 模块标识，SDD 从 index.md 读，独立模式由调用方传入 |
| `task-type` | ✅ | `feature` / `bug` / `refactor` | 决定章节填充策略 |
| `req-ref` | ✅ | 路径 | REQ 文件的绝对或相对路径 |
| `des-ref` | ✅ | 路径 | DES 文件的绝对或相对路径，`inferred-des=true` 时可为空 |
| `prd-ref` | ⬜ | 路径 | PRD 文件路径，独立模式可省略 |
| `affected-module` | 🔸 | `{id}-{name}` 或列表 | bug/refactor 必填；feature 省略 |
| `review-status` | ✅ | `draft` / `approved` | 人工评审状态 |
| `test-case-status` | ✅ | `draft` / `done` / `doc-only` / `fallback` / `skipped` | 测试用例状态 |
| `total-cases` | ✅ | 整数 | TC 文档中的用例总数 |
| `executable-rate` | ✅ | 百分比 | 可执行用例占比 = (非 manual/ui-visual) / 总数 |
| `channel-breakdown` | ✅ | 逗号分隔 | 每个 channel 的用例数分布 |
| `inferred-des` | ⬜ | `true` / `false` | 无 DES 时从 REQ 推断，标 true |
| `generated-at` | ✅ | `YYYY-MM-DD` | 生成日期 |
| `generator` | ✅ | 固定字符串 | Skill 版本标识 |

### 覆盖率矩阵列（4 列）

| 列 | 数据来源 |
|---|---|
| REQ 验收标准 | REQ 文档的章节引用（如 `§2.1 正常登录`） |
| DES 维度 | DES 对应的章节或维度标签（如 `API §4.1`、`数据模型 §3.2`、`UI §5.1`） |
| 对应 TC | TC-ID 清单（一对多时多个 TC-ID 用逗号分隔） |
| 通道 | 该 TC 的 channel 值 |

### 用例总览列（6 列）

| 列 | 说明 |
|---|---|
| TC ID | TC-F-{module_id}-{seq:03} |
| 描述 | 一句话用例名 |
| 优先级 | P0 / P1 / P2 |
| 通道 | manual / ui-dom / ui-visual |
| 方法论 | 6 种方法论之一 |
| 方法论 | 6 种方法论之一 |

---

## 三、组装顺序（Skill Step 7 执行）

Skill 按以下 9 步组装 TC 文档：

```
1. 计算元数据
   - 统计 total-cases, channel-breakdown
   - 计算 executable-rate（非 manual/ui-visual 的占比）
   - 设置 generated-at 为当前日期

2. 组装覆盖率矩阵
   - 遍历 Step 3 生成的用例蓝本
   - 按 "REQ 验收标准 → TC 用例" 聚合生成表格
   - 统计 REQ 覆盖率和 DES 维度覆盖率
   - 统计方法论使用次数

3. 粘贴自审报告
   - 从 Step 5 自审结果直接粘贴
   - 所有 ✅ 才进入本步骤

4. 组装用例总览表
   - 按 TC-ID 顺序列出所有用例
   - 填 6 列数据

5. 组装第一章 业务流程测试
   - 从用例蓝本中筛选 channel=manual 且为正常/异常业务流程的用例
   - 采用场景法 + 状态迁移 + 等价类划分
   - 按 TC-ID 顺序排列

6. 组装第二章 UI 交互测试
   - 筛选 channel=ui-dom 的用例
   - 若任务不涉及前端，写 "不涉及（后端任务）"

7. 组装第三章 视觉回归测试
   - 筛选 channel=ui-visual 的用例
   - 若任务不涉及前端，写 "不涉及（后端任务）"

8. 组装第四章 异常与边界测试
   - 筛选 channel=manual 且为异常/边界/错误推测的用例 + bug/refactor 的回归用例

9. 组装第五章 覆盖率矩阵 + 第六章 不测范围
   - 第五章：完整统计（见文档头部矩阵）
   - 第六章：从 Step 3 用例设计过程中记录的"不测决策"补充
```

---

## 四、任务类型差异化填充策略

4 章在 3 种任务下的填充规则（引用自 `design-rules.md` 第三章）：

| 章节 | feature | bug | refactor |
|---|---|---|---|
| 一、业务流程测试 | **必填全量**：主路径 + 备选路径 + 状态流转 | 按 bug 影响的业务流程补充 | 改写为"业务行为等价性验证"（重构后行为不变） |
| 二、UI 交互测试 | 前端任务必填；后端任务标"不涉及" | 按 bug 涉及的 UI 补充 | 通常跳过（refactor 通常不改 UI） |
| 三、视觉回归测试 | 前端任务必填；后端任务标"不涉及" | 按 bug 涉及的视觉补充 | 通常跳过 |
| 四、异常与边界测试 | **必填**：异常路径 + 错误推测 + 边界条件 | **核心必填**：bug 复现用例 + 回归清单 | **核心必填**：等价性验证用例 + 回归清单 |

**两条强规则**：
- **bug 任务第五章必须包含"精确复现用例"**，锁定 bug 不再出现
- **refactor 任务禁止写基于实现细节的用例**，只允许基于"输入→输出"的等价性断言

---

## 五、独立模式下的文件路径

| 字段 | SDD 项目 | 非 SDD 项目 |
|---|---|---|
| TC 文档文件名 | `TC-F-{module_id}-{module_name}.md` | 同左，`module_name` 由调用方指定 |
| CSV 文件名 | `testcases.detailed.csv` + `testcases.traditional.csv`（全局汇总） | 同左 |
| 输出目录 | `.test/testcases/` | `./test-cases/`（默认）或 `output_dir` 参数 |
| REQ 引用路径 | `.project/specs/master/requirements/REQ-xx.md` | 用户提供的相对路径或绝对路径 |
| DES 引用路径 | `.project/specs/master/design/DES-xx.md` | 用户提供的相对路径或绝对路径 |
| PRD 引用路径 | `.docs/prd/{file}` | 用户提供的相对路径或绝对路径 |

---

## 六、组装完成后的验证清单

Skill Step 7 完成写盘前，逐条自检：

1. [ ] 文件名符合 `TC-F-{module_id}-{module_name}.md` 模式
2. [ ] 元数据 12 个必填字段齐全
3. [ ] `total-cases` 与实际用例数一致
4. [ ] `channel-breakdown` 的和 = `total-cases`
5. [ ] `executable-rate` 计算正确（非 manual/ui-visual / total）
6. [ ] 覆盖率矩阵中的每条 TC 在用例正文中都能找到
7. [ ] 用例总览表的每条 TC 在用例正文中都能找到
8. [ ] 自审报告显示全部 6 项通过
9. [ ] 五章结构完整（不涉及的章节有明确标注）
10. [ ] 所有 `#### TC-xx` 标题符合 `TC-F-{module_id}-{seq:03}` 格式
11. [ ] 所有 tc-exec 块符合 `tc-exec-schema.md` 定义
12. [ ] 所有变量引用 `${env.xxx}` 在 `.test-env.md` 中存在

任一 [ ] 未勾选 → 修复后重新组装。
