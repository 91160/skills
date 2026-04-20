# 各模块详细扫描指令

每个模块均按「采样 → 归纳 → 验证」三轮执行。
若该模块剩余未采样文件不足 5 个，则对剩余文件全量验证；若采样已覆盖全部文件，则跳过验证轮。

以下为每个模块的具体扫描内容。

---

## 前置：自动探测阶段（所有模块扫描前必须完成）

### 第一优先级文件（必读，顺序执行）

```
1. pom.xml / build.gradle / build.gradle.kts
   → 提取：parent（Spring Boot 版本）、dependencies（分组列出）
   → 识别：Spring Cloud 组件（Nacos/Feign/Sentinel/Gateway/Seata）
   → 识别：ORM 框架（MyBatis/MyBatis-Plus/JPA/Hibernate/jOOQ）
   → 识别：数据库驱动（MySQL/PostgreSQL/Oracle/H2）
   → 识别：中间件（Redis/Redisson/RabbitMQ/Kafka/RocketMQ/ElasticSearch/MinIO）
   → 识别：工具库（Hutool/Guava/MapStruct/Lombok/Apache Commons/Fastjson/Jackson/Gson）
   → 识别：安全框架（Spring Security/Sa-Token/Shiro）
   → 多模块项目：读取父 pom.xml + 各子模块 pom.xml，识别模块依赖关系

2. application.yml / application.properties / application-*.yml（所有 profile）
   → 提取：server.port / server.servlet.context-path
   → 提取：数据源配置（url 中的数据库类型+名称，不输出密码）
   → 提取：Redis 配置（模式：单机/哨兵/集群，key 前缀）
   → 提取：MQ 配置（类型、交换机/队列命名规则、消费者组）
   → 提取：日志配置（框架 logback/log4j2、级别、格式、是否含 traceId）
   → 检测：dynamic-datasource 多数据源 / ShardingSphere 分库分表
   → 检测：Nacos 配置中心 / Apollo 配置中心
   → 多环境差异：对比 dev/test/prod 配置，列出关键差异点

3. 根目录 README.md
   → 提取：项目说明、模块说明、快速上手

4. src/main/java 下各层级目录的 README.md（如存在）
   → 提取：该层的职责说明、使用约定

5. @SpringBootApplication 所在类
   → 提取：根包路径、@ComponentScan / @MapperScan 配置

6. .editorconfig / checkstyle.xml / spotless 配置（如存在）
   → 提取：已有代码风格约定

7. Dockerfile / docker-compose.yml（如存在）
   → 提取：构建方式、运行方式、环境变量

8. .cursorrules / CLAUDE.md / AGENTS.md（如存在）
   → 提取：已有 AI 编码约定
```

### 探测结果输出格式

> **注意**：以下为模板格式，所有字段必须根据真实探测结果填写，禁止照抄示例值。未探测到的字段标注「未检测到」。

```markdown
## 自动探测结果

**Spring Boot 版本**：{从 parent 或 dependency 提取}
**Spring Cloud**：{Nacos / Feign / Sentinel / Gateway / 未检测到}
**ORM 框架**：{MyBatis-Plus / JPA / 原生 MyBatis / 未检测到}
**数据库**：{MySQL / PostgreSQL / Oracle / H2 + 是否多数据源}
**缓存**：{Redis + 模式（单机/哨兵/集群）/ 未检测到}
**消息队列**：{RabbitMQ / Kafka / RocketMQ / 未检测到}
**安全框架**：{Spring Security / Sa-Token / Shiro / 未检测到}
**工具库**：{Lombok / Hutool / MapStruct / Guava / ...}
**架构模式**：{DDD 分层 / MVC / 六边形 / 未确定}
**根包路径**：{如 com.example.project}
**构建工具**：{Maven / Gradle}
**多模块**：{是（列出模块清单）/ 否}

**已发现规范文档**：
- {列出实际发现的规范文档路径，无则标注「无」}

**已有 AI 约定**：{列出 .cursorrules / CLAUDE.md 路径，无则标注「无」}

**发现歧义**：{列出真实发现的歧义，无则标注「无」}
```

输出后等待用户确认，收到确认后进入模块扫描。

---

## 模块 1：项目结构规范

**采样**：输出完整目录树（`tree src/main/java -L 4`），不做评价。多模块项目对每个业务模块分别输出。

**归纳**：
- 分层模式（DDD / MVC / 其他），各层对应的包名
- 各层职责边界：
  | 层 | 包名 | 职责 | 禁止 |
  |---|------|------|------|
  | 接口层 | controller / api / web | 接收请求、参数校验、调用服务、返回响应 | 禁止写业务逻辑 |
  | 应用层 | service / application | 业务编排、事务控制 | 禁止直接操作数据库 |
  | 领域层 | domain / model | 业务实体、领域逻辑、领域事件 | 禁止依赖基础设施 |
  | 基础设施层 | infrastructure / mapper / repository | 数据库操作、外部服务调用 | 禁止包含业务逻辑 |
  | 公共层 | common / shared / core | 工具类、常量、异常、通用配置 | — |
- 是否存在职责混乱的包（如 Service 中直接操作 HttpServletRequest）

**输出规范**：
- 推荐标准目录结构（附每个包的职责说明）
- 问题包清单（附路径 + 建议）

---

## 模块 2：命名规范

**采样**：收集以下原始数据（只列举，不归纳）：
- 随机 10 个 Controller 类名 + 方法名
- 随机 10 个 Service 类名 + 方法名
- 随机 10 个 Entity/DO 类名 + 字段名
- 随机 5 个 DTO/VO 类名
- 随机 5 个工具类 + 方法名

**归纳**：
- 类名规范：PascalCase 遵守度、后缀一致性（Controller/Service/ServiceImpl/Mapper/DTO/VO/DO/Entity）
- 方法名规范：动词前缀分布（get/find/query/list/save/create/update/modify/delete/remove）
- 字段名规范：camelCase 遵守度、boolean 字段前缀（is/has/enable）
- 常量命名：UPPER_SNAKE_CASE 遵守度
- 包名规范：全小写、单词分隔方式

**输出规范**：
- 各类命名规则（附正例 ✅ 与反例 ❌）

---

## 模块 3：控制层规范

**采样**：随机抽取 8~10 个 Controller 类，逐一列出：
- 类注解（@RestController / @RequestMapping 路径）
- 方法签名（路径/HTTP 方法/参数注解/返回类型）
- 参数校验方式（原始代码片段）
- 响应包装方式（原始代码片段）

**归纳**：
- 路径风格：RESTful 程度、命名规则（驼峰 / 短横线 / 下划线）
- 参数校验：@Valid/@Validated 使用率、手动校验比例
- 统一响应：是否使用统一 Result<T>、使用率、未使用的遗留接口
- 异常处理：Controller 内 try-catch vs @ExceptionHandler 全局处理
- Swagger/API 文档注解：使用率、风格

**输出规范**：
- 标准 Controller 模板
- 接口路径命名规则
- 参数校验规范
- 统一响应格式定义

---

## 模块 4：应用服务层规范

**采样**：随机抽取 8~10 个 Service 实现类，逐一列出：
- 类结构（是否有接口+实现分离）
- 注入方式（@Autowired / @Resource / 构造器注入）
- 事务注解（@Transactional 使用方式、传播级别、readOnly）
- 方法内代码组织（原始代码片段）

**归纳**：
- 接口分离：有接口+实现 vs 直接实现类 的比例
- 注入方式分布
- 事务使用：
  - @Transactional 出现频率
  - readOnly 区分读写的实践
  - 传播级别（REQUIRED / REQUIRES_NEW / NESTED）分布
  - 是否存在"应加事务但未加"的风险（多步写操作无事务保护）
- 读写分离：QueryService vs CommandService 是否分离
- 方法粒度：平均方法行数，是否存在超 100 行的大方法

**输出规范**：
- 标准 Service 模板
- 事务使用规范
- 注入方式规范
- 方法粒度建议

---

## 模块 5：领域层规范（DDD 项目执行，非 DDD 跳过）

**采样**：扫描 domain/ / model/ 目录，列出：
- 随机 8 个 Entity 类（完整代码）
- 随机 3 个 Repository 接口
- 领域事件类（如有）
- 值对象类（如有）

**归纳**：
- 充血模型 vs 贫血模型：Entity 中是否包含业务方法
- 领域事件：是否使用 Spring Event / DomainEvent，触发方式
- Repository 接口：定义位置（domain 层 vs infrastructure 层）、实现方式
- 聚合根：是否明确定义、边界是否清晰
- 枚举：位置、命名规则、是否实现通用接口

**输出规范**：
- Entity 设计规范
- Repository 接口规范
- 领域事件使用规范（如有）

---

## 模块 6：数据模型规范

**采样**：随机抽取 10 个实体/DO/Entity 类，逐一列出：
- 类注解（@TableName / @Entity / @Data 等）
- 字段定义（类型、注解、约束）
- 主键策略
- 是否有 BaseEntity / 公共字段

**归纳**：
- ORM 注解风格：MyBatis-Plus @TableName vs JPA @Entity vs XML 映射 分布
- 主键策略：自增 / UUID / 雪花 / 自定义 分布
- 公共字段继承：BaseEntity 使用率（createTime/updateTime/createBy/deleted）
- 自动填充：MetaObjectHandler / @CreatedDate / AOP 切面 使用情况
- 逻辑删除：@TableLogic / @Where / 自定义 使用情况
- 多租户：TenantLineInnerInterceptor / 自定义 / 无
- 字段约束惯例：金额精度、ID 类型、时间类型、字符串长度

**同时提取核心实体清单**：
```
| 实体 | 表名 | 核心字段 | 关联关系 |
```

**输出规范**：
- 实体类模板
- 字段约束惯例
- 公共字段继承规范
- 核心实体关系图

---

## 模块 7：全局中间件与 AOP

**采样**：完整扫描以下目录/类：
- 所有 @Component + implements Filter/HandlerInterceptor/WebMvcConfigurer 的类
- 所有 @Aspect 注解的类
- @RestControllerAdvice / @ControllerAdvice 类
- WebSecurityConfigurerAdapter / SecurityFilterChain 配置类

**归纳（不做频率统计，做完整清单）**：

**拦截器/过滤器清单**：
```
| 名称 | 类型(Filter/Interceptor) | 用途 | 执行顺序 | 排除路径 |
```

**AOP 切面清单**：
```
| 切面名 | 触发注解 | 用途 | 切入点表达式 |
```

**统一异常处理**：
- @RestControllerAdvice 实现全貌
- 异常类继承体系
- 异常到错误码的映射规则
- 未被处理的异常兜底方式

**输出**：
- 完整的中间件/切面清单
- 统一异常处理体系说明
- 新增中间件/切面的注册方式

---

## 模块 8：基础设施封装

**采样**：完整扫描以下目录/类：
- redis/ / cache/ 相关封装类
- mq/ / message/ / event/ 相关封装类
- oss/ / file/ / storage/ 相关封装类
- job/ / schedule/ / task/ 相关封装类
- search/ / elasticsearch/ 相关封装类
- feign/ / client/ / rpc/ 相关封装类（远程调用）

**归纳（每个中间件单独整理）**：

**Redis**：
```
封装位置：{文件路径}
可用方法：{完整签名列表}
Key 命名规范：{如 {业务}:{模块}:{id}}
默认 TTL：{过期策略}
序列化方式：{JSON / JDK / Protobuf}
分布式锁：{Redisson / 自实现 / 无}
```

**消息队列**：
```
类型：{RabbitMQ / Kafka / RocketMQ}
生产者封装：{文件路径 + 方法签名}
消费者注册：{@RabbitListener / @KafkaListener 标准用法}
交换机/队列命名规则：{规则}
消息体序列化：{JSON / Protobuf}
重试策略：{次数 + 间隔 + 死信队列}
幂等消费：{如何保证}
```

**文件存储**：
```
封装位置：{文件路径}
存储类型：{MinIO / 阿里 OSS / 本地}
可用方法：{upload / download / getUrl / delete 签名}
```

**定时任务**：
```
框架：{XXL-Job / @Scheduled / Quartz}
注册方式：{注解 / 配置中心 / 数据库}
已有任务清单：{任务名 + 触发规则 + 用途}
```

**远程调用（微服务项目）**：
```
方式：{Feign / Dubbo / RestTemplate / WebClient}
已有 FeignClient 清单：{服务名 + 接口路径 + 用途}
熔断降级：{Sentinel / Hystrix / Resilience4j / 无}
```

**输出**：
- 各中间件的封装使用说明
- 禁止事项（如：禁止直接 new RedisTemplate，统一用封装类）

---

## 模块 9：异常与错误码

**采样**：完整扫描以下内容：
- 所有继承 RuntimeException / Exception 的自定义异常类
- 所有错误码枚举类（通常含 code + message 字段）
- @RestControllerAdvice 中的异常处理映射

**归纳**：

**异常类继承体系**：
```
RuntimeException
  └── BaseException（如有）
       ├── BusinessException（业务异常）
       ├── AuthException（认证异常）
       └── ...
```

**错误码枚举完整清单**：
```
| 错误码 | 名称 | 含义 | HTTP 状态码 |
```

**编号规则**：{如模块编号 * 1000 + 序号}

**使用一致性检查**：
- 统计直接 throw new RuntimeException("xxx") 的出现次数（应为 0）
- 统计硬编码错误信息的出现次数（应使用枚举）
- 标注违规文件清单

---

## 模块 10：安全与认证

**采样**：完整扫描以下内容：
- SecurityConfig / WebSecurityConfig 配置类
- JWT 工具类 / Token 工具类
- 加解密工具类
- 自定义权限注解
- 白名单/放行路径配置

**归纳**：
- 认证方式：JWT / Session / OAuth2 / Sa-Token
- Token 生命周期：生成 → 校验 → 刷新 → 失效
- 接口鉴权：默认鉴权 + 白名单路径
- 权限注解：@RequiresPermission / @PreAuthorize / 自定义
- 密码加密：BCrypt / MD5 + 盐 / 自定义
- 敏感数据处理：脱敏注解 / 加密存储 / 日志过滤

**输出**：
- 认证流程说明
- Token 工具方法签名
- 权限注解使用规范
- 安全相关禁止事项

---

## 模块 11：公共方法 & 常量速查

**采样**：完整扫描以下目录，列出所有导出项：
- utils/ / helper/ / tool/ — 所有 public static 方法
- constants/ / constant/ / enums/ — 所有 public static final 常量 + 枚举
- common/ / shared/ / core/ 下的工具类

**归纳（不做频率统计，做完整清单）**：

**公共方法清单格式**：
```
| 工具类 | 方法签名 | 路径 | 一句话用途 |
```

**常量清单格式**：
```
| 常量名/枚举名 | 值/枚举项 | 路径 | 用途 |
```

**重复实现检测**：
- 相似功能出现在多个类中（如多个地方自行实现日期格式化，但已有 DateUtil）
- 同一个 Feign 客户端在多个模块重复定义

**输出**：
- 完整的公共方法速查表
- 完整的常量/枚举速查表
- 重复实现清单（附路径 + 建议统一方案）

---

## 模块 12：通用模式与约定

**采样**：从已扫描的代码中提取通用编码模式。

**归纳**：
- 接口返回格式：Result<T> 结构定义 + 真实使用示例
- 分页封装：PageHelper / IPage / 自定义 PageResult + 真实使用示例
- DTO/VO 转换方式：MapStruct / BeanUtils / 手动 + 真实使用示例
- 日志打印方式：@Slf4j + MDC + 结构化格式 + 链路追踪（traceId）
- 事件机制：Spring Event / 自定义事件总线 + 真实使用示例
- 幂等控制：Token 机制 / 唯一键 / Redis 分布式锁 + 使用场景

**输出**：
- 每个通用模式的规范说明 + 正确调用示例（从项目中真实摘取）

---

## 模块 13：API 接口全景

**采样**：完整扫描所有 @RestController / @Controller 类，提取每个接口方法：

```
对每个 Controller 类：
1. 类级注解：@RequestMapping 路径前缀、@Api（Swagger 业务分类）
2. 每个方法：
   - 路径注解：@GetMapping / @PostMapping / @PutMapping / @DeleteMapping / @RequestMapping
   - 完整路径：类前缀 + 方法路径
   - HTTP 方法
   - 参数：@RequestParam / @RequestBody / @PathVariable（名称+类型+是否必填）
   - 响应类型：方法返回值类型（Result<T> 的 T 是什么）
   - 功能说明：优先从 @ApiOperation / @Operation 注解的 value 提取；无注解时从方法名推断
   - 关联错误码：方法内 throw 的 BusinessException 对应的 ResponseCode
```

**归纳（不做频率统计，做完整清单）**：

按 Controller / 业务模块分组输出：

```
### {模块名}（{Controller 类名}）
| 路径 | 方法 | 功能说明 | 请求参数 | 响应结构 | 关联错误码 |
|------|------|---------|---------|---------|-----------|
| /api/user/list | GET | 用户列表 | pageNum, pageSize, keyword? | Result<Page<UserVO>> | — |
| /api/user/{id} | GET | 用户详情 | id (PathVariable) | Result<UserVO> | USER_NOT_FOUND |
| /api/user | POST | 创建用户 | CreateUserDTO (Body) | Result<Long> | USER_ALREADY_EXISTS |
```

**Swagger 配置扫描**（如项目使用 Swagger / Knife4j）：
- 扫描 SwaggerConfig / Knife4jConfig 类
- 提取：分组配置（Docket / GroupedOpenApi）、全局参数（如 Token Header）
- 提取：@ApiModel / @ApiModelProperty 的 DTO 文档注解使用率

**输出**：
- 按模块分组的完整接口清单
- 接口总数统计
- 未添加 Swagger 注解的接口清单（建议补充）

---

## 模块 14：模块依赖关系

**采样**：从以下维度分析模块间依赖：

```
1. 包结构分析：
   - 识别顶层业务模块（按包名 / Maven 子模块 / 业务域划分）
   - 每个模块包含的 Controller / Service / Entity / Mapper

2. 依赖注入分析：
   - 扫描所有 Service 类中 @Autowired / @Resource / 构造器注入的依赖
   - 识别跨模块注入：Service A 注入了 Service B（A 和 B 属于不同业务模块）

3. Feign 调用分析（微服务项目）：
   - 扫描所有 @FeignClient 类
   - 识别：哪个模块调用了哪个远程服务

4. 数据库关联分析：
   - 扫描 Entity 中的关联注解（@ManyToOne / @JoinColumn）或 SQL 中的 JOIN
   - 识别：哪些实体跨模块关联
```

**归纳**：

**业务模块划分**：
```
| 模块 | 包路径 | 职责 | 核心实体 | 对外接口数 |
```

**模块间依赖清单**：
```
{模块A} → {模块B}（注入 B 的 UserService，用于查询用户信息）
{模块A} → {模块C}（Feign 调用 OrderService，用于查询订单状态）
```

**依赖方向检查**：
- 统计正向依赖（上层→下层）和反向依赖（下层→上层）的数量
- 反向依赖标注为违规（如 Domain 层注入了 Controller 层的类）
- 循环依赖检测（A→B→A）

**输出**：
- 业务模块划分表
- 模块依赖关系图（文字描述，含依赖原因）
- 依赖规则（允许方向 + 跨模块调用方式）
- 违规依赖清单（反向/循环/跨层直接访问 Mapper）
