---
name: df-jimmer
description: "通用 Jimmer ORM 工作流与语言路由器。当 Codex 修改 JVM 项目中的 Jimmer 实体、编译期生成源码、SQL DSL 查询、fetcher、DTO language 文件、graph save、repository、Spring Boot 集成或持久化测试时使用。Kotlin-first Jimmer 项目继续使用 df-jimmer-kotlin，Java-first Jimmer 项目继续使用 df-jimmer-java。"
---

# Jimmer

此 skill 用于跨语言 Jimmer ORM 工作。应将 Jimmer 视为一种编译期 JVM ORM，其核心包括不可变实体模型、生成代码、类型安全的 SQL DSL、DTO language 文件、任意形状的 graph query 与 graph save。

## Language Routing

- 修改 Kotlin source set、KSP、`df-jimmer-sql-kotlin`、Kotlin DSL 或 `KSqlClient` 时，使用 `$df-jimmer-kotlin`。
- 修改 Java source set、APT、Maven/Gradle annotation processing、Java DSL 或 `JSqlClient` 时，使用 `$df-jimmer-java`。
- 在混合 JVM 项目中，选择与主要 Jimmer 实体、DTO、repository 和 SQL client 代码相匹配的语言专用 skill。
- 对于跨语言设计、评审或生成源码故障排查，先从此处开始，再针对具体文件切换到对应语言的 skill。

## Core Boundaries

- 将 Jimmer 视为编译期框架：修改实体、DTO、table object/class 和 fetcher 后必须刷新生成源码。
- 不要将 Jimmer 实体改造成 JPA 实体。避免把可变持久化 setter、无参可变实体类、`EntityManager` 工作流、lazy proxy 假设和 JPA cascade 规则作为主要模型。
- 优先沿用项目现有的 Jimmer 版本、构建插件和生成源码布局。除非任务要求，否则不要硬编码或升级版本。
- 明确 query shape 与 save shape。Jimmer 支持任意 graph shape；不要仅为更新少数字段而加载完整 object graph。

## Pre-Change Checks

1. 检查构建文件，识别所用语言、Jimmer 依赖、KSP/APT 配置和 Spring Boot 集成方式。
2. 搜索现有实体、DTO、repository、SQL client、fetcher 和测试，了解本地命名与分层方式。
3. 在猜测 table object 或 table class 名称之前，先定位生成源码的使用方式。
4. 对变更分类：entity mapping、query DSL、DTO language、graph save、cache、Spring repository、OpenAPI/TypeScript 生成或持久化测试。

## Implementation Guardrails

- Entity：保留 `@Entity`、`@Table`、`@Id`、association、computed property 和 logical deletion 等 Jimmer 语义。
- Query：在类型安全的 DSL 中表达动态条件、join、ordering、pagination 和 projection；仅当本地模式或数据库特性需要时才使用 native SQL。
- Fetcher/DTO：使用 fetcher 或 DTO 控制返回的 graph shape，不要返回范围过宽的 entity graph。
- Save：使用 incomplete object 或 DTO 表达持久化意图，由 Jimmer 处理 graph save、upsert 和 batch DML。
- Spring：保持 HTTP/controller、service 与 repository/persistence adapter 边界清晰。不要把 SQL DSL 代码散布到无关层中。

## Verification

- 修改实体、DTO 或 mapping 后，运行能够触发 KSP 或 APT 的最小编译任务。
- 修改 query 或 save 后，运行或补充 repository/SQL client 测试，覆盖 filter、ordering、pagination、association shape、graph save 和 constraint 行为。
- 修改 Spring 集成后，运行相关 slice test 或 integration test，验证 bean wiring、transaction 和 repository 行为。
- 完成前，在新增代码中搜索 `EntityManager`、可变实体 setter 等 JPA-only API，以及不符合本地约定的 `jakarta.persistence` 用法。

## Official Sources

- Jimmer repository： https://github.com/babyfish-ct/df-jimmer
- Jimmer documentation： https://babyfish-ct.github.io/df-jimmer-doc/
