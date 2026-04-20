---
name: java-project-creator
description: >
  创建符合阿里巴巴 Java 开发手册规范的 Spring Boot 项目脚手架，同时输出配套的项目规范文档。

  **必须在以下场景触发：**
  - 用户说"创建新 Java 项目"、"搭建 Java 微服务"、"初始化 Spring Boot 项目"
  - 用户说"按规范搭建项目"、"生成项目脚手架/骨架/模板"
  - 用户说"新建一个服务"、"起一个新的 Spring Cloud 项目"
  - 用户需要遵循 DDD 架构创建后端项目

  产出：① 项目规范文档（CONVENTIONS.md）② 完整可运行的项目脚手架（pom.xml + 分层目录 + 核心代码）
---

# Java 项目创建规范 Skill

本 Skill 的目标是：基于阿里巴巴 Java 开发手册（p3c）规范，帮助用户快速创建新的 Java 项目。产出两份内容：**规范文档** 和 **可运行的项目脚手架**。

---

## 第一步：收集项目信息

使用 `AskUserQuestion` 工具，一次性问清以下信息，**不要分多次提问**：

**必问项目：**
1. 项目 Artifact ID（如 `order-service`、`user-center`）
2. 项目 Group ID（默认 `com.example`）
3. 项目中文描述（如 "订单服务"）
4. Java 版本（默认 17，可选 11/17/21）
5. Spring Boot 版本（默认 3.2.x，Java 11 时建议 2.7.x）

**技术栈选择（多选）：**
- 配置中心：Nacos / Apollo / 无
- 缓存：Redis（Redisson）/ 无
- 消息队列：Kafka / RocketMQ / 无
- 定时任务：XXL-Job / Spring Scheduling / 无
- 服务调用：OpenFeign + Sentinel / 仅 OpenFeign / 无
- 对象存储：阿里 OSS / 腾讯 COS / MinIO / 无
- 链路追踪：SkyWalking / Micrometer Tracing / 无
- API 文档：Knife4j（SpringDoc）/ SpringDoc OpenAPI / 无
- 数据库连接池：Druid / HikariCP（Spring Boot 默认）

收集完信息后，告知用户"正在生成规范文档和项目脚手架..."，然后进入第二步。

---

## 第二步：输出项目规范文档

在项目根目录生成 `CONVENTIONS.md`，内容涵盖：

### 分层架构说明（DDD 简化版）

```
{artifactId}/
├── src/main/java/{groupPath}/{artifactId}/
│   ├── {ArtifactId}Application.java        ← 启动类
│   ├── controller/                          ← 接口层（HTTP 入口）
│   ├── application/                         ← 应用服务层（用例编排）
│   │   └── impl/
│   ├── domain/                              ← 领域层（核心业务）
│   │   └── {module}/
│   │       ├── entity/                      ← 领域实体（含业务方法）
│   │       ├── enums/                       ← 领域枚举
│   │       ├── event/                       ← 领域事件
│   │       ├── factory/                     ← 工厂类
│   │       ├── repository/                  ← 仓储接口
│   │       │   └── impl/                    ← 仓储实现
│   │       └── constant/                    ← 领域常量
│   ├── infrastructure/                      ← 基础设施层
│   │   ├── aop/                             ← 切面（日志/幂等/鉴权）
│   │   ├── annotation/                      ← 自定义注解
│   │   ├── config/                          ← 配置类
│   │   ├── consumer/                        ← 消息消费者（如有 MQ）
│   │   ├── task/                            ← 定时任务
│   │   ├── listener/                        ← 领域事件监听器
│   │   ├── exception/                       ← 全局异常处理
│   │   └── util/                            ← 工具类
│   ├── integration/                         ← 集成层（外部服务）
│   │   ├── client/                          ← Feign 客户端
│   │   ├── fallback/                        ← 降级实现
│   │   ├── request/                         ← 外部调用入参 DTO
│   │   └── response/                        ← 外部调用出参 DTO
│   ├── interfaces/                          ← 接口适配层
│   │   ├── assembler/                       ← 对象转换（MapStruct）
│   │   └── validator/                       ← 自定义校验器
│   ├── mapper/                              ← MyBatis Mapper 接口
│   └── pojo/                                ← 数据对象（统一存放）
│       ├── bo/        BO      - 业务对象，应用层内流转
│       ├── vo/        VO      - HTTP 入参视图对象
│       ├── dto/       DTO     - 跨层/跨服务数据传输对象
│       ├── entity/    Entity  - 数据库映射实体（DO）
│       ├── query/     Query   - 读操作查询对象
│       ├── command/   Command - 写操作命令对象
│       └── message/   Message - MQ 消息体
├── src/main/resources/
│   ├── application.yml          ← profile 入口
│   ├── application-dev.yml      ← 开发环境配置
│   ├── application-test.yml     ← 测试环境配置
│   ├── application-prod.yml     ← 生产环境配置（占位）
│   ├── logback-spring.xml       ← 日志配置
│   └── mapper/                  ← MyBatis XML（复杂 SQL）
├── src/test/java/               ← 单元测试
└── pom.xml
```

### 命名规范（遵循阿里巴巴 Java 开发手册）

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | UpperCamelCase | `OrderApplicationService` |
| 方法名 | lowerCamelCase | `createOrder()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 包名 | 全小写，点号分隔 | `com.example.order.domain` |
| ApplicationService | 写操作：`XxxApplicationService` / 读操作：`XxxQueryService` | `OrderApplicationService` |
| Repository | 领域仓储接口：`XxxRepository` | `OrderRepository` |
| Mapper | 数据访问接口：`XxxMapper` | `OrderMapper` |
| Entity（DO） | 数据库实体：`XxxEntity` | `OrderEntity` |
| DTO | 数据传输：`XxxDTO` | `OrderDTO` |
| VO | 视图对象：`XxxVO` | `OrderVO` |
| Query | 查询对象：`XxxQuery` | `OrderQuery` |
| Command | 写命令对象：`XxxCommand` | `CreateOrderCommand` |
| Feign Client | `XxxClient`（位于 integration/client） | `UserClient` |
| 统一响应 | `Result<T>` + `ResultCode` 枚举 | `Result.ok(data)` |

### AOP 切面规范

所有切面按 `@Order` 有序执行：

| 切面 | Order | 作用 |
|------|-------|------|
| AccessLogAop | -10 | 记录 Controller 层请求日志（URL/耗时/入出参） |
| IdempotentAop | 默认 | 基于 Redis 的接口幂等（可选，需 Redis） |

### 统一响应格式

```java
// 所有接口统一返回
Result<T> { code, data, message, timestamp }

// 成功：code=200，失败：使用 ResultCode 枚举定义错误码
```

### 异常处理规范（阿里巴巴手册）

- 不允许直接捕获 Exception，应捕获具体异常
- 业务异常统一抛出 `BizException`（携带 ResultCode）
- 全局异常处理器 `GlobalExceptionHandler` 统一兜底
- 异常日志必须包含堆栈信息：`log.error("描述: {}", param, e)`

### 日志规范

- 使用 SLF4J + Logback（Spring Boot 默认）
- 禁止使用 `System.out.println`
- 日志格式：`%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n`
- 链路追踪 ID（如有 SkyWalking/Micrometer）自动注入

---

## 第三步：生成项目脚手架

### 3.1 生成 pom.xml

**父 POM**（统一使用 Spring Boot 官方 parent）：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>{springBootVersion}</version>
    <relativePath/>
</parent>
```

**固定依赖（所有项目必须包含）**：

```xml
spring-boot-starter-web
spring-boot-starter-aop
spring-boot-starter-validation
spring-boot-starter-test（test scope）
mybatis-plus-spring-boot3-starter（3.5.x，Spring Boot 2.x 用 mybatis-plus-boot-starter）
mysql-connector-j（runtime）
lombok
mapstruct + mapstruct-processor（1.5.x）
commons-lang3
```

按用户选择追加依赖（参考下方各技术栈 block）。

**Java 版本配置**：
```xml
<properties>
    <java.version>{javaVersion}</java.version>
    <mapstruct.version>1.5.5.Final</mapstruct.version>
</properties>
```

**build 插件**：
- maven-compiler-plugin（annotationProcessorPaths 包含 mapstruct + lombok）
- spring-boot-maven-plugin

### 3.2 技术栈依赖 Block

**Nacos 配置中心：**
```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```
> 需要 Spring Cloud Alibaba BOM 管理版本。

**Apollo 配置中心：**
```xml
<dependency>
    <groupId>com.ctrip.framework.apollo</groupId>
    <artifactId>apollo-client</artifactId>
    <version>2.1.0</version>
</dependency>
```

**Redis（Redisson）：**
```xml
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson-spring-boot-starter</artifactId>
    <version>3.27.0</version>
</dependency>
```

**Kafka：**
```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

**RocketMQ：**
```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-spring-boot-starter</artifactId>
    <version>2.2.3</version>
</dependency>
```

**XXL-Job：**
```xml
<dependency>
    <groupId>com.xuxueli</groupId>
    <artifactId>xxl-job-core</artifactId>
    <version>2.4.0</version>
</dependency>
```

**OpenFeign + Sentinel：**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

**SkyWalking：**
```xml
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-trace</artifactId>
    <version>9.1.0</version>
</dependency>
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-logback-1.x</artifactId>
    <version>9.1.0</version>
</dependency>
```

**Micrometer Tracing（替代 SkyWalking 的轻量方案）：**
```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
```

**阿里 OSS：**
```xml
<dependency>
    <groupId>com.aliyun.oss</groupId>
    <artifactId>aliyun-sdk-oss</artifactId>
    <version>3.17.4</version>
</dependency>
```

**腾讯 COS：**
```xml
<dependency>
    <groupId>com.qcloud</groupId>
    <artifactId>cos_api</artifactId>
    <version>5.6.191</version>
</dependency>
```

**MinIO：**
```xml
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.7</version>
</dependency>
```

**Knife4j（SpringDoc，推荐 Spring Boot 3.x）：**
```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
    <version>4.4.0</version>
</dependency>
```
> Spring Boot 2.x 使用 `knife4j-openapi2-spring-boot-starter`。

**SpringDoc OpenAPI（无 Knife4j UI）：**
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

**Druid 连接池：**
```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-3-starter</artifactId>
    <version>1.2.21</version>
</dependency>
```
> Spring Boot 2.x 使用 `druid-spring-boot-starter`。

### 3.3 生成核心 Java 文件

生成以下文件，包路径为 `{groupId转路径}/{artifactId}`，例如 `com/example/order`：

#### 启动类 `{PascalName}Application.java`
```java
@SpringBootApplication
@EnableScheduling
public class {PascalName}Application {
    public static void main(String[] args) {
        SpringApplication.run({PascalName}Application.class, args);
    }
}
```
如选了 OpenFeign 则加 `@EnableFeignClients(basePackages = "{groupId}.{artifactId}.integration.client")`。

#### `pojo/Result.java` — 统一响应体
完整生成（含泛型、ok()/error() 静态方法、timestamp 字段）。

#### `pojo/ResultCode.java` — 响应码枚举
包含基础码：SUCCESS(200)、BAD_REQUEST(400)、UNAUTHORIZED(401)、FORBIDDEN(403)、NOT_FOUND(404)、CONFLICT(409)、INTERNAL_ERROR(500)。

#### `infrastructure/exception/BizException.java`
RuntimeException 子类，持有 ResultCode 和 message。

#### `infrastructure/exception/GlobalExceptionHandler.java`
@RestControllerAdvice，处理 BizException、MethodArgumentNotValidException、ConstraintViolationException、HttpMessageNotReadableException、Exception，返回 `Result<?>`。

#### `infrastructure/aop/AccessLogAop.java`
- @Around 拦截 `controller..*(..)` 所有方法
- @Order(-10)
- 记录 URL、HTTP Method、耗时、入参、出参（JSON 序列化，超长截断）

#### `infrastructure/annotation/Idempotent.java`（如选了 Redis）
注解：`@Target(METHOD)` + `@Retention(RUNTIME)` + `long timeout() default 3`

#### `infrastructure/aop/IdempotentAop.java`（如选了 Redis）
- @Around `@annotation(Idempotent)`
- 基于请求参数 MD5 的 Redis setnx 锁
- 重复请求抛 BizException(CONFLICT)

#### `infrastructure/config/MybatisPlusConfig.java`
注册 `MybatisPlusInterceptor` + `PaginationInnerInterceptor`。

#### `infrastructure/config/ThreadPoolConfig.java`
生成 asyncExecutor、businessExecutor。如有链路追踪则通过 TaskDecorator 透传 traceId。

#### `infrastructure/config/KafkaConfig.java`（如选 Kafka）
生成 KafkaTemplate + 示例 ConsumerFactory 配置。

#### `infrastructure/config/XxlJobConfig.java`（如选 XXL-Job）
标准 XxlJobSpringExecutor 配置，从配置文件读取参数。

#### 示例 Controller：`controller/DemoController.java`
```java
@RestController
@RequestMapping("/api/v1/demo")
@RequiredArgsConstructor
@Tag(name = "示例接口")
public class DemoController {
    private final DemoApplicationService demoApplicationService;

    @PostMapping
    @Operation(summary = "创建示例")
    public Result<Long> create(@RequestBody @Valid CreateDemoCommand command) {
        return Result.ok(demoApplicationService.create(command));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询示例")
    public Result<DemoVO> get(@PathVariable Long id) {
        return Result.ok(demoApplicationService.get(id));
    }
}
```

#### 示例 ApplicationService 接口 + 实现（`application/`）
展示写操作 + 读操作分离的模式。

#### 示例领域实体（`domain/{module}/entity/DemoBO.java`）
带 @Data、@Builder，展示领域行为方法结构。

#### 示例仓储接口（`domain/{module}/repository/DemoRepository.java`）
接口形式，含 save/findById 方法示例。

#### 示例 POJO
`pojo/command/CreateDemoCommand.java` + `pojo/query/DemoQuery.java` + `pojo/vo/DemoVO.java` + `pojo/entity/DemoEntity.java`
基础 POJO 示例，带 @Valid 校验注解（@NotBlank / @NotNull / @Size 等）。

### 3.4 生成配置文件

**application.yml**（仅切换 profile）：
```yaml
spring:
  profiles:
    active: dev
```

**application-dev.yml**（本地开发模板）：
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/{artifactId}?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    username: root
    password: YOUR_PASSWORD
    driver-class-name: com.mysql.cj.jdbc.Driver
  # Redis 配置（如选了 Redisson）
  data:
    redis:
      host: 127.0.0.1
      port: 6379

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  type-enums-package: {groupId}.{artifactId}.domain.*.enums
  mapper-locations: classpath:mapper/**/*.xml

# API 文档（如选了 Knife4j / SpringDoc）
springdoc:
  api-docs:
    enabled: true
```

按用户选择的技术栈追加对应配置块（Nacos/Apollo/Kafka/XXL-Job 等）。

**logback-spring.xml**（标准格式）：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProperty scope="context" name="APP_NAME" source="spring.application.name" defaultValue="{artifactId}"/>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```
如有 SkyWalking 则使用 `apm-toolkit-logback-1.x` 的 `%tid` 占位符注入 traceId。

### 3.5 生成 .gitignore

```gitignore
target/
*.class
*.jar
*.log
.idea/
*.iml
.DS_Store
application-prod.yml
```

---

## 第四步：输出说明

将所有文件保存到工作区文件夹，然后告知用户：

1. **规范文档**：`CONVENTIONS.md` — 团队成员开发时的参考手册
2. **项目脚手架**：完整目录结构，可直接用 IntelliJ IDEA 打开
3. **下一步建议**：
   - 修改 `application-dev.yml` 中的数据库/Redis 连接信息
   - 运行 `mvn compile` 验证依赖正确
   - 参考 DemoController → DemoApplicationService → DemoBO 的调用链路开发第一个接口
   - 删除 Demo 示例代码（仅做结构参考）

---

## 注意事项

- 所有生成的代码必须能编译通过（语法正确、import 完整）
- 遵循阿里巴巴 Java 开发手册命名规范（UpperCamelCase / lowerCamelCase / UPPER_SNAKE_CASE）
- 如用户选择了多数据源，Entity 类上添加 `@DS("xxx")` 示例注释
- 如选了 SkyWalking，TaskDecorator 必须透传 traceId
- 生成的文件路径严格遵循包名规则（groupId 含点号要转为路径分隔符）
- 示例代码要完整可运行，不要写 `// TODO` 占位
- Spring Boot 3.x 使用 `jakarta.*` 命名空间（非 `javax.*`）

---

## 参考：包名转路径规则

groupId=`com.example`，artifactId=`order` →
- Java 根路径：`src/main/java/com/example/order/`
- 包声明：`package com.example.order.controller;`
- 主类：`com.example.order.OrderApplication`
