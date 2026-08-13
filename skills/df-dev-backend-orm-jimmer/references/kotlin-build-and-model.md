# Kotlin Build And Model

- 对 Kotlin source set 使用 `com.google.devtools.ksp`、`df-jimmer-sql-kotlin` 和项目既有的 KSP processor wiring，不要改用 Java annotation processor。
- 修改依赖前先检查当前 Jimmer 版本、Kotlin plugin、KSP 配置和生成源码目录；除非任务明确要求，否则不要升级版本。
- Kotlin 实体通常使用不可变 interface 或 abstract declaration；沿用项目当前声明风格。
- 保留 `@Entity`、`@Table`、`@Id`、`@GeneratedValue`、association、computed property 和 logical deletion 等 Jimmer annotation 与语义。
- 编写 query 前先定位真实 generated table object 和命名方式，不要猜测生成类型名。
- 识别项目使用的是 Spring Boot auto-configuration、Jimmer repository、直接注入 `KSqlClient`，还是自定义 persistence adapter。
