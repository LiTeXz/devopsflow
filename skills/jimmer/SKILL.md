---
name: jimmer
description: "General Jimmer ORM workflow and language router. Use when Codex changes Jimmer entities, compile-time generated sources, SQL DSL queries, fetchers, DTO language files, graph saves, repositories, Spring Boot integration, or persistence tests in JVM projects. Continue with jimmer-kotlin for Kotlin-first Jimmer projects and jimmer-java for Java-first Jimmer projects."
---

# Jimmer

Use this skill for cross-language Jimmer ORM work. Treat Jimmer as a compile-time JVM ORM built around immutable entity models, generated code, type-safe SQL DSL, DTO language files, arbitrary-shape graph queries, and graph saves.

## Language Routing

- Use `$jimmer-kotlin` when changing Kotlin source sets, KSP, `jimmer-sql-kotlin`, Kotlin DSL, or `KSqlClient`.
- Use `$jimmer-java` when changing Java source sets, APT, Maven/Gradle annotation processing, Java DSL, or `JSqlClient`.
- In mixed JVM projects, choose the language-specific skill that matches the main Jimmer entity, DTO, repository, and SQL-client code.
- For cross-language design, review, or generated-source troubleshooting, start here and then switch to the relevant language skill for concrete files.

## Core Boundaries

- Treat Jimmer as a compile-time framework: entity, DTO, table object/class, and fetcher changes must refresh generated sources.
- Do not turn Jimmer entities into JPA entities. Avoid mutable persistence setters, no-arg mutable entity classes, `EntityManager` workflows, lazy-proxy assumptions, and JPA cascade rules as the primary model.
- Prefer the project's existing Jimmer version, build plugins, and generated-source layout. Do not hard-code or upgrade versions unless the task requires it.
- Make query shape and save shape explicit. Jimmer supports arbitrary graph shapes; avoid loading complete object graphs just to update a few fields.

## Pre-Change Checks

1. Inspect build files to identify the language, Jimmer dependencies, KSP/APT setup, and Spring Boot integration.
2. Search existing entities, DTOs, repositories, SQL clients, fetchers, and tests to learn local naming and layering.
3. Locate generated-source usage before guessing table object or table class names.
4. Classify the change: entity mapping, query DSL, DTO language, graph save, cache, Spring repository, OpenAPI/TypeScript generation, or persistence tests.

## Implementation Guardrails

- Entity: preserve Jimmer semantics such as `@Entity`, `@Table`, `@Id`, associations, computed properties, and logical deletion.
- Query: express dynamic conditions, joins, ordering, pagination, and projections in the type-safe DSL; use native SQL only when the local pattern or database feature requires it.
- Fetcher/DTO: use fetchers or DTOs to control returned graph shape instead of returning overly broad entity graphs.
- Save: express persistence intent with incomplete objects or DTOs so Jimmer handles graph saves, upserts, and batch DML.
- Spring: keep HTTP/controller, service, and repository/persistence-adapter boundaries clear. Do not scatter SQL DSL code into unrelated layers.

## Verification

- After entity, DTO, or mapping changes, run the smallest compile task that triggers KSP or APT.
- After query or save changes, run or add repository/SQL-client tests covering filters, ordering, pagination, association shape, graph saves, and constraint behavior.
- After Spring integration changes, run the relevant slice or integration tests for bean wiring, transactions, and repository behavior.
- Before finishing, search new code for JPA-only APIs such as `EntityManager`, mutable entity setters, or `jakarta.persistence` usage that does not match local conventions.

## Official Sources

- Jimmer repository: https://github.com/babyfish-ct/jimmer
- Jimmer documentation: https://babyfish-ct.github.io/jimmer-doc/
