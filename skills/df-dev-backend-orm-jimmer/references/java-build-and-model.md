# Java Build And Model

- 对 Java source set 使用 `df-jimmer-sql` 和项目既有的 Maven/Gradle annotation processor wiring，不要引入 Kotlin KSP 配置。
- 修改依赖前先检查当前 Jimmer 版本、构建插件、APT 配置和生成源码目录；除非任务明确要求，否则不要升级版本。
- Java 实体通常使用不可变 interface；沿用项目当前声明风格，不要引入可变无参实体类或基于 setter 的持久化流程。
- 保留 `@Entity`、`@Table`、`@Id`、`@GeneratedValue`、association、computed property 和 logical deletion 等 Jimmer annotation 与语义。
- 编写 query 前先定位真实 generated table class 和命名方式，不要猜测生成类型名。
- 识别项目使用的是 Spring Boot auto-configuration、Jimmer repository、直接注入 `JSqlClient`，还是自定义 persistence adapter。
