# NY-SDD-Workflow

**SDD Workflow v1.0** — AI 编码工作流规则，G 系列全局规则 + §1~§4 阶段编号 + 流程声明头 + 动态加载架构，兼容多 AI 编码工具。

一条命令安装，统一团队 AI 编码规范。

## 安装

### 方式 1：通过 Skills CLI 安装（推荐）

```bash
npx skills add https://github.com/91160/skills --skill ny-sdd-workflow
```

中文用户也可以通过 Skills宝 发现更多 skills：https://skilery.com

### 方式 2：通过 Git Clone 手动安装

```bash
# 克隆整个 skills 仓库
git clone https://github.com/91160/skills.git

# 或只克隆 ny-sdd-workflow（如仓库支持 sparse-checkout）
git clone --filter=blob:none --sparse https://github.com/91160/skills.git
cd skills
git sparse-checkout set ny-sdd-workflow
```

### 方式 3：直接下载

从 [GitHub Releases](https://github.com/91160/skills/releases) 下载最新版本，解压后将 `ny-sdd-workflow/` 放入项目的 `.agents/skills/` 目录。

### 安装后

在 AI 对话中说 **"启动工作流"** 或 **"安装 SDD"**，AI 会自动：

1. 将 `AGENTS.md`（G 系列核心规则 + 编号流程规约）写入项目根目录，路径自动解析
2. 创建各 AI 工具的指令文件 symlink
3. 输出初始化状态报告

---

## 是什么

NY-SDD-Workflow 是一套 **AI 编码工作流规则**，定义了从项目启动到业务开发的全流程规范：

- **G1 写码门禁**：AI 写代码前必须通过 6 项检查（项目初始化、需求文档、方案评审、Skill 安装、任务定位、铁律合规）
- **G2 停车信号**：5 类不确定场景自动暂停，等待用户裁决
- **Skill 路由**：按技术栈自动匹配公司级编码规范 Skill，强制执行日志 + coding-skill/audit-skill 双列状态追踪
- **技术文档**：`.docs/` 目录自动扫描识别，编码时必须以文档为准
- **任务拆分**：模块排序 + 依赖分析 + 子任务拆分 + 连续/逐个确认执行模式
- **需求变更**：PRD 变更 / 技术文档变更 / specs 变更三种触发源，统一级联处理
- **PRD 审计**：新项目 6 维度审计，单功能 4 维度审计
- **编码规约**：10 条编码规约（C-01~C-10）+ 8 条审计规约（S-01~S-08 含 UI 还原 + 功能完整性）+ 6 条自测项（T-01~T-06）
- **变更通道**：直通 / 快速 / 标准三通道，按变更类型自动路由
- **交付文档**：接口文档 / 审计报告 / 自测报告 / 执行报告 / 变更记录，按模块章节自动追加
- **多工具兼容**：一份规则文件，自动适配 8 款 AI 编码工具

---

## 架构：动态加载 + 流程声明头 + 前后端 Context 独立

### 设计思路

将规则拆为**核心 + 阶段文件**，AI 每次只加载当前阶段需要的规则，避免注意力稀释和 token 浪费。

v1.0 采用两套编号体系 + 流程声明头机制：

- **G 系列**（AGENTS.md 始终加载）：G0 对话初始化 + G1 写码门禁 + G2 停车信号 + G3 未覆盖场景兜底
- **§ 系列**（phase-*.md 按需加载）：§1 项目启动 / §2 需求与设计 / §3 编码变更通道 / §4 归档
- **流程声明头**：每个 §N.N 章节顶部有一段「流程声明」引用块（phase/step/prev/next/gate/blocking），AI 按字段机械跳转，无需从正文推理

```
AGENTS.md（始终加载）
  │  G0 对话初始化 + G1 写码门禁 + G2 停车信号 + G3 未覆盖场景兜底 + 阶段路由表
  │
  ├── 判断当前阶段 → 按需读取对应文件（每个章节含流程声明头）：
  │
  │   rules/phase-init.md      §1 项目启动（§1.1~§1.5）
  │   rules/phase-spec.md      §2 需求与设计（§2.1~§2.7）
  │   rules/phase-coding.md    §3 编码变更通道（§3.0~§3.11）
  │   rules/phase-archive.md   §4 归档
  │
  ├── 审计/Skill 时按需读取：
  │
  │   rules/quality-standards.md  审计标准（PRD/REQ/DES/代码/自测）
  │   rules/skill-routing.md      Skill 路由表
  │
  └── 初始化时按需读取：

      templates/project-profile.tpl.md   project-profile.md 模板
      templates/project-overview.tpl.md  project-overview.md 模板
```

### 加载效率

| 场景         | 加载量                                                 |
| ------------ | ------------------------------------------------------ |
| 每轮对话固定 | **AGENTS.md 核心规则**（G 系列 + 规约 + 路由表） |
| 编码阶段     | AGENTS.md + phase-coding.md                            |
| 初始化阶段   | AGENTS.md + phase-init.md                              |
| 审计时追加   | quality-standards.md                                   |

### 路径解析机制

AGENTS.md 模板中用 `{SKILL_DIR}` 占位符引用阶段文件。安装时 cli.js 自动替换为实际路径：

- 项目内安装 → 相对路径：`.agents/skills/ny-sdd-workflow`
- 全局安装 → 绝对路径：`/Users/xxx/.claude/skills/ny-sdd-workflow`

安装后 AGENTS.md 中的路径是写死的真实值，AI 可直接读取，无额外 symlink。

### 兼容性

| AI 工具                 | 读取范围                             | 说明                                                |
| ----------------------- | ------------------------------------ | --------------------------------------------------- |
| Claude Code / Codex     | AGENTS.md + 阶段文件（含流程声明头） | 支持动态读取 + 声明头机械跳转，完整体验             |
| Cursor / Copilot / 其他 | 仅 AGENTS.md（G 系列 + 阶段路由表）  | G0 对话初始化 + G1 门禁 + G2 停车已足够保障基本流程 |

---

## 支持的 AI 工具

| 工具           | 指令文件位置                           | 对接方式 |
| -------------- | -------------------------------------- | -------- |
| Claude Code    | `AGENTS.md`                          | 原生读取 |
| OpenAI Codex   | `AGENTS.md`                          | 原生读取 |
| Cursor         | `.cursor/rules/ny-sdd-workflow.md`   | symlink  |
| GitHub Copilot | `.github/copilot-instructions.md`    | symlink  |
| Cline          | `.clinerules`                        | symlink  |
| Windsurf       | `.windsurfrules`                     | symlink  |
| Augment        | `.augment/rules/ny-sdd-workflow.md`  | symlink  |
| Continue       | `.continue/rules/ny-sdd-workflow.md` | symlink  |

---

## 使用

### AI 对话中

| 说法                      | 触发操作                         |
| ------------------------- | -------------------------------- |
| "启动工作流" / "安装 SDD" | 安装（生成 AGENTS.md + symlink） |
| "更新工作流" / "更新 SDD" | 更新 AGENTS.md 到最新版本        |
| "查看工作流状态"          | 检查各工具安装情况               |
| "卸载工作流"              | 清理 symlink（保留 AGENTS.md）   |

### 终端中

```bash
npx skills add https://github.com/91160/skills --skill ny-sdd-workflow   # 安装
npx skills update                                                         # 更新
npx skills status                                                         # 查看状态
npx skills remove ny-sdd-workflow                                         # 卸载
```

---

## Skill 目录结构

```
ny-sdd-workflow/                         ← Skill 安装目录
├── SKILL.md                             ← AI 读取的安装逻辑
├── bin/cli.js                           ← CLI 入口
├── package.json
├── rules/                               ← 阶段规则文件（AI 按需读取，含流程声明头）
│   ├── phase-init.md                    ← §1 项目启动（§1.1~§1.5）
│   ├── phase-spec.md                    ← §2 需求/设计/评审/功能测试（§2.1~§2.7）
│   ├── phase-coding.md                  ← §3 编码变更通道（§3.0~§3.11）
│   ├── phase-archive.md                 ← §4 归档
│   ├── quality-standards.md             ← 审计标准（PRD/REQ/DES/代码/自测）
│   ├── skill-routing.md                 ← Skill 路由表 + 执行流程
│   └── fallback/                        ← 兜底扫描（context skill 不可用时）
│       ├── frontend-scan.md             ← 前端内置扫描
│       └── backend-scan.md              ← 后端内置扫描
├── tools/                                ← 内置 Skill（无需远程安装，AI 直接读取）
│   ├── prd-audit/                        ← PRD 审计
│   ├── java-project-creator/             ← 后端脚手架（仅新项目）
│   ├── wap-project-creator/              ← 前端脚手架（仅新项目）
│   ├── front-project-context/            ← 前端规范提取
│   ├── back-project-context/             ← 后端规范提取
│   ├── frontend-code-standards/          ← 前端编码规范
│   ├── reverse-scan/                     ← 深度代码扫描
│   ├── test-case-design/                 ← 功能测试用例设计（§2.7）
│   └── unit-test-generator/              ← 单元测试（§3.7）
└── templates/                            ← 模板文件
    ├── AGENTS.md                         ← 核心规则模板（含 {SKILL_DIR} 占位符）
    ├── project-profile.tpl.md            ← project-profile.md 模板（仅项目级）
    └── project-overview.tpl.md           ← project-overview.md 模板
```

## 项目目录结构（安装后）

```
项目根目录/
├── AGENTS.md                          ← G 系列核心规则 + 编号流程规约（路径已解析）
├── .project/                          ← 项目管理目录（AI 自动创建维护）
│   ├── context.md                     ← 每次对话必读，AI 自动维护
│   ├── task.md                        ← 子任务进度跟踪
│   ├── specs/
│   │   ├── master/
│   │   │   ├── index.md               ← 模块状态总览
│   │   │   ├── requirements/REQ-*.md
│   │   │   ├── design/DES-*.md
│   │   │   └── prototypes/            ← §2.4 原型产出（HTML + prototype-spec.md）
│   │   ├── change-log-specs.md
│   │   └── rules/
│   │       ├── project-profile.md     ← 项目级（铁律/技术栈/外部依赖/业务架构）
│   │       ├── frontend-context.md    ← 前端规范（context skill 产出）
│   │       ├── backend-context.md     ← 后端规范（context skill 产出）
│   │       └── unit-test-base.md      ← [可选] 自测规则
│   ├── changelog/
│   └── reverse-scan/                  ← [可选] 深度扫描产出（reverse-scan Skill）
│       ├── knowledge-cards/           ← 知识卡片
│       ├── call-graph.md              ← 调用关系图
│       ├── module-map.md              ← 模块地图
│       ├── db-schema.md               ← 数据库结构
│       ├── specs/                     ← 已有模块 REQ/DES（逆向，仅供参考）
│       ├── profile-patch.md           ← 合并就绪：业务架构 + 业务流程
│       ├── overview.md                ← 合并就绪：项目全景文档
│       ├── api-doc.md                 ← 合并就绪：全量接口文档
│       └── scan-summary.md            ← 扫描报告 + context 记录段
├── .docs/                             ← 用户提供的文档
│   ├── prd/                           ← PRD 文字需求（md/pdf）
│   │   ├── prototype/                 ← 原型图（线框图 png/jpg/pdf）
│   │   ├── ui/                        ← UI 设计稿（高保真 png/jpg/pdf）
│   │   └── ui-spec/                   ← UI 解析文件（Figma/蓝湖导出 md）
│   └── tech/                          ← 技术文档（API/建表脚本/配置等）
├── .test/                             ← 测试产出根目录（独立于 .project）
│   ├── .test-env.md                   ← 测试运行环境声明
│   ├── testcases/                     ← §2.7 功能测试用例（TC-F-*.md + CSV）
│   └── unit/                          ← §3.7 单元测试（UT-*.md + skeleton/ + report.md）
├── .outdocs/                          ← 交付文档输出
│   ├── project-overview.md
│   ├── api-doc.md
│   ├── audit-report.md
│   ├── unit-test-report.md
│   ├── task-report.md
│   └── prd-change-log.md
└── .agents/skills/                    ← Skill 安装目录（ny-sdd-workflow 自身，tools/ 已内置）
    ├── ny-sdd-workflow/               ← 本工作流（rules/ + templates/）
    └── reverse-scan/                  ← [可选] 深度代码扫描 Skill
```

---

## 工作流概览

```
G0 对话初始化（AGENTS.md，始终加载）
  → 检查 .project/context.md 是否存在？
     · 不存在（首次）→ G0.1 项目类型确认（A/B/C/D）→ G0.2 目录骨架 → G0.3 文档补充 → G0.5
     · 已存在（后续）→ G0.4 状态恢复（读 last 字段）→ G0.4.1 意图推断（非阻塞）
       · bug 意图 → 二次判定：当前需求 bug → 直接跳 §3.0（bug 修复回环）/ 新 bug → G0.5
       · 其他意图 → G0.5
  → G0.5 阶段路由（判断进入 §1 / §2 / §3 / §4）

G1 写码门禁（AGENTS.md，编码前触发）
  → 6 项检查：.project 初始化 / REQ+DES approved / 依赖就绪 / Skill 就位 / 子任务 pending / 铁律合规

G2 停车信号（AGENTS.md，全局触发）
  → 5 类场景：路由不确定 / 影响面超预期 / 循环超限 / 规则冲突 / 未覆盖场景

G3 未覆盖场景兜底（AGENTS.md，全局触发）

───────────────────────────────────────────────

§1 项目启动（rules/phase-init.md，按需加载）
  → §1.1 新项目流程：PRD 审计(Skill) → 扫描 .docs/ → 技术栈 → 脚手架(Skill) → §2.1
  → §1.2 旧项目流程：扫描代码 → 提取架构/规范/公共能力 → §1.4 深度扫描 → feature → §2.1 / bug·refactor → §2.2
  → §1.3 前后端规范提取（context Skill 或 fallback 兜底）
  → §1.4 深度业务代码扫描（reverse-scan Skill，仅旧项目）
  → §1.5 技术文档处理规则（.docs/ 自动扫描）

§2 需求与设计（rules/phase-spec.md，按需加载）
  → §2.1 任务拆分（模块排序 → 子任务拆分 → task.md → 执行模式）
  → §2.2 需求分析（REQ + 自审）
  → §2.3 方案设计（DES + api-doc.md 追加 + 自审）
  → §2.4 原型生成（仅 feature + 前端）
  → §2.5 评审（人工）→ review-status: approved
  → §2.7 功能测试用例设计（test-case-design Skill → TC 文档 + CSV，为 E2E 准备）
  → E2E 测试：§4 全部模块归档后用户确认执行（未来 Skill）
  → §2.6 Spec Sync（随时触发：specs/PRD/技术文档 三种触发源）

§3 编码变更通道（rules/phase-coding.md，按需加载）
  → §3.0 通道判断（含 bug 修复回环入口 ← G0.4.1 二次判定）
     · 直通：不涉及代码，直接回答
     · 快速：仅样式/文案，§3.1 → 改代码 → §3.9 → §3.10 → §3.11
     · 标准：§3.1~§3.11 完整执行
     · bug 修复回环：通道判断同上，§3.10 追加 REQ/DES 留痕，§3.11 按原始 last 路由
  → §3.1  加载规范 + 铁律（§3.1.1 铁律检查 / §3.1.2 已有代码认知 / §3.1.3 编码上下文 / §3.1.4 UI 上下文）
  → §3.2  加载 Spec（sync-status + coding-skill + audit-skill）
  → §3.3  文档学习（优先 .docs/）
  → §3.4  影响面评估（6 维度）
  → §3.5  代码变更（Skill + 执行日志 + C-01~C-10 + U-01~U-06）
  → §3.6  代码审计（Skill + S-01~S-07 代码质量 + S-08 功能完整性 → audit-report.md）
  → §3.7  开发自测
     §3.7.1 自动化单测（unit-test-generator Skill → 设计+生成+执行+覆盖率+报告+清理）
     §3.7.2 自动补充验证（T-01~T-06，AI 能做的自动执行，做不了的跳过）
  → §3.8  更新 task.md
  → §3.9  生成 Changelog
  → §3.10 Spec 状态同步（bug 修复回环追加 REQ 记录 + DES 标注）
  → §3.11 写入 context.md（bug 修复回环：原始 last §3.x→回原位 / §4→重新归档）

§4 归档（rules/phase-archive.md，按需加载）
  → 15 项检查清单（含功能测试用例 + 单元测试通过）
  → 生成 task-report.md
  → 衔接下一模块（连续模式 / 逐个确认模式）
```

---

## .gitignore 配置

```gitignore
# SDD Workflow symlink（由 ny-sdd-workflow 生成，不提交）
.cursorrules
.clinerules
.windsurfrules

# AGENTS.md 需要提交（源文件）
# .cursor/rules/ 和 .github/ 目录下的 symlink 按团队约定决定是否提交
```

---

## 注意事项

- v1.0 的 AGENTS.md 依赖 skill 目录中的 `rules/` 文件。如果 skill 被删除，AI 会提示"文件不存在"，重新安装即可恢复
- 其他 AI 工具（Cursor/Copilot 等）只能读取 AGENTS.md 中的 G 系列核心规则（G0 对话初始化 + G1 门禁 + G2 停车 + G3 兜底），不会动态加载阶段文件及其流程声明头
- 完整体验需 Claude Code / Codex（支持动态加载 + 声明头机制）

---

## Skill 路由表

| 阶段             | 触发时机                            | Skill                   | 兜底                   |
| ---------------- | ----------------------------------- | ----------------------- | ---------------------- |
| PRD 审计         | §1.1 / §1.2(feature) / §2.6[prd] | prd-audit               | 6维度/4维度            |
| 后端项目初始化   | §1.1（仅新项目）                   | java-project-creator    | 官方 CLI               |
| 前端项目初始化   | §1.1（仅新项目）                   | wap-project-creator     | 官方 CLI               |
| 前端规范提取     | §1.3 前后端规范提取                | front-project-context   | 内置前端扫描           |
| 后端规范提取     | §1.3 前后端规范提取                | back-project-context    | 内置后端扫描           |
| 前端编码         | §3.5 代码变更（前端）              | frontend-code-standards | C-01~C-10              |
| 后端编码         | §3.5 代码变更（后端）              | —                      | 内置兜底（C-01~C-10）  |
| 代码审计         | §3.6 代码审计                      | —                      | 内置兜底（S-01~S-08）  |
| 深度代码扫描     | §1.4 深度业务代码扫描              | reverse-scan            | 浅层业务架构推断       |
| 功能测试用例设计 | §2.7 评审通过后                    | test-case-design        | 跳过（非编码阻断项）   |
| 单元测试         | §3.7 编码后自测                    | unit-test-generator     | T-01~T-06 全量手工自测 |
| E2E 测试         | §4 全部模块归档后（用户确认）      | [未发布]                | —                     |

Skill 执行流程（统一）：

```
读取 {SKILL_DIR}/tools/{skill名}/SKILL.md
  → 文件存在 → 调用 → 输出执行日志
  → 文件不存在 → 使用内置兜底规则
所有 Skill 已内置在 tools/ 目录下，无需远程安装。
```

---

## 交付文档（.outdocs/）

| 文件                | 写入时机                   | 写入方式                                                              |
| ------------------- | -------------------------- | --------------------------------------------------------------------- |
| project-overview.md | §1.1 / §1.2 / §2.1      | 按模板生成，增量补充                                                  |
| api-doc.md          | §2.3 DES 完成后           | 从 DES 自动提取，按模块章节追加                                       |
| audit-report.md     | §3.6 代码审计             | 按模块章节追加                                                        |
| unit-test-report.md | §3.7 开发自测             | 按模块章节追加（§3.7.1 自动化单测 + §3.7.2 自动补充验证 T-01~T-06） |
| task-report.md      | §4 归档时                 | 按模块章节追加执行摘要                                                |
| prd-change-log.md   | §2.6 Spec Sync PRD 变更时 | 追加变更记录                                                          |

**测试产出（.project/ 内部，非交付文档）**：

| 文件                                               | 写入时机 | 位置                                 |
| -------------------------------------------------- | -------- | ------------------------------------ |
| TC-F-*.md（功能测试用例）                          | §2.7    | `.test/testcases/`（按模块分文件） |
| testcases.detailed.csv + testcases.traditional.csv | §2.7    | 同上（全局汇总，所有模块追加）       |
| UT-*.md（单测用例文档）                            | §3.7.1  | `.test/unit/`                      |
| skeleton/*（单测代码骨架）                         | §3.7.1  | `.test/unit/skeleton/`             |
| report.md（单元测试报告）                          | §3.7.1  | `.test/unit/`                      |

---

## 常见问题

### Q: Windows 系统能用吗？

可以。Windows 不支持 symlink，CLI 会自动改用文件复制。更新时需重新执行 `npx skills update`。

### Q: 已有 .cursorrules 等文件怎么办？

初始化时如果目标文件已存在且非 symlink，会跳过并提示。不会覆盖已有配置。

### Q: AGENTS.md 可以自定义吗？

可以。AGENTS.md 是源文件，修改后所有 symlink 自动同步。建议通过 `project-profile.md` 定义项目级铁律和规范，AGENTS.md 保持通用。

### Q: 如何更新到新版本？

```bash
# 终端更新
npx skills update

# 或在 AI 对话中说"更新工作流"
```

### Q: 和其他 Skill 是什么关系？

ny-sdd-workflow 是 **常驻工作流规则**（AGENTS.md 的 G 系列），其他 Skill 是 **按需触发的编码规范**。

```
ny-sdd-workflow        ← 常驻规则（AGENTS.md G 系列 + rules/ §1~§4 按需加载）
  ├── prd-audit             ← §1.1 / §1.2(feature) / §2.6[prd] 按需调用
  ├── java-project-creator  ← §1.1 按需调用（仅新项目）
  ├── wap-project-creator   ← §1.1 按需调用（仅新项目）
  ├── front-project-context ← §1.3 按需调用（前端规范提取）
  ├── back-project-context  ← §1.3 按需调用（后端规范提取）
  ├── frontend-code-standards  ← §3.5 按需调用（前端编码）
  ├── reverse-scan             ← §1.4 按需调用（深度代码扫描）
  ├── test-case-design         ← §2.7 按需调用（功能测试用例设计）
  └── unit-test-generator      ← §3.7 按需调用（单元测试）
```

### Q: Cursor/Copilot 只读 AGENTS.md，功能会缺失吗？

不会严重缺失。AGENTS.md 的 G 系列核心规则已包含最关键的机制：

- **G0 对话初始化**：项目类型确认、目录骨架、状态恢复、阶段路由
- **G1 写码门禁**：确保 AI 不会跳过需求/设计直接写代码
- **G2 停车信号**：确保 AI 在不确定时暂停而非猜测
- **G3 未覆盖场景兜底**：统一的未覆盖场景处理

这些机制覆盖了 80% 的常见问题。完整的阶段规则（§1~§4 编码步骤、流程声明头跳转、审计标准等）需要 Claude Code / Codex 的动态加载能力。

### Q: .docs/ 文档怎么放？

分为 PRD 和技术文档两大类，PRD 内部再细分 4 类：

- `.docs/prd/` — PRD 文字需求（md/pdf/txt）
- `.docs/prd/prototype/` — 原型图（线框图，png/jpg/pdf）
- `.docs/prd/ui/` — UI 设计稿（高保真视觉，png/jpg/pdf）
- `.docs/prd/ui-spec/` — UI 解析文件（Figma/蓝湖导出的 md）
- `.docs/tech/` — 技术文档（API/建表脚本/中间件配置等）

**子目录不强制**：不确定归类的文件可直接放 `.docs/prd/` 根目录，AI 会按"文件名关键词 + 内容视觉判断"自动识别。

编码时 UI 基准优先级：UI 解析 md > UI 设计稿 > 原型图 > HTML 原型 > DES > 样式体系（详见 §3.1.4）。

---

## 版本记录

| 版本   | 日期       | 变更                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0.0 | 2026-04-17 | 首次发布。G 系列全局规则（G0 对话初始化 / G1 写码门禁 / G2 停车信号 / G3 未覆盖场景兜底）+ §1~§4 阶段编号 + 流程声明头机制（phase/step/prev/next/gate/blocking）+ 动态加载架构 + PRD 三类内容管理（prototype/ui/ui-spec）+ UI 基准 6 级优先级 + context.md 状态标记规约 + 10 条编码规约 C-01~C-10 + 6 条 UI 还原规约 U-01~U-06 + 8 条审计规约 S-01~S-08 + 6 条自测规约 T-01~T-06 + 多 AI 工具兼容（8 款） |
| v1.0.1 | 2026-04-20 | 集成 test-case-design（§2.7 功能测试用例设计）+ unit-test-generator（§3.7.1 自动化单测）+ 9 个 Skill 内置 tools/ 目录 + bug 修复回环机制（G0.4.1 二次判定 → §3.0 回环 → §3.10 文档留痕 → §3.11 路由分流）+ G1 #5 回环豁免 + java-coding/code-audit 移除改用内置兜底 + S-08 功能完整性审计                                                                                                             |
