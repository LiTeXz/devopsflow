---
name: df-jimmer-kotlin
description: "Kotlin 专用 Jimmer ORM guardrail。当 Codex 修改 Kotlin Jimmer SQL 实体、KSP/Gradle 配置、Spring Boot 集成、生成的 table object query、fetcher、DTO language 文件、graph save、repository 或持久化测试时使用。Kotlin source set 和 Kotlin-first 混合 JVM 项目使用此 skill；Java source set 使用 df-jimmer-java。"
---

# Jimmer Kotlin

处理使用 Jimmer SQL 的 Kotlin 代码时使用此 skill。应将 Jimmer 视为一种围绕不可变实体模型、KSP 生成代码、Kotlin DSL 和类型安全 query 构建的编译期 ORM。不要像处理使用可变 POJO 的 JPA 那样处理它。

## Pre-Change Checks

- 修改依赖前先检查现有构建。优先沿用项目当前的 Jimmer 版本、Kotlin plugin 和 KSP 配置。
- 在 Gradle Kotlin DSL 项目中，应使用 `com.google.devtools.ksp`、`df-jimmer-sql-kotlin` 和 KSP processor wiring，而不是 Java annotation processor。
- 编写 query 前先定位生成源码目录和现有 table object 命名。不要虚构生成的类型名称。
- 识别项目使用的是 Spring Boot auto-configuration、Jimmer repository、直接注入 `KSqlClient`，还是自定义 persistence adapter。

## Entity Rules

- 按本地约定对 Jimmer Kotlin 实体建模，通常使用不可变接口或 abstract declaration。
- 保留 `@Entity`、`@Table`、`@Id`、`@GeneratedValue`、association、computed property 和 logical deletion 等 Jimmer annotation 与语义。
- 不要为持久化引入 JPA-only 模式：可变无参实体类、基于 setter 的变更工作流、`EntityManager`、lazy proxy 假设或 cascade 规则。
- 修改实体、DTO 文件或 mapping 后，运行能够刷新 KSP 生成源码的最小构建任务。

## Query Rules

- 优先使用 Kotlin DSL 和生成的 table object 实现类型安全 SQL。将动态 predicate 保留在 DSL 中，不要拼接 SQL 字符串。
- 使用 fetcher 或 DTO projection 定义返回的 graph shape。当调用方只需要窄范围结果时，不要加载宽范围 entity graph。
- 在适用场景让 Jimmer 优化 join、分页 count query 和 implicit subquery。不要手动复刻生成行为。
- 需要 native SQL expression 时，将其限制在局部，并在周围保留清晰的类型边界。

## Save And DTO Rules

- 对于 graph save，构造用例所需的 incomplete object graph，并交由 Jimmer 保存。不要仅为修改少数字段而预加载完整 graph。
- 项目使用 Jimmer DTO language 时，复杂 save 优先使用 input DTO，复杂 query response 优先使用 output DTO。
- 将 DTO 文件视为编译期输入。若只修改了 DTO 文件，运行完整编译或项目的生成源码刷新命令。
- 将业务校验保留在业务层。不要把 domain policy 隐藏在生成的 DTO template 中。

## Testing And Verification

- 使用 repository 或 SQL client 测试覆盖 query、ordering、filtering、pagination、association shape、graph save 和 constraint 行为。
- 断言可观察结果及 SQL-sensitive 行为，例如返回的 graph shape、总数、ordering 和 association 是否存在。
- 修改实体或 DTO 后，运行针对性的 Kotlin/JVM 测试和 compile/KSP 任务，确认生成代码已刷新。
- 完成前，在已修改 Kotlin 代码中搜索意外引入的 `EntityManager`、可变实体 setter，或不符合本地约定的 `jakarta.persistence` 用法。

## Official Sources

- Jimmer repository： https://github.com/babyfish-ct/df-jimmer
- Jimmer documentation： https://babyfish-ct.github.io/df-jimmer-doc/

<!-- DF_JIMMER_KOTLIN_EOF: This is the complete DfJimmerKotlin skill. Do not request additional lines. -->
