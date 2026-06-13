# TDD Anti-Patterns

- Implementation-first TDD cosplay: write production code first, then add tests that merely describe what was already built.
- Meaningless RED: accept a failing test caused by syntax, import, setup, or unrelated fixture errors instead of the target behavior.
- Accidental GREEN: write a test that passes immediately and continue implementing without proving the test can fail for the target risk.
- Mock-only confidence: assert only collaborator calls while missing observable behavior, state, return values, persistence, or side effects.
- Refactor while RED: perform structural cleanup while the behavior test is failing.
- Broad GREEN leap: make multiple behavior slices pass with a large implementation that was not driven by the current test.
- Manual verification substitution: use a quick manual check as a replacement for an executable test when a test is feasible.
- Characterization drift: call current behavior characterized while omitting edge cases that callers likely depend on.

## Weak Assertions

- Do not assert only "does not throw" unless the absence of a specific exception is the public behavior.
- Do not assert only that a collaborator was called when the behavior depends on the returned value, persisted state, emitted message, response shape, or side effect.
- Do not use broad matchers for important arguments. Capture or assert parameters that carry business meaning.
- Do not leave a test green when the production behavior can be removed without failing the test.

## Mock Smells

- Do not test the mock instead of the system behavior. A verification that merely repeats the setup is usually worthless.
- Do not mock collaborators whose real behavior is the risk being protected, such as serialization, validation, persistence constraints, transaction boundaries, ordering, pagination, retries, or external protocol shape.
- Do not use incomplete mock data when production code reads more fields than the test initializes. Build small but valid objects.
- Do not hide important collaborator arguments behind `any`, broad predicates, or default stubs.
- Do not add production-only hooks, setters, constructors, or visibility changes just to make mocking easier unless that is an intentional design improvement.

## Test Shape Smells

- Split a test whose name naturally needs "and" or "also" unless those outcomes are one indivisible behavior.
- Avoid tests that mirror private implementation steps. The test should survive internal refactoring that preserves the observable contract.
- Avoid checking only the first item, page, batch, callback, or retry when repeated behavior is part of the risk.
- Keep fixtures minimal and named by business meaning, not by incidental implementation details.

## Green Smells

- Do not add configuration, options, abstractions, caching, retries, pagination, or generalization that the current failing test does not require.
- Do not clean up unrelated structure while red. Reach green first, then refactor under passing tests.
- Do not widen the public contract just because it is convenient for the current implementation.
