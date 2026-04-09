# Skill 路由表与执行流程

公司级规范以 Skill 形式封装，AI 在对应阶段必须自动安装并调用。

**Skill 仓库（默认）**：`https://git.nykjsrv.cn/ai-coding/skills.git`
**Skill 仓库（vant-vue3）**：`https://github.com/teachingai/full-stack-skills`
**安装命令**：`npx skills add {仓库地址} --skill {skill名称} --yes`

| 阶段           | 触发时机                     | Skill 路由            | skill 名称           | 仓库               |
| -------------- | ---------------------------- | --------------------- | -------------------- | ------------------ |
| PRD 审计       | §1.1 / §1.2(feature) / §2.4.5[prd] | /prd-audit            | prd-audit              | 默认               |
| 后端项目初始化 | §1.1 脚手架创建（仅新项目） | /java-project-creator | java-project-creator   | 默认               |
| 前端项目初始化 | §1.1 脚手架创建（仅新项目） | /wap-project-creator  | wap-project-creator    | 默认               |
| 前端规范提取   | §1 项目初始化               | /front-project-context| front-project-context  | 默认               |
| 后端规范提取   | §1 项目初始化               | /back-project-context | back-project-context   | 默认               |
| 前端编码       | §3 Step 4 前端改动          | /frontend-coding      | vant-vue3              | vant-vue3 专用仓库 |
| 后端编码       | §3 Step 4 后端改动          | /java-coding          | java-coding            | 默认               |
| 代码审计       | §3 Step 5                   | /code-audit           | code-audit             | 默认               |
| 深度代码扫描   | §1.2 旧项目初始化           | /reverse-scan         | reverse-scan           | 默认               |

**Skill 执行流程**（所有触发点必须统一严格遵守，不可跳过）：

```
1. 检查项目目录 .agents/skills/{skill名称}/ 是否已存在
   → 已存在 → 直接进入第 3 步（调用）
   → 不存在 → 进入第 2 步（安装）
2. 安装：根据路由表中的「仓库」列选择对应仓库地址，执行 npx skills add {仓库地址} --skill {skill名称} --yes
   → 安装成功 → 进入第 3 步
   → 安装失败 → 询问用户：
     A. 手动安装（用户自行执行命令后告知 AI）
     B. 使用内置默认兜底
     用户确认后继续
3. 调用：读取 Skill 内容，按其规范执行
4. 输出执行日志（必须，未输出视为未执行）
5. 更新状态（§3 编码阶段的 Skill）：更新 index.md 对应模块的 `coding-skill` 或 `audit-skill`
```

**Skill 执行日志格式**（每次执行 Skill 流程后必须输出，禁止省略）：

```
【Skill 执行日志】
  阶段: {触发阶段，如 §1.1 PRD审计 / §3 Step4 前端编码}
  Skill: {skill名称}
  检查: .agents/skills/{skill名称}/ → {已存在 / 不存在}
  安装: {跳过(已存在) / 安装成功 / 安装失败}
  执行: {调用Skill / 内置兜底({兜底方式})}
```

**匹配规则**：

- 根据 project-profile.md「技术栈」声明 + 当前改动文件类型，匹配对应 Skill
- Skill 安装失败 → 询问用户（手动安装 / 使用内置默认兜底），由用户确认后继续
- **项目初始化（仅新项目 §1.1）**：技术栈含 Java → java-project-creator；技术栈含前端 → wap-project-creator；旧项目（§1.2）已有代码结构，不触发
- **深度代码扫描**：§1.2 旧项目初始化，前后端规范提取完成后调用 /reverse-scan。成功 → 从扫描产出中提取业务架构/流程，跳过浅层推断；失败 → 兜底执行现有的浅层"业务架构与流程提取"
- **编码阶段**：
  - 有 context 文件（旧项目）→ 以 context 文件为编码规范，**跳过** /frontend-coding 和 /java-coding
  - 无 context 文件（新项目）→ 调用编码 Skill（前端 /frontend-coding，后端 /java-coding）
- **代码审计**：前后端统一调用 /code-audit（§3 Step 5）

**融合规则**：

- **有 context 文件时**（旧项目）：
  1. project-profile.md（铁律）
  2. context 文件（frontend-context.md / backend-context.md）
  3. 内置规约（C-01~C-10 / U-01~U-06 / S-01~S-07）
  4. 冲突项 → 铁律 > context > 内置

- **无 context 文件时**（新项目）：
  1. project-profile.md（铁律）
  2. Skill 编码规范（/frontend-coding / /java-coding）
  3. 内置规约（C-01~C-10 / U-01~U-06 / S-01~S-07）
  4. 冲突项 → 铁律 > Skill > 内置
