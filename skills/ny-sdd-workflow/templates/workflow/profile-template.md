# project-profile.md 完整模板

项目铁律由团队人工填写，AI 不自动生成。其余区块由 AI 在初始化时自动填写。

**内部公共能力记录格式要求**：每项公共能力写入时必须包含三要素——路径、用法、禁止：

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

---

## 模板正文

```markdown
# 一、项目级（始终加载）

## 项目铁律（Constitution）
> 以下约定 AI 绝对不能违反，无论任何情况。违反时必须立即停止并报告。

### 技术约束
- [ ] {例：必须使用 Vue3，禁止使用 Vue2}
- [ ] {例：所有接口调用必须封装在 service 层，禁止在组件里直接调用}

### 代码规范
- [ ] {例：代码注释必须使用中文}
- [ ] {例：所有异步操作必须有错误处理}

### 业务约束
- [ ] {例：涉及金额的字段必须使用 Decimal，禁止使用 Float}
- [ ] {例：用户数据操作必须有操作日志}

## 技术栈
- frontend: {vue3 / react / ...}
- backend: {java-springboot / go / ...}
- database: {mysql / postgresql / ...}

## 外部依赖（API 学习记录）
- ...

## 原型图索引（AI 从 .docs/prd/ 图片解析，如有）
> 设计和编码时必须以原型图为视觉基准

| 文件 | 对应页面/功能 | 核心内容摘要 |
| --- | --- | --- |
| {.docs/prd/文件名} | {页面名} | {布局结构 + 关键组件 + 交互要点} |

## 业务架构（AI 从代码反推，人工确认，仅旧项目）

### 业务模块划分
| 模块 | 职责 | 核心实体 | 对外接口数 |
| --- | --- | --- | --- |
| {模块名} | {职责描述} | {实体列表} | {数量} |

### 模块依赖关系
{模块A} → {模块B}（{依赖原因}）

### 角色权限总览
| 角色 | 可执行操作 |
| --- | --- |
| {角色} | {操作列表} |

## 业务流程（AI 从代码反推，人工确认，仅旧项目）

### {流程名}
- 正常路径：{主流程}
- 异常路径：{异常处理}
- 涉及模块：{模块列表}
- 关键状态流转：{状态A→状态B→...}

# 二、前端（前端改动时加载，无前端则留空或删除此区域）

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

## 项目规范（AI 提取，人工确认）
- 命名约定：...
- 目录结构：...
- 代码风格：...

## 内部公共能力（AI 提取，人工确认）
> 编码时必须复用已有能力，禁止重复封装

### 公共工具与封装
- HTTP 请求：{文件路径}（{封装说明}）
- 日期处理：{文件路径}
- ...

### 公共组件
- {组件路径}：{用途}
- i18n：{多语言方案}
- ...

### Composables / Hooks
- {如 useAuth — 登录态/权限判断}
- {如 useTable — 表格分页/搜索/排序}
- ...

### 路由守卫
- {如 beforeEach 登录校验}
- {如 权限路由过滤}
- ...

### 自定义指令
- {如 v-permission — 按钮级权限}
- {如 v-loading — 全局 loading}
- ...

### 全局状态管理
- {如 userStore — 用户信息、登录态、权限列表}
- {如 appStore — 全局配置、主题、语言}
- ...

### 常量与枚举
- 错误码：{文件路径}
- 状态枚举：{文件路径}
- ...

### 样式体系
- CSS 变量/设计令牌：{文件路径}
- 主题方案：{如 暗色/亮色切换}
- 公共样式：{如 @/styles/common.scss}
- ...

## 模块架构索引（AI 提取，人工确认）
> 编码时按任务涉及的页面，加载对应文件获取架构模式。详情存储在 .project/specs/rules/patterns/ 下。

| 页面 | 索引文件 | 一句话摘要 |
| ---- | -------- | ---------- |
| {页面名} | patterns/{name}.md | {核心模式，如：chatList 驱动 + Bubble 组件体系} |

# 三、后端（后端改动时加载，无后端则留空或删除此区域）

## 构建与运行
- 安装依赖：{命令}
- 启动开发：{命令}
- 构建生产：{命令}
- 运行测试：{命令}
- 运行单个测试：{命令}

## 项目架构
- 架构模式：{DDD 分层 / MVC / ...}
- 入口文件：{Application.java}
- 路由/接口注册：{注解扫描 / 集中注册}
- 数据库访问：{ORM / MyBatis / 原生 SQL}

## 项目规范（AI 提取，人工确认）
- 命名约定：...
- 目录结构：...
- 代码风格：...

## 内部公共能力（AI 提取，人工确认）
> 编码时必须复用已有能力，禁止重复封装

### 公共工具与封装
- DTO/VO 转换：{统一方式，如 MapStruct / BeanUtils}
- 分页封装：{如 PageHelper + PageResult}
- 安全/认证工具：{如 JwtUtil.createToken/parseToken、EncryptUtil.md5/aes}
- ...

### 基础设施封装
- 缓存：{如 RedisUtil，key 命名规范，默认过期策略}
- 消息队列：{如 MessageSender，序列化 + 重试方式}
- 文件存储：{如 FileService.upload/download}
- 搜索：{如 SearchService}
- 定时任务：{注册方式，如 XXL-Job / @Scheduled}
- ...

### 全局中间件/拦截器
- {如 GlobalExceptionHandler — 统一异常处理}
- {如 @RequiresPermission — 接口权限注解}
- {如 AuthInterceptor — 登录校验}
- ...

### AOP 切面
- {如 @OperationLog — 操作日志自动记录}
- {如 性能监控切面 — 接口耗时统计}
- {如 数据权限切面 — 自动拼接数据过滤条件}
- ...

### 常量与枚举
- 错误码：{文件路径}，编号规则：{如 模块编号*1000+序号}
- 状态枚举：{文件路径}（{枚举列表}）
- 全局常量：{文件路径}
- ...

### 数据库通用封装
- BaseMapper / BaseService：{如 MyBatis-Plus IService，提供通用 CRUD}
- 自动填充：{如 MetaObjectHandler 自动填充 createTime/updateTime/createBy}
- 逻辑删除：{如 @TableLogic，deleted 字段}
- 多租户：{如 TenantLineInnerInterceptor，自动拼接 tenant_id}
- ...

### 数据模型概览
- 核心实体：{实体列表}
- 关键关系：{如 Order → User (user_id FK)}
- 字段约束惯例：{如 金额用 DECIMAL(10,2)、ID 用 BIGINT}
- ...

### 项目内通用模式
- 接口返回格式：{如 Result<T>（code/msg/data）}
- 参数校验方式：{如 @Valid + 统一异常捕获}
- 日志打印方式：{如 @Slf4j + 统一格式}
- 事件机制：{如 ApplicationEventPublisher / Spring Event，用于业务解耦}
- ...

## 模块架构索引（AI 提取，人工确认）
> 编码时按任务涉及的模块，加载对应文件获取架构模式。详情存储在 .project/specs/rules/patterns/ 下。

| 模块 | 索引文件 | 一句话摘要 |
| ---- | -------- | ---------- |
| {模块名} | patterns/{name}.md | {核心模式，如：Agent 注册 + handler 管线 + agentResponseList} |
```
