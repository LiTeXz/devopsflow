---
name: df-spring-web-boundaries
description: "用于 Java/Spring Boot 重构的 Spring Web boundary guardrail。当 Codex 修改 Spring 应用中的 controller、REST endpoint、request/response mapping、validation、security、文件上传/下载、export 或 service/controller 分层时使用。这是 TDD skill 的可选架构与技术栈配套 skill；不要将其用作通用 TDD methodology skill。"
---

# Spring Web Boundaries

使用此 skill 保护 Spring Web adapter boundary。它本身不是 TDD，而是 Spring 分层与 Web adapter 约束。

## Core Principles

- Controller 处理 HTTP adaptation：mapping、binding、validation、status、header、content type、multipart、servlet streaming 和 security entry point。
- Application/service 层处理 application orchestration：business flow、query construction、batching、import/export strategy、transaction strategy、callback order、event 和 cache side effect。
- Domain 层处理核心规则；repository 和 query object 处理持久化细节。
- 除非按照项目约定代码本身已经是 adapter，否则不要把 HTTP 语义推入核心 application logic。

## Controller Changes

修改 controller 或 endpoint 时，先判断变更是否影响：

- HTTP method、path、query/form parameter、request body 或 multipart part。
- 默认值、binding、validation 或 serialization。
- Status、content type、header 或 `Content-Disposition`。
- CSRF、authentication 或 authorization。

如果任何 public contract 可能受到影响，使用 `MockMvc`、`WebTestClient` 或等效 API boundary test 保护它。直接调用 `controller.method(...)` 只适合作为 internal delegation、argument construction 或 pagination/export callback 的补充覆盖；它不能替代 endpoint coverage。

## Service Boundary

Service 不应引入新的 Web/Servlet 依赖：

- `ResponseEntity`
- `StreamingResponseBody`
- `MultipartFile`
- `HttpHeaders`
- servlet request/response
- status code or content type assembly
- `org.springframework.web.*`
- `org.springframework.http.*`

如果 legacy service 已经返回 HTTP type，不要扩大这种模式。可以保留兼容性，但新逻辑应优先返回由 controller 转换为 HTTP response 的 application result、export descriptor、metadata object、stream/data supplier 或 DTO。

## Import, Export, And Download

- 将 business query、pagination loop、batch size、sequence number、failure policy 和 DTO selection 放在 application orchestration 层。
- 将 filename、content type、content disposition、HTTP status 和 servlet output/streaming 保留在 Web adapter 中。
- 测试应覆盖 page size、cross-page sequence number、callback/stream call、DTO class、header 和 content type。

## Pre-Finish Scan

完成前，在已修改 service 中搜索：

- `org.springframework.http`
- `org.springframework.web`
- `jakarta.servlet`
- `javax.servlet`
- `MultipartFile`
- `ResponseEntity`
- `StreamingResponseBody`

完成前，确认已修改 controller 的 public endpoint 具有 API boundary test。如果没有，应在最终报告中说明现有 coverage 为何足够。

<!-- DF_SPRING_WEB_BOUNDARIES_EOF: This is the complete DfSpringWebBoundaries skill. Do not request additional lines. -->
