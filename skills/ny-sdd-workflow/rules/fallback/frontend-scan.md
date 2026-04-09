# 前端内置扫描（兜底）

> 仅在 front-project-context skill 不可用且用户选择"使用内置兜底"时执行。
> 产出写入 `.project/specs/rules/frontend-context.md`。

---

## 扫描目录与内容

| 扫描目录                     | 提取什么                                    |
| --------------------------- | ------------------------------------------- |
| components/                 | 公共组件 + i18n 方案                        |
| composables/、hooks/        | Composables/Hooks（共享逻辑封装）           |
| router/（守卫部分）         | 路由守卫（登录校验/权限过滤）               |
| directives/                 | 自定义指令（v-permission 等）               |
| styles/、assets/css/        | 样式体系（CSS 变量/主题/公共样式）          |
| store/、stores/             | 全局状态管理                                |
| utils/、common/、lib/       | 公共工具与封装（HTTP/日期/格式化）          |
| constants/、enums/          | 常量与枚举（错误码/状态枚举）               |

## 记录格式要求

每项公共能力写入 frontend-context.md 时必须包含三要素——路径、用法、禁止：

```
- {能力名}：`{文件路径}`
  用法：`{import 语句}; {调用示例}`
  禁止：{不允许的替代做法}
```

示例：
```
- HTTP 请求：`src/utils/request.ts`
  用法：`import { instance } from '@/utils/request'; instance.post<T>(url, params)`
  禁止：直接 import axios 或 fetch
```

## frontend-context.md 输出结构

```markdown
# 前端项目上下文

## 构建与运行
- 安装依赖：{命令}
- 启动开发：{命令}
- 构建生产：{命令}
- Lint 检查：{命令}

## 项目架构
- 架构模式：{组件化 / 微前端 / ...}
- 入口文件：{main.ts}
- 路由注册：{文件路由 / 集中式}
- 状态管理：{Pinia / Vuex}

## 项目规范
- 命名约定：...
- 目录结构：...
- 代码风格：...

## 内部公共能力
> 编码时必须复用已有能力，禁止重复封装

### 公共工具与封装
{按三要素格式列出}

### 公共组件
{组件路径 + 用途}

### Composables / Hooks
{名称 + 用途}

### 路由守卫
{守卫逻辑}

### 自定义指令
{指令名 + 用途}

### 全局状态管理
{store 名 + 管理的状态}

### 常量与枚举
{路径 + 内容}

### 样式体系
- CSS 变量/设计令牌：{文件路径}
- 主题方案：{暗色/亮色}
- 公共样式：{路径}

## 禁止事项
- ❌ {禁止行为}（统一用 {替代方案}）
```
