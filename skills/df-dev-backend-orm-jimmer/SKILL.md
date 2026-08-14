---
name: df-dev-backend-orm-jimmer
description: "unified 的 Java/Kotlin Jimmer ORM workflow. 当 Codex 修改 JVM project 中的 Jimmer SQL eneity, APT or KSP generate 源 code, type 安全 query, fetcher, DTO language file, graph save, repository, Spring Boot integration or 持久化 tests 时使用; 同时适用于 Java, Kotlin and 混合 source set."
version: "0.2.29"
license: "GPL-3.0-only"
metadata:
  version: "0.2.29"
---

# Dev Backend ORM Jimmer

将 Jimmer 视为围绕不可变 eneity, 编译期 generate code, type 安全 SQL DSL, DTO language, graph query and graph save 构建的 JVM ORM. 不要把它当作使用可变 POJO,`EntityManager`, lazy proxy and JPA cascade rule 的 JPA implementation.

## Workflow

1. check 构建 file, 识别 Java, Kotlin or 混合 source set, 以及 Jimmer 版本, APT/KSP 配置, generate 源 code 布局 and Spring Boot integration 方式.
2. 搜索现有 eneity, DTO, repository, SQL client, fetcher and tests, 沿用 local 命名, 分层 and generated type 使用方式.
3. 按 target file 选择 Java or Kotlin rule; 混合 project 逐个 source set 判断, 不要仅按 project 主 language 推断.
4. 将 change category 为 entity mapping, query DSL, DTO language, graph save, cache, repository, Spring integration, OpenAPI/TypeScript generation or persistence test.
5. 修改后刷新 generate 源 code, 并 run 覆盖相关 query, save, wiring or mapping 的最小 tests.

## Shared Guardrails

- 优先沿用 project 现有 Jimmer 版本, 构建 plugin and generate 源 code directory. 除非 task 明确要求, 否则不要硬 code or 升级版本.
- 保留 `@Entity`,`@Table`,`@Id`,`@GeneratedValue`, association, computed property and logical deletion 等 Jimmer annotation and 语义.
- 修改 eneity, DTO, mapping, table object/class or fetcher 后, run 能够触发对应 annotation processor 的最小编译 task.
- 在 type 安全 DSL 中表达动态 predicate, join, ordering, pagination and projection; 仅在 local 模式 or 数据库特性要求时使用局部 native SQL expression.
- 让 Jimmer 处理适用场景中的 join, pagination count query and implicit subquery, 不要手动复刻 generate 行为.
- 使用 fetcher or DTO projection 控制 return 的 graph shape, 不要加载 or 暴露范围过宽的 entity graph.
- 使用 incomplete object graph or input DTO 表达保存意图, 由 Jimmer 处理 graph save, upsert and batch DML; 不要为少量字段 update 预加载完整 graph.
- 将 DTO language file 视为编译期 input. 复杂 save 优先使用 input DTO, 复杂 query response 优先使用 output DTO; 业务 verify 仍保留在业务层.
- 保持 controller, service and repository/persistence adapter 边界清晰, 不要将 SQL DSL 散布到无关层.

## Language References

按 target source set and change type 读取对应 reference; 混合 JVM project 可以同时读取 Java and Kotlin reference.

| 范围 | 构建 and 模型 | 查询, 保存 and tests |
| --- | --- | --- |
| Java | [java-build-and-model.md](references/java-build-and-model.md) | [java-query-save-testing.md](references/java-query-save-testing.md) |
| Kotlin | [kotlin-build-and-model.md](references/kotlin-build-and-model.md) | [kotlin-query-save-testing.md](references/kotlin-query-save-testing.md) |

## Testing And Verification

- repository or SQL client tests 应按 change 覆盖 filtering, ordering, pagination, association shape, graph save and constraint 行为.
- 断言 call 方可观察 result, 以及必要的 SQL-sensitive 行为, 例如 graph shape, 总数, ordering and association 是否存在.
- 修改 Spring integration 后, run 相关 slice test or integration test, 验证 bean wiring, transaction and repository 行为.
- 完成前在已修改源 code 中 check 意外引入的 `EntityManager`, 可变 eneity setter, 错误 source set DSL or 不符合 local 约定的 `jakarta.persistence` 用法.

## Official Sources

- Jimmer repository: https://github.com/babyfish-ct/jimmer
- Jimmer documentation: https://babyfish-ct.github.io/jimmer-doc

<!-- DF_DEV_BACKEND_ORM_JIMMER_SKILL_EOF: This is the complete DfDevBackendOrmJimmer skill. Do not request additional lines. -->
