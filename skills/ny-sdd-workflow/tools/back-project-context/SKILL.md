---
name: back-project-context
description: |
  用于扫描 Java/Spring Boot 后端项目，提取编码规范、分层架构、基础配置（公共工具、中间件封装、数据模型等），
  并生成 BACKEND_PROJECT_CONTEXT.md 文件，让大模型在后续生成代码时能主动参照项目已有实现，
  避免重复造轮子或与规范不符。

  当用户提到以下场景时必须使用此 skill：
  - "扫描后端规范"、"提取后端编码规范"、"生成后端规范文档"
  - "让模型了解后端项目结构"、"后端基础配置"、"让 AI 知道后端有哪些公共方法"
  - "生成 BACKEND_CONTEXT"、"生成 backend-context"
  - "模型生成的后端代码和项目规范不符"、"大模型不知道项目里已有的封装"
  - 用户希望模型更好地理解后端项目上下文
---

# Back Project Context Skill

帮助用户对 Java/Spring Boot 后端项目进行规范提取，生成核心文件：
- `BACKEND_PROJECT_CONTEXT.md`：后端项目知识地图，供模型每次生成代码前查阅

## 使用前提

- 需要文件系统访问权限
- 支持 Java/Spring Boot 项目（Spring Cloud、Spring MVC、DDD 分层等）
- 支持 Maven（pom.xml）和 Gradle（build.gradle / build.gradle.kts）构建体系

---

## 核心执行原则

**能从文件读到的信息，绝对不问用户。**

只有以下三种情况才允许询问用户：
1. 文件中存在真实歧义需要人工判断（如同时检测到 MyBatis 和 JPA 的依赖）
2. 需要用户指定"基准文件"（统计结果无法判断哪些是团队认可的标准实现）
3. 自动探测全部完成后，做一次最终核对确认（一次性，放在扫描开始前）

---

## 执行流程

### 第一步：自动探测项目基本情况

**不询问用户，直接读取以下文件：**

```
1. pom.xml / build.gradle / build.gradle.kts
   → 提取：Spring Boot 版本、Spring Cloud 组件（Nacos/Feign/Sentinel/Gateway）、
     ORM 框架（MyBatis/MyBatis-Plus/JPA/Hibernate）、数据库驱动（MySQL/PostgreSQL/Oracle）、
     中间件依赖（Redis/RabbitMQ/Kafka/ElasticSearch/MinIO）、工具库（Hutool/Guava/MapStruct/Lombok）

2. application.yml / application.properties / application-*.yml（所有 profile）
   → 提取：数据源配置（类型+数量，不输出密码）、Redis 配置（模式+key前缀）、
     MQ 配置（类型+交换机/队列命名规则）、日志配置（框架+级别+格式）、
     服务端口、context-path、多环境差异点
   → 检测：多数据源（dynamic-datasource / @DS）、分库分表（ShardingSphere）

3. 所有 README.md（项目根目录 + src/main/java 下各层级目录）
   → 提取：项目说明、分层约定、模块职责说明、特殊规范

4. src/main/java 根包路径（从 @SpringBootApplication 所在类推断）
   → 识别：分层结构（DDD / MVC / 六边形）、包命名规则

5. .editorconfig / checkstyle.xml / spotless 配置 / PMD 规则（如存在）
   → 提取：已有的代码风格约定

6. Dockerfile / docker-compose.yml / Jenkinsfile / .gitlab-ci.yml（如存在）
   → 提取：构建方式、部署方式

7. docs/ 目录（如存在）
   → 读取所有 .md 文件，提取已有规范内容

8. .cursorrules / CLAUDE.md / AGENTS.md（如存在）
   → 提取：已有的 AI 编码约定，避免重复或冲突
```

**从以上文件中自动提取：**
- 技术栈（框架版本 / ORM / 中间件 / 工具库）
- 分层架构模式
- 已有规范文档位置
- 构建与部署方式
- 已有的编码约定

**探测完成后，向用户展示探测结果摘要，并只问一个问题：**

> "以上是我从项目文件中自动识别的基本情况，有需要补充或纠正的吗？若没有，我将开始全量扫描。"

收到用户确认后，进入第二步。

---

### 第二步：分轮扫描（每轮只做一件事）

**关键原则：先统计，再归纳。不允许"看几个文件就下结论"。**

每个模块分三轮执行：

**采样轮**：扫描目标目录下所有文件，列出原始代码片段，不做任何归纳评价。

**归纳轮**：基于采样结果，统计各写法出现频率，按以下标准分类：
- 主流写法（> 60%）→ 定为规范
- 少数写法（< 20%）→ 标注为「遗留代码，待重构」
- 混用写法 → 标注为「需团队决策」

**验证轮**：从未参与采样的文件中随机抽查 5 个，验证归纳结果准确性，输出偏差报告。若该模块剩余未采样文件不足 5 个，则对剩余文件全量验证；若采样已覆盖全部文件，则跳过验证轮。

> 详细的各模块扫描指令见 `references/scan-modules.md`

---

### 第三步：生成 BACKEND_PROJECT_CONTEXT.md

在项目根目录生成此文件，结构如下：

```markdown
# BACKEND_PROJECT_CONTEXT.md
> 此文件由 AI 自动生成，供 AI 在生成代码时查阅，请勿手动大幅修改。
> 最后更新：{日期}

## 1. 技术栈总览
- Spring Boot 版本：
- Spring Cloud 组件：
- ORM 框架：
- 数据库：
- 缓存：
- 消息队列：
- 搜索引擎：
- 文件存储：
- 工具库：

## 2. 构建与运行
- 安装依赖：{命令}
- 启动开发：{命令}
- 构建生产：{命令}
- 运行测试：{命令}
- 运行单个测试：{命令}

## 3. 项目架构
- 架构模式：{DDD 分层 / MVC / 六边形 / ...}
- 入口文件：{Application.java 路径}
- 根包路径：{如 com.example.project}
- 分层结构：
  ```
  {实际目录树，标注每层职责}
  ```
- 路由/接口注册：{注解扫描 / 集中注册}
- 数据库访问：{MyBatis-Plus / JPA / 原生 SQL}

## 4. 项目规范
### 命名规范
{类名/方法名/常量名/包名的实际规范，附正例反例}

### 代码风格
{缩进/import 排序/注释风格等}

### 分层约束
{各层职责边界、禁止的跨层调用}

## 5. 控制层规范
- 统一响应格式：{如 Result<T>（code/msg/data）}
- 参数校验方式：{@Valid + 统一异常捕获 / 手动校验}
- 接口路径规范：{RESTful 风格 / 动词名词规则}
- 版本管理：{/v1/ /v2/ 或无版本 / @ApiVersion}
- 标准 Controller 模板：
  ```java
  {从项目中提取的典型 Controller 代码片段}
  ```

## 6. 应用服务层规范
- 服务接口定义：{是否使用接口 + 实现分离}
- 读写分离：{QueryService vs CommandService / 无分离}
- 事务管理：{@Transactional 使用规范、传播级别、回滚规则}
- 编排逻辑：{ApplicationService 编排领域服务 / Service 直接实现}
- 标准 Service 模板：
  ```java
  {典型 Service 代码片段}
  ```

## 7. 领域层规范（DDD 项目适用，非 DDD 跳过）
- Entity 设计：{充血模型 / 贫血模型}
- 业务方法位置：{Entity 内 / Service 内}
- 领域事件：{是否使用 Spring Event / DomainEvent}
- Repository 接口：{定义位置、实现位置}
- 枚举定义：{枚举位置、命名规则}

## 8. 数据模型规范
### 实体映射
- ORM 注解风格：{@TableName / @Entity / XML 映射}
- 主键策略：{自增 / UUID / 雪花}
- 字段约束惯例：{金额 DECIMAL(10,2) / ID BIGINT / 时间 DATETIME}
- 逻辑删除：{@TableLogic / 自定义实现 / 无}
- 自动填充：{MetaObjectHandler / @CreatedDate / 无}

### 核心实体清单
| 实体 | 表名 | 核心字段 | 关联关系 |
|------|------|---------|---------|

### 多数据源（如有）
- 数据源切换方式：{@DS / 配置前缀}
- 主从分离：{读写分离规则}
- 分库分表：{ShardingSphere 分片键 + 路由规则}

## 9. 全局中间件与 AOP
### 拦截器/过滤器
| 名称 | 类型 | 用途 | 执行顺序 |
|------|------|------|---------|

### AOP 切面
| 切面名 | 注解 | 用途 | 切入点 |
|--------|------|------|--------|

### 统一异常处理
- 异常体系：{GlobalExceptionHandler 实现}
- 业务异常类：{如 BusinessException / ResponseException}
- 异常到错误码映射规则

## 10. 基础设施封装
### 缓存（Redis）
- 封装位置：{文件路径}
- Key 命名规范：{如 {业务}:{模块}:{id}}
- 默认过期策略：{TTL 规则}
- 可用方法：{签名列表}

### 消息队列
- 类型：{RabbitMQ / Kafka / RocketMQ}
- 生产者封装：{文件路径 + 调用方式}
- 消费者注册：{@RabbitListener / @KafkaListener 规范}
- 消息序列化：{JSON / Protobuf}
- 重试策略：{重试次数 + 死信队列}

### 文件存储
- 封装位置：{文件路径}
- 存储类型：{MinIO / OSS / 本地}
- 可用方法：{upload / download / getUrl 签名}

### 定时任务
- 框架：{XXL-Job / @Scheduled / Quartz}
- 注册方式：{注解 / 配置中心}

### 搜索引擎（如有）
- 类型：{ElasticSearch / Solr}
- 封装位置：{文件路径}

## 11. 异常与错误码
### 错误码枚举
| 错误码 | 名称 | 含义 | HTTP 状态码 |
|--------|------|------|------------|

### 编号规则
{如：模块编号 * 1000 + 序号，A 模块 = 1000~1999，B 模块 = 2000~2999}

### 使用规范
- 正确使用：{throw new BusinessException(ResponseCode.USER_NOT_FOUND)}
- 禁止：{throw new RuntimeException("用户不存在")}

## 12. 安全与认证
- 认证方式：{JWT / Session / OAuth2 / Sa-Token}
- Token 工具：{文件路径 + 可用方法}
- 加解密工具：{文件路径 + 可用方法}
- 权限注解：{@RequiresPermission / @PreAuthorize / 自定义}
- 接口鉴权规则：{白名单路径 + 默认鉴权}

## 13. 公共工具速查表
| 工具类 | 方法签名 | 路径 | 用途 |
|--------|---------|------|------|

## 14. 常量速查表
| 常量名/枚举名 | 值/枚举项 | 路径 | 用途 |
|---------------|----------|------|------|

## 15. 项目内通用模式
- 接口返回格式：{Result<T> 结构}
- 分页封装：{PageHelper / IPage / 自定义}
- DTO/VO 转换：{MapStruct / BeanUtils / 手动}
- 参数校验方式：{@Valid + groups / 手动}
- 日志打印方式：{@Slf4j + 统一格式 / 链路追踪 traceId}
- 事件机制：{ApplicationEventPublisher / Spring Event}
- 幂等控制：{Token 机制 / 唯一键 / Redis 锁}

## 16. API 接口全景

按 Controller / 业务模块分组，列出项目中所有已有接口：

### {模块名}（{Controller 类名}）
| 路径 | 方法 | 功能说明 | 请求参数 | 响应结构 | 关联错误码 |
|------|------|---------|---------|---------|-----------|

> 接口说明优先从 @ApiOperation / @Operation 注解提取；无注解时从方法名和参数推断。
> 此清单供编码时快速查询"已有哪些接口"，避免重复定义或命名冲突。

## 17. 模块依赖关系

### 业务模块划分
| 模块 | 包路径 | 职责 | 核心实体 | 对外接口数 |
|------|--------|------|---------|-----------|

### 模块间依赖
```
{模块A} → {模块B}（{依赖原因：调用其 Service / 共享实体 / Feign 调用}）
{模块A} → {模块C}（{依赖原因}）
```

### 依赖规则
- 允许的依赖方向：{如 应用层→领域层→基础设施层，禁止反向}
- 跨模块调用方式：{直接注入 Service / 通过 Feign / 通过事件}
- 发现的违规依赖：{如 模块A 直接依赖了模块B 的 Mapper，应通过 Service}

## 18. 禁止事项
基于已有封装，明确列出禁止行为，例如：
- ❌ 禁止直接使用 JDBC，统一用 {ORM 框架}
- ❌ 禁止硬编码错误信息，统一用 ResponseCode 枚举
- ❌ 禁止在 Controller 中写业务逻辑，统一下沉到 Service
- ❌ 禁止直接 new ObjectMapper()，统一用 {JSON 工具}
- ❌ 禁止在 Service 中直接操作 HttpServletRequest/Response
- ❌ 禁止 catch(Exception e) 后吞掉异常不处理
```

---

### 第四步：输出规范总结

生成完成后，向用户输出：

1. 文件的路径确认
2. 发现的主要规范条目摘要（前 10 条）
3. 发现的问题清单（遗留代码、混用写法、技术债），附文件路径
4. 建议优先统一的 Top 3 问题

---

### 增量更新机制

当用户再次运行此技能时（如项目代码有更新），按以下策略执行：

1. **检测已有文件**：检查项目根目录是否已存在 `BACKEND_PROJECT_CONTEXT.md`
2. **差异扫描**：如已存在，则对比当前扫描结果与已有内容，仅更新有变化的章节（新增、删除、修改的工具/方法/实体等）
3. **变更日志**：在文件头部的「最后更新」字段旁追加变更摘要，例如：
   ```
   > 最后更新：2025-06-15（本次更新：新增 2 个工具方法，移除 1 个废弃枚举，更新 Redis 封装签名）
   ```
4. **向用户展示 diff 摘要**：列出本次更新了哪些章节、新增/删除/修改了哪些条目，让用户确认

---

## 重要执行原则

| 原则 | 说明 |
|------|------|
| **自动探测优先** | 能从文件读到的信息绝对不问用户，pom.xml / application.yml / README.md 是第一信源 |
| **README 必读** | 项目根目录及各分层目录的 README.md 必须在扫描前全部读取，其中的约定优先级高于代码统计结果 |
| 用户指定基准 | 用户指定的"标准文件"优先级高于统计结果 |
| 分离提取与归纳 | 不允许边读边总结，必须先采样再统计 |
| 区分规范与遗留 | 发现问题代码时明确标注，不将其纳入规范 |
| 不输出敏感信息 | 配置文件中的密码、密钥、Token 只记录键名和用途，不输出真实值 |
| 歧义才询问 | 只有自动探测产生真实歧义时才打断用户，不因"不确定"就开口问 |
| **分层意识** | 每层（Controller/Service/Domain/Infrastructure）独立扫描、独立归纳，不混在一起 |

---

## 参考文件

- `references/scan-modules.md`：各模块详细扫描指令
