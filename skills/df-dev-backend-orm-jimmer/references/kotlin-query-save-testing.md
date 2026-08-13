# Kotlin Query Save Testing

- 优先使用 Kotlin DSL 和生成的 table object 表达 predicate、join、ordering、pagination 和 projection，不要拼接 SQL 字符串。
- 使用 fetcher 或 DTO projection 控制 graph shape；需要 native SQL expression 时，将其限制在局部并保留清晰的类型边界。
- 对 graph save 构造所需的 incomplete object graph，并交由 Jimmer 处理；复杂 save 优先使用 input DTO，复杂 query response 优先使用 output DTO。
- 修改实体或 DTO 后运行 compile/KSP 任务和针对性的 Kotlin/JVM persistence test，确认生成代码已刷新。
- repository 或 SQL client 测试覆盖 filtering、ordering、pagination、association shape、graph save 和 constraint 行为，并断言必要的 SQL-sensitive 结果。
