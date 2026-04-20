---
name: wap-project-creator
description: >
  创建前端移动端 H5 项目脚手架（Vue3 + Vite + TypeScript），自动完成关键配置，并输出配套的项目规范文档。

  **必须在以下场景触发：**
  - 用户说"创建新前端项目"、"初始化前端项目"、"搭建移动端项目"
  - 用户说"创建 H5 项目"、"新建 Vue3 项目"、"生成前端脚手架"
  - 用户说"创建前端项目"、"用模板初始化一个新项目"
  - 用户需要创建 Vue3 + Vite 前端项目

  产出：① 完整项目脚手架（含 vite.config.ts、package.json 关键配置）② 项目规范文档 CONVENTIONS.md
---

# 前端项目创建规范 Skill

本 Skill 的目标是：帮助用户快速创建符合规范的前端移动端 H5 项目（Vue3 + Vite + TypeScript）。产出两份内容：**完整项目脚手架** 和 **规范文档 CONVENTIONS.md**。

---

## 第一步：收集项目信息

使用 `AskUserQuestion` 工具，一次性问清以下信息，**不要分多次提问**：

1. `appName`：项目名称（小写中划线格式，如 `health-card`、`user-center`）
2. `description`：项目描述（如 "健康卡 H5"，用于写入规范文档）

收集完成后告知用户："正在初始化项目，请稍候..."，然后进入第二步。

---

## 第二步：克隆模板并清理 Git 历史

执行以下命令，在**当前工作目录**下创建新项目：

```bash
pnpm create vite <appName> --template vue-ts
cd <appName>
pnpm install
```

> 若 pnpm 未安装，可使用 `npm create vite@latest <appName> -- --template vue-ts` 替代。

---

## 第三步：修改关键配置文件

### 3.1 修改 `package.json`

文件路径：`<appName>/package.json`

将模板占位符替换为实际项目信息：

```diff
- "name": "{{ name }}"
+ "name": "<appName>"
- "author": "{{ author }}"
+ "author": ""
```

### 3.2 修改 `vite.config.mts`

文件路径：`<appName>/vite.config.mts`

模板中 `base` 只有一个固定值，需改为按构建环境自动切换。`isBuild` 变量已在文件顶部定义（`const isBuild = command === 'build'`），直接复用：

```diff
-    base: `/h5/${name}`,
+    base: isBuild ? `//wximg.91160.com/h5/${name}/dist/` : `/h5/${name}`,
```

> `name` 变量来自文件顶部的 `import { name } from './package.json'`，修改 package.json 的 name 字段后，base 路径自动生效，无需在此处硬编码 appName。

### 3.3 修改 `Jenkinsfile`

文件路径：`<appName>/Jenkinsfile`

将部署路径占位符替换为实际项目名：

```diff
- def deploy_path = '/app/wwwroot/api/h5/xxx'
+ def deploy_path = '/app/wwwroot/api/h5/<appName>'
```

---

## 第四步：生成 CONVENTIONS.md

在 `<appName>/CONVENTIONS.md` 生成规范文档。使用从用户收集的 `appName` 和 `description` 填入对应位置。

````markdown
# <appName> 项目规范文档

> <description>

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 5 |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| UI 组件库 | Vant 4（移动端） |
| 样式 | Less + UnoCSS |
| HTTP | 封装于 @ny/luban |
| 包管理器 | pnpm（≥ 8.6.12） |
| Node 版本 | 18.17.1 |

## 目录结构

```
<appName>/
├── build/                  ← Vite 构建相关配置
│   ├── config/             ← 主题变量等
│   ├── proxy/              ← 开发代理配置
│   └── utils.ts
├── src/
│   ├── api/                ← 接口请求（按业务模块拆分）
│   ├── assets/             ← 静态资源（图片、字体等）
│   ├── components/         ← 公共组件
│   ├── hooks/              ← 自定义 Hooks
│   ├── router/             ← 路由配置
│   ├── store/              ← Pinia 状态管理
│   ├── styles/             ← 全局样式
│   ├── utils/              ← 工具函数
│   ├── views/              ← 页面组件
│   ├── App.vue
│   └── main.ts
├── vite.config.mts         ← Vite 配置（已按环境配置 base）
├── Jenkinsfile             ← CI/CD 配置
├── package.json
└── CONVENTIONS.md          ← 本文件
```

## base 路径规范

| 环境 | base 值 |
|------|---------|
| 本地开发 | `/h5/<appName>` |
| 测试 / 生产 | `//wximg.91160.com/h5/<appName>/dist/` |

> base 已在 `vite.config.mts` 中通过 `isBuild` 自动切换，无需手动修改。

## 代码规范

### ESLint
- 基于 `airbnb-base` + `@typescript-eslint` + `eslint-plugin-vue`
- 执行：`pnpm eslint --fix`

### Prettier
- 统一格式化，执行：`pnpm p`（等同于 `prettier -w src`）

### Stylelint
- 检查 `.vue` / `.less` 文件中的样式顺序和规范

### 提交规范（commitlint）
遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `chore` | 构建/工具变动 |
| `style` | 样式调整 |
| `refactor` | 重构 |
| `docs` | 文档更新 |
| `perf` | 性能优化 |

### Git Hooks（Husky + lint-staged）
- `pre-commit`：自动执行 lint-staged，对暂存文件进行 ESLint + Prettier + Stylelint 检查
- 提交前确保代码通过检查，否则提交会被拦截

## 常用命令

```bash
pnpm dev          # 本地开发
pnpm test         # 构建测试包（含 zip）
pnpm build        # 构建生产包（含 zip）
pnpm p            # Prettier 格式化 src 目录
```

## 构建产物

```
dist/
└── dist/         # 打包输出目录（outDir: dist/dist）
    ├── static/   # JS / CSS / 图片等静态资源
    └── index.html
```

## Jenkins 部署

1. 在 Jenkins 中复制 `shoping` 项目的配置模板
2. 修改以下两处：
   - **Git 仓库地址** → 替换为本项目的 GitLab 地址
   - **deploy_path** → `/app/wwwroot/api/h5/<appName>`（已在 Jenkinsfile 中配置好）
3. 配置 GitLab Webhook 触发自动构建

## 初始化 Git 仓库

项目已移除模板的 Git 历史，需手动关联新仓库：

```bash
git init
git add .
git commit -m "chore: init project from template-vue3"
git remote add origin <your-gitlab-url>
git push -u origin main
```
````

---

## 第五步：输出完成提示

所有文件处理完毕后，向用户输出以下提示（将 `<appName>` 替换为实际项目名）：

```
✅ 项目 <appName> 初始化完成！

📁 项目目录：./<appName>

下一步：
1. cd <appName>
2. pnpm install
3. 在 GitLab 创建新仓库后执行：
     git init
     git add .
     git commit -m "chore: init project from template-vue3"
     git remote add origin <your-gitlab-url>
     git push -u origin main
4. 在 Jenkins 中复制 shoping 项目配置，修改：
     - Git 仓库地址
     - deploy_path（已在 Jenkinsfile 中设为 /app/wwwroot/api/h5/<appName>）

📄 规范文档：./<appName>/CONVENTIONS.md
```

---

## 注意事项

- 修改文件时使用精确字符串替换，不要改动文件中其他内容
- 先完成所有文件修改，最后再生成 CONVENTIONS.md，确保文档内容与实际配置一致
- 若克隆的模板中 package.json 的 `name` 字段格式与预期不同（如已是真实项目名），仍以用户输入的 `appName` 为准进行替换
