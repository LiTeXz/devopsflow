---
name: df-dev-backend-orm-jimmer
description: "统一的 Java/Kotlin Jimmer ORM 工作流。当 Codex 修改 JVM 项目中的 Jimmer SQL 实体、APT 或 KSP 生成源码、类型安全 query、fetcher、DTO language 文件、graph save、repository、Spring Boot 集成或持久化测试时使用；同时适用于 Java、Kotlin 和混合 source set。"
---

# Dev Backend ORM Jimmer

将 Jimmer 视为围绕不可变实体、编译期生成代码、类型安全 SQL DSL、DTO language、graph query 与 graph save 构建的 JVM ORM。不要把它当作使用可变 POJO、`EntityManager`、lazy proxy 和 JPA cascade 规则的 JPA 实现。

## Workflow

1. 检查构建文件，识别 Java、Kotlin 或混合 source set，以及 Jimmer 版本、APT/KSP 配置、生成源码布局和 Spring Boot 集成方式。
2. 搜索现有实体、DTO、repository、SQL client、fetcher 和测试，沿用本地命名、分层与 generated type 使用方式。
3. 按目标文件选择 Java 或 Kotlin 规则；混合项目逐个 source set 判断，不要仅按项目主语言推断。
4. 将变更分类为 entity mapping、query DSL、DTO language、graph save、cache、repository、Spring integration、OpenAPI/TypeScript generation 或 persistence test。
5. 修改后刷新生成源码，并运行覆盖相关 query、save、wiring 或 mapping 的最小测试。

## Shared Guardrails

- 优先沿用项目现有 Jimmer 版本、构建插件和生成源码目录。除非任务明确要求，否则不要硬编码或升级版本。
- 保留 `@Entity`、`@Table`、`@Id`、`@GeneratedValue`、association、computed property 和 logical deletion 等 Jimmer annotation 与语义。
- 修改实体、DTO、mapping、table object/class 或 fetcher 后，运行能够触发对应 annotation processor 的最小编译任务。
- 在类型安全 DSL 中表达动态 predicate、join、ordering、pagination 和 projection；仅在本地模式或数据库特性要求时使用局部 native SQL expression。
- 让 Jimmer 处理适用场景中的 join、pagination count query 和 implicit subquery，不要手动复刻生成行为。
- 使用 fetcher 或 DTO projection 控制返回的 graph shape，不要加载或暴露范围过宽的 entity graph。
- 使用 incomplete object graph 或 input DTO 表达保存意图，由 Jimmer 处理 graph save、upsert 和 batch DML；不要为少量字段更新预加载完整 graph。
- 将 DTO language 文件视为编译期输入。复杂 save 优先使用 input DTO，复杂 query response 优先使用 output DTO；业务校验仍保留在业务层。
- 保持 controller、service 与 repository/persistence adapter 边界清晰，不要将 SQL DSL 散布到无关层。

## Language References

按目标 source set 和变更类型读取对应 reference；混合 JVM 项目可以同时读取 Java 与 Kotlin reference。

| 范围 | 构建与模型 | 查询、保存与测试 |
| --- | --- | --- |
| Java | [java-build-and-model.md](references/java-build-and-model.md) | [java-query-save-testing.md](references/java-query-save-testing.md) |
| Kotlin | [kotlin-build-and-model.md](references/kotlin-build-and-model.md) | [kotlin-query-save-testing.md](references/kotlin-query-save-testing.md) |

## Testing And Verification

- repository 或 SQL client 测试应按变更覆盖 filtering、ordering、pagination、association shape、graph save 和 constraint 行为。
- 断言调用方可观察结果，以及必要的 SQL-sensitive 行为，例如 graph shape、总数、ordering 和 association 是否存在。
- 修改 Spring 集成后，运行相关 slice test 或 integration test，验证 bean wiring、transaction 和 repository 行为。
- 完成前在已修改源码中检查意外引入的 `EntityManager`、可变实体 setter、错误 source set DSL 或不符合本地约定的 `jakarta.persistence` 用法。

## Official Sources

- Jimmer repository: https://github.com/babyfish-ct/jimmer
- Jimmer documentation: https://babyfish-ct.github.io/jimmer-doc

<!-- DF_DEV_BACKEND_ORM_JIMMER_SKILL_EOF: This is the complete DfDevBackendOrmJimmer skill. Do not request additional lines. -->
