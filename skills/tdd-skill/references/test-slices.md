# Test Slices

Choose the narrowest test layer that truly protects the risk. If a narrow test cannot cover the real risk, widen immediately.

## Unit Tests

Use for local behavior:

- Pure functions, calculations, and state transitions.
- Core rules, value objects, mappers, parsers, and formatters.
- Branches and error handling inside a single module.

Assert observable results. Use mocks only for collaborators that this slice does not validate. Assert important parameters exactly or capture them with a captor; do not hide them behind broad matchers.

## Component Or Orchestration Tests

Use for collaboration behavior:

- Call order and parameters across multiple collaborators.
- Batching, retries, and continue/stop-on-failure policy.
- Application flows near transaction or consistency boundaries.
- Flow policies for imports, exports, synchronization, scheduled jobs, and similar processes.

Tests should prove orchestration rules, not restate implementation steps.

## Boundary Or Contract Tests

Use for public boundary risks:

- Public APIs, CLIs, messages, file formats, RPC, HTTP, UI events, or other transport boundaries.
- Parameter binding, defaults, validation, serialization, error responses, authentication, and authorization.
- Compatibility requirements and response shapes callers depend on.

Directly calling internal methods usually cannot replace public boundary tests unless the risk is truly only internal delegation.

## Persistence Or Integration Tests

Use for real external-system behavior:

- Query filters, joins, projections, and aggregate shape.
- Ordering, pagination, unique constraints, and migration impact.
- Transaction commit/rollback, consistency, concurrency, or external-resource interactions.

When a database, queue, filesystem, or third-party system is part of the behavior, do not mock away its core value.

## End-To-End Or System Tests

Use only when cross-layer collaboration itself is the risk. These tests add confidence and should not replace narrower behavior tests.

## Architecture Or Static Checks

Use when dependency direction, layering rules, package boundaries, forbidden dependencies, or module contracts are the risk. These checks are architecture constraints, not core TDD, but they can work with the TDD flow.
