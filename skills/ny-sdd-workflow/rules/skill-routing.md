# Skill 路由表与执行流程

所有 Skill 已内置在 `{SKILL_DIR}/tools/` 目录下，AI 在对应阶段直接读取调用，无需远程安装。

| 阶段           | 触发时机                              | Skill 路由             | 内置目录              |
| -------------- | ------------------------------------- | ---------------------- | --------------------- |
| PRD 审计       | §1.1 / §1.2(feature) / §2.6[prd]   | /prd-audit             | `tools/prd-audit/`    |
| 后端项目初始化 | §1.1 脚手架创建（仅新项目）          | /java-project-creator  | `tools/java-project-creator/` |
| 前端项目初始化 | §1.1 脚手架创建（仅新项目）          | /wap-project-creator   | `tools/wap-project-creator/`  |
| 前端规范提取   | §1.3 前后端规范提取                  | /front-project-context | `tools/front-project-context/` |
| 后端规范提取   | §1.3 前后端规范提取                  | /back-project-context  | `tools/back-project-context/` |
| 前端编码       | §3.5 代码变更（前端改动）            | /frontend-coding       | `tools/frontend-code-standards/` |
| 后端编码       | §3.5 代码变更（后端改动）            | — | 内置兜底（C-01~C-10） |
| 代码审计       | §3.6 代码审计                        | — | 内置兜底（S-01~S-07 + S-08） |
| 深度代码扫描   | §1.4 深度业务代码扫描                | /reverse-scan          | `tools/reverse-scan/` |
| 功能测试用例设计 | §2.7 评审通过后（feature/bug/refactor）| /test-case-design      | `tools/test-case-design/` |
| 单元测试       | §3.7 编码后自测                      | /unit-test-generator   | `tools/unit-test-generator/` |
| E2E 测试       | §4 全部模块归档后（用户确认执行）     | [e2e-test-skill]       | [未发布]              |

**Skill 执行流程**（所有触发点必须统一严格遵守，不可跳过）：

```
1. 读取 {SKILL_DIR}/tools/{skill名称}/SKILL.md
   → 文件存在 → 进入第 2 步（调用）
   → 文件不存在 → 内置 Skill 缺失，使用兜底规则
2. 调用：读取 SKILL.md 内容，按其规范执行
3. 输出执行日志（必须，未输出视为未执行）
4. 更新状态（§3 编码阶段的 Skill）：更新 index.md 对应模块的 `coding-skill` 或 `audit-skill`
```

**Skill 执行日志格式**（每次执行 Skill 流程后必须输出，禁止省略）：

```
【Skill 执行日志】
  阶段: {触发阶段，如 §1.1 PRD审计 / §3.5 前端编码}
  Skill: {skill名称}
  路径: {SKILL_DIR}/tools/{skill名称}/
  执行: {调用Skill / 内置兜底({兜底方式})}
```

**匹配规则**：

- 根据 project-profile.md「技术栈」声明 + 当前改动文件类型，匹配对应 Skill
- 内置 Skill 文件缺失 → 使用内置兜底规则
- **项目初始化（仅新项目 §1.1）**：技术栈含 Java → java-project-creator；技术栈含前端 → wap-project-creator；旧项目（§1.2）已有代码结构，不触发
- **深度代码扫描**：§1.2 旧项目初始化，§1.3 前后端规范提取完成后调用 /reverse-scan（§1.4）。成功 → 从扫描产出中提取业务架构/流程，跳过浅层推断；失败 → 兜底执行现有的浅层"业务架构与流程提取"
- **编码阶段**：
  - 有 context 文件（旧项目）→ 以 context 文件为编码规范，**跳过** /frontend-coding
  - 无 context 文件（新项目）→ 前端调用 /frontend-coding；后端无内置编码 Skill，使用 C-01~C-10 内置规约
- **代码审计**：无内置审计 Skill，使用 `{SKILL_DIR}/rules/quality-standards.md` 中 S-01~S-08 标准
- **功能测试用例设计**：§2.7 评审通过后调用 /test-case-design。Skill 只产出功能测试层（manual/ui-dom/ui-visual），产出到 `.test/testcases/`。Skill 文件缺失 → 跳过（功能测试用例非编码阻断项，可后续补充）
- **单元测试**：§3.7 编码后调用 /unit-test-generator（`{SKILL_DIR}/tools/unit-test-generator/`，自主设计模式）。从 REQ/DES + 源代码 → 设计单测用例 + 生成代码 + 执行 + 报告。SDD 模式下自动从 project-profile.md 推断框架。产出到 `.test/unit/`。Skill 文件缺失 → fallback 到 T-01~T-06 自测
- **E2E 测试**：§4 全部模块归档后，询问用户是否执行。未来 /e2e-test-skill 消费 §2.7 产出的功能测试用例（TC-F-*.md），生成 Playwright/Cypress 代码并执行。Skill 未发布时选项 A 自动跳过

**融合规则**：

- **有 context 文件时**（旧项目）：

  1. project-profile.md（铁律）
  2. context 文件（frontend-context.md / backend-context.md）
  3. 内置规约（C-01~C-10 / U-01~U-06 / S-01~S-08）
  4. 冲突项 → 铁律 > context > 内置
- **无 context 文件时**（新项目）：

  1. project-profile.md（铁律）
  2. Skill 编码规范（/frontend-coding）；后端无 Skill，直接用内置规约
  3. 内置规约（C-01~C-10 / U-01~U-06 / S-01~S-08）
  4. 冲突项 → 铁律 > Skill > 内置
