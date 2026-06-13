---
name: spring-web-boundaries
description: "Spring Web boundary guardrails for Java/Spring Boot refactors. Use when Codex changes controllers, REST endpoints, request/response mapping, validation, security, file upload/download, exports, or service/controller layering in Spring applications. This is an optional architecture and technology-stack companion to TDD skills; do not use as a generic TDD methodology skill."
---

# Spring Web Boundaries

Use this skill to protect the Spring Web adapter boundary. This is not TDD itself; it is a Spring layering and Web adapter constraint.

## Core Principles

- Controllers handle HTTP adaptation: mapping, binding, validation, status, headers, content type, multipart, servlet streaming, and security entry points.
- Application/service layers handle application orchestration: business flow, query construction, batching, import/export strategy, transaction strategy, callback order, events, and cache side effects.
- Domain layers handle core rules; repositories and query objects handle persistence details.
- Do not push HTTP semantics into core application logic unless the code is already an adapter by project convention.

## Controller Changes

When changing a controller or endpoint, first decide whether the change affects:

- HTTP method, path, query/form parameters, request body, or multipart parts.
- Defaults, binding, validation, or serialization.
- Status, content type, headers, or `Content-Disposition`.
- CSRF, authentication, or authorization.

If any public contract may be affected, protect it with `MockMvc`, `WebTestClient`, or an equivalent API boundary test. Directly calling `controller.method(...)` is suitable only as supplemental coverage for internal delegation, argument construction, or pagination/export callbacks; it does not replace endpoint coverage.

## Service Boundary

Services should not introduce new Web/Servlet dependencies:

- `ResponseEntity`
- `StreamingResponseBody`
- `MultipartFile`
- `HttpHeaders`
- servlet request/response
- status code or content type assembly
- `org.springframework.web.*`
- `org.springframework.http.*`

If a legacy service already returns HTTP types, do not expand that pattern. Compatibility can be preserved, but new logic should prefer application results, export descriptors, metadata objects, stream/data suppliers, or DTOs that controllers convert into HTTP responses.

## Import, Export, And Download

- Put business queries, pagination loops, batch sizes, sequence numbers, failure policy, and DTO selection in the application orchestration layer.
- Keep filenames, content type, content disposition, HTTP status, and servlet output/streaming in the Web adapter.
- Tests should cover page size, cross-page sequence numbers, callback/stream calls, DTO class, headers, and content type.

## Pre-Finish Scan

Before finishing, search modified services for:

- `org.springframework.http`
- `org.springframework.web`
- `jakarta.servlet`
- `javax.servlet`
- `MultipartFile`
- `ResponseEntity`
- `StreamingResponseBody`

Before finishing, confirm that modified controllers' public endpoints have API boundary tests. If they do not, explain in the final report why the existing coverage is sufficient.
