---
name: jimmer-java
description: "Java-specific Jimmer ORM guardrails. Use when Codex changes Java Jimmer SQL entities, APT/Maven/Gradle annotation processing, Spring Boot integration, generated table-class queries, fetchers, DTO language files, graph saves, repositories, or persistence tests. Use this for Java source sets and Java-first mixed JVM projects; use jimmer-kotlin for Kotlin source sets."
---

# Jimmer Java

Use this skill when working on Java code that uses Jimmer SQL. Treat Jimmer as a compile-time ORM built around immutable entity interfaces, APT-generated code, Java DSL, and type-safe queries. Do not handle it like JPA with mutable POJOs.

## Pre-Change Checks

- Inspect the existing build before changing dependencies. Prefer the project's current Jimmer version and annotation-processing setup.
- In Gradle or Maven Java projects, expect `jimmer-sql` plus annotation processor wiring rather than Kotlin KSP.
- Locate the generated-source directory and existing table-class naming before writing queries. Do not invent generated type names.
- Identify whether the project uses Spring Boot auto-configuration, Jimmer repositories, direct `JSqlClient` injection, or a custom persistence adapter.

## Entity Rules

- Model Jimmer Java entities according to local convention, usually as immutable Java interfaces.
- Preserve Jimmer annotations and semantics such as `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, associations, computed properties, and logical deletion.
- Do not add JPA-only patterns for persistence: mutable no-arg entity classes, setter-based mutation workflows, `EntityManager`, lazy-proxy assumptions, or cascade rules.
- After changing entities, DTO files, or mappings, run the smallest build task that refreshes APT-generated sources.

## Query Rules

- Prefer the Java DSL and generated table classes for type-safe SQL. Keep dynamic predicates in the DSL instead of concatenating SQL strings.
- Use fetchers or DTO projections to define returned graph shape. Do not load broad entity graphs when callers need narrow results.
- Let Jimmer optimize joins, paginated count queries, and implicit subqueries where applicable. Do not manually reproduce generated behavior.
- When native SQL expressions are required, keep them local and preserve a clear typed boundary around them.
- Do not write Kotlin DSL forms in Java source sets. Follow Java examples and the local generated-class style.

## Save And DTO Rules

- For graph saves, construct the incomplete object graph the use case needs and let Jimmer save it. Do not pre-load full graphs just to change a few fields.
- When the project uses Jimmer DTO language, prefer input DTOs for complex saves and output DTOs for complex query responses.
- Treat DTO files as compile-time inputs. If only DTO files changed, run a full compile or the project's generated-source refresh command.
- Keep business validation in the business layer. Do not hide domain policy in generated DTO templates.

## Testing And Verification

- Cover queries, ordering, filtering, pagination, association shape, graph saves, and constraint behavior with repository or SQL-client tests.
- Assert observable results and SQL-sensitive behavior such as returned graph shape, total counts, ordering, and association presence.
- After entity or DTO changes, run targeted Java/JVM tests and a compile/APT task to confirm generated code refresh.
- Before finishing, search changed Java code for accidental `EntityManager`, mutable entity setters, or `jakarta.persistence` usage that does not match local convention.

## Official Sources

- Jimmer repository: https://github.com/babyfish-ct/jimmer
- Jimmer documentation: https://babyfish-ct.github.io/jimmer-doc/
