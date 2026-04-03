# 各模块详细扫描指令

每个模块均按「采样 → 归纳 → 验证」三轮执行。
若该模块剩余未采样文件不足 5 个，则对剩余文件全量验证；若采样已覆盖全部文件，则跳过验证轮。

以下为每个模块的具体扫描内容。

---

## 前置：自动探测阶段（所有模块扫描前必须完成）

### 第一优先级文件（必读，顺序执行）

```
1. package.json
   → 提取：dependencies / devDependencies
   → 识别：框架（vue/react/next/nuxt）、UI库、状态管理、请求库、样式工具、构建工具

2. 根目录 README.md
   → 提取：项目说明、目录结构说明、特殊约定、快速上手指南

3. src/ 下各子目录的 README.md（如存在）
   → 提取：该模块的职责说明、使用约定、注意事项

4. vite.config.ts / next.config.js / next.config.ts / vue.config.js / nuxt.config.ts（存在哪个读哪个）
   → 提取：路径别名（resolve.alias）、环境变量前缀、代理配置

5. tsconfig.json
   → 提取：paths 路径映射、严格模式配置

6. .eslintrc* / eslint.config.*
   → 提取：已有的编码风格约定、禁用规则

7. tailwind.config.* / uno.config.* / postcss.config.*
   → 提取：主题色 token、断点配置、插件

8. docs/ 目录（如存在）
   → 读取所有 .md 文件，提取已有规范内容

9. .cursorrules / CLAUDE.md（如存在）
   → 提取：已有的 AI 编码约定，避免重复或冲突
```

### 探测结果输出格式

> **注意**：以下为模板格式，所有字段必须根据真实探测结果填写，禁止照抄示例值。未探测到的字段标注「未检测到」。

```markdown
## 自动探测结果

**框架**：{从 package.json 识别到的框架及版本，如 Vue 3.x / React 18.x / Next.js 14.x / Nuxt 3.x}
**UI 库**：{从 dependencies 识别到的 UI 库，如 Element Plus / Ant Design / shadcn/ui / 未检测到}
**状态管理**：{如 Pinia / Redux / Zustand / Vuex / 未检测到}
**请求库**：{如 axios / ky / ofetch / 原生 fetch，标注是否已有封装}
**样式方案**：{如 SCSS / Tailwind CSS / CSS Modules / styled-components / 未检测到}
**构建工具**：{如 Vite / Webpack / Turbopack / 未检测到}
**路径别名**：{从 vite.config / tsconfig 等提取，如 `@` → `src/`}
**TS 严格模式**：{开启 / 未开启 / 未使用 TypeScript}

**已发现规范文档**：
- {列出实际发现的规范文档路径，无则标注「无」}

**已有 AI 约定**：{列出 .cursorrules / CLAUDE.md 路径，无则标注「无」}

**发现歧义**：{列出真实发现的歧义，无则标注「无」}
```

输出后等待用户确认，收到确认后进入模块扫描。

---

## 模块 1：项目结构规范

**采样**：输出完整目录树（`tree src/ -L 3`），不做评价。

**归纳**：
- 目录划分逻辑（按功能 / 按类型 / 按业务域）
- src/ 下各子目录的职责边界
- 是否存在职责混乱的目录

**输出规范**：
- 推荐标准目录结构（附每个目录职责说明）
- 问题目录清单（附路径 + 建议）

---

## 模块 2：命名规范

**采样**：收集以下原始数据（只列举，不归纳）：
- 所有组件文件名
- 所有 utils / hooks / composables / helpers 文件名
- 随机抽取 10 个组件内的变量名、函数名

**归纳**：
- 文件/目录命名：kebab-case / PascalCase / camelCase 实际分布
- 函数命名：动词前缀使用情况（handle / get / set / fetch / on / use）
- 常量命名：UPPER_SNAKE_CASE 遵守情况

**输出规范**：
- 各类命名规则（附正例 ✅ 与反例 ❌）

---

## 模块 3：组件封装规范

根据探测到的框架类型，选择对应的扫描维度：

### Vue 项目（Vue 2 / Vue 3 / Nuxt）

**采样**：随机抽取 components/ 下 10 个组件，逐一列出：
- Props 定义方式（原始代码）
- Emits 定义方式（原始代码）
- setup 内代码组织顺序（原始代码片段）

**归纳**：
- Props 主流定义方式（defineProps + 类型 / 运行时声明 / Options API props）
- Emits 命名风格（on 前缀 / 无前缀）
- Composition API vs Options API 使用比例
- setup 内组织顺序是否统一
- 组件平均行数，是否存在超 300 行的大组件

**输出规范**：
- 标准 SFC 结构模板（含 script setup 内推荐顺序）
- Props / Emits 规范示例
- 需要拆分的大组件清单（附路径）

### React 项目（React / Next.js）

**采样**：随机抽取 components/ 下 10 个组件，逐一列出：
- Props 定义方式（interface / type / inline / PropTypes）
- Hooks 使用方式（原始代码片段）
- 组件内代码组织顺序（state → effects → handlers → render）

**归纳**：
- Props 主流定义方式（TypeScript interface / type / PropTypes / 无类型）
- 函数组件 vs 类组件比例
- 自定义 Hooks 抽取程度
- 组件内代码组织顺序是否统一
- 组件平均行数，是否存在超 300 行的大组件
- memo / useMemo / useCallback 使用频率

**输出规范**：
- 标准组件结构模板（含推荐代码组织顺序）
- Props 定义规范示例
- Hooks 使用规范（何时抽取自定义 Hook）
- 需要拆分的大组件清单（附路径）

---

## 模块 4：API 服务层规范

**采样**：扫描 services/ / api/ / request/ / utils/http / lib/ 目录，列出：
- 所有接口函数的原始签名
- request 封装的原始实现（拦截器部分）
- 随机抽取 5 处实际调用代码

**归纳**：
- HTTP 客户端封装层级（几层封装）
- 接口函数命名规则（动词 + 资源名）
- 错误处理方式（全局拦截 / 局部 try-catch / 混用）
- 请求/响应类型定义完整度

**输出规范**：
- 请求封装使用说明（可用方法 + 签名 + 示例）
- 接口文件组织规范（按业务域分文件）
- 禁止事项（如：禁止直接 import axios）

---

## 模块 5：CSS / 样式规范

根据探测到的框架类型，选择对应的扫描维度：

### Vue 项目

**采样**：随机抽取 10 个组件的 `<style>` 块 + 全局样式文件，列出原始内容。

**归纳**：
- 样式隔离方式分布（scoped / CSS Modules / BEM / 无隔离）
- CSS 变量 / 设计 token 使用率
- 内联样式（style=""）出现频率
- 响应式断点是否统一

### React 项目

**采样**：随机抽取 10 个组件的样式文件（.css / .module.css / .scss / styled-components / 内联样式），列出原始内容。

**归纳**：
- 样式方案分布（CSS Modules / styled-components / emotion / Tailwind / 内联 style 对象 / 普通 CSS 文件）
- CSS 变量 / 设计 token 使用率
- className 拼接方式（clsx / classnames / 模板字符串 / 手动拼接）
- 响应式断点是否统一

### 通用输出规范

- 样式隔离规则
- CSS 变量命名规范
- 禁止事项（如：禁止内联样式 / 禁止魔法数字颜色值）

---

## 模块 6：状态管理规范

根据探测到的框架和状态管理库，选择对应的扫描维度：

### Vue + Pinia / Vuex

**采样**：扫描 stores/ / composables/ 目录，列出：
- 所有 store 文件名 + 管理的状态名
- 随机抽取 3 个 store 的原始实现

**归纳**：
- Store 模块拆分粒度（按业务域 / 按页面 / 混合）
- state / action / getter 命名规则
- 是否存在跨 store 直接读取的耦合

### React + Redux / Zustand / Jotai / Context

**采样**：扫描 store/ / stores/ / slices/ / context/ / providers/ 目录，列出：
- 所有 store / slice / context 文件名 + 管理的状态名
- 随机抽取 3 个 store 或 slice 的原始实现

**归纳**：
- 状态拆分粒度（按业务域 / 按页面 / 按功能 / 混合）
- 全局状态 vs 组件局部状态的边界是否清晰
- 异步操作处理方式（thunk / saga / RTK Query / React Query / 直接 async）
- 是否存在不必要的全局状态（应为局部状态的数据被放入全局）

### Nuxt（若使用 useState / useFetch 等内置方案）

**采样**：扫描 composables/ 目录，列出：
- 所有 composable 文件名 + 管理的状态名
- 随机抽取 3 个 composable 的原始实现

**归纳**：
- composable 拆分粒度
- useState / useFetch / useAsyncData 使用规范
- 服务端状态 vs 客户端状态的区分

### 通用输出规范

- Store / 状态管理命名规范
- 全局状态 vs 局部状态的划分原则
- 标准 Store 模板

---

## 模块 7：TypeScript 类型规范

**采样**：扫描 types/ / interfaces/ / @types/ 目录 + 随机抽取 10 个文件的类型声明部分，列出原始代码。

**归纳**：
- interface vs type 实际使用比例
- any 出现频率（统计出现文件列表）
- API 响应类型定义位置和规范度
- Props 类型定义方式（Vue: defineProps 泛型 / withDefaults；React: interface / type / PropTypes）

**输出规范**：
- interface vs type 使用选择规则
- 禁止 any 的替代方案列表
- 类型文件组织规范

---

## 模块 8：公共方法 & 常量速查

**采样**：完整扫描以下目录，列出所有导出项：
- utils/ / helpers/ / lib/ — 所有导出函数
- constants/ / config/ — 所有导出常量
- hooks/ / composables/ — 所有导出 hooks / composables

**归纳（不做频率统计，做完整清单）**：

**常量清单格式**：
```
| 常量名 | 值 | 路径 | 用途 |
```

**公共方法清单格式**：
```
| 函数名 | 签名 | 路径 | 一句话用途 |
```

**输出**：
- 完整的常量速查表
- 完整的公共方法速查表
- 重复实现检测（相似功能出现在多个文件中）

---

## 模块 9：请求封装详细说明

**采样**：完整读取 request 封装文件。

**输出（直接整理为 PROJECT_CONTEXT.md 中的「请求方法」章节）**：

> **注意**：以下为模板格式，所有字段必须根据真实代码内容填写，禁止照抄示例值。

```markdown
### 请求封装

**封装位置**：{实际封装文件路径}

**可用方法**：
{列出项目中实际导出的请求方法及其签名}

**拦截器说明**：
{根据实际拦截器代码描述请求拦截和响应拦截的逻辑}

**真实调用示例**：
（从项目中直接摘取一个典型的接口调用）
```
