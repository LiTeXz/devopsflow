---
name: df-tdd-skill
description: "Pure TDD workflow for greenfield feature development, bug fixes, behavior-preserving refactors, characterization tests, and characterize-then-fix work. Use when Codex needs test-first discipline to build new behavior from scratch or change existing code without drifting behavior. Applies across languages and architectures. Do not use for technology-specific layering rules, documentation-only edits, trivial formatting-only changes, or purely exploratory prototypes where no executable behavior is expected."
---

# TDD Skill

Use a project-agnostic TDD cadence to build or change behavior: define the next observable behavior first, make it fail, make it pass, and refactor only after green.

## Protocol

Before editing production code, emit a `tdd_start` protocol block using `templates/tdd_start.yaml` so the process is checkable.

Whenever an important state is observed, record a `tdd_state` protocol block using `templates/tdd_state.yaml`.

Before finishing, emit a `tdd_finish` protocol block using `templates/tdd_finish.yaml`.

These blocks are process metadata for semi-automated guardrails. Do not put project structure or technology-stack rules in them. See `references/hook-protocol.md` for the full protocol.
Evidence fields must record concrete commands, exit codes, test names, and failure/pass summaries. Do not use vague evidence such as "the test failed" or "the test passed."

This skill cannot register platform-level automatic hooks. When using it, actively run `bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts` at fixed stages:

- Append the current task's protocol blocks to a temporary workspace file, such as `.codex/tdd-protocol.md`, or to `tdd-protocol.md` in the system temp directory.
- Before production-code edits: emit `tdd_start`, then run `--stage before_edit`. If validation fails, complete the declaration before editing production code.
- After observing RED/GREEN/REFACTOR states: emit `tdd_state`, then run `--stage state`. If validation fails, add the command, exit code, test name, risk-specific evidence, or return to the correct stage.
- Before the final response: emit `tdd_finish`, then run `--stage finish`. If validation fails, continue adding evidence, testing, or correcting the workflow.

## Core Loop

1. Define one minimal behavior slice.
2. State the stable boundary: public contract, transport boundary, orchestration logic, core logic, persistence boundary, external side effect, or another observable interface.
3. Classify the task as `greenfield_feature`, `bug_fix`, `pure_refactor`, or `characterize_then_fix`.
4. Write the test first: use a desired-behavior test for greenfield features, a reproducing test for bug fixes, or a characterization test for pure refactors.
5. Observe RED first: record the failing command, exit code, test name, and the relationship between the failure and the target risk.
   - If the test fails for the target risk, continue.
   - If the test errors because the test itself is broken, fix the test until it fails for the target risk.
   - If the test passes immediately, stop and prove it can fail for the target risk before editing production code.
6. Make the smallest production change needed to reach GREEN.
7. Refactor after green; do not do structural cleanup while red.
8. Run the smallest relevant tests after every meaningful step.
9. Repeat in small slices until the target behavior and design change are complete.

## Violation Recovery

When the flow is violated, recover before continuing instead of rationalizing the deviation:

- If production code was added or changed before a meaningful failing test, stop and remove or set aside that production change, then write the failing test first.
- If tests were added after the implementation, do not count that as TDD evidence. Recreate a RED signal by reverting or disabling the implementation path enough to prove the test protects the target risk.
- If a RED state cannot be observed because the behavior already exists, prove the test can fail with a temporary mutation, then restore the code before proceeding.
- If the user explicitly asks to keep a non-TDD path, report the deviation, compensating tests, and remaining risk in the final response.

## Greenfield Feature Development

For new development, define the first externally observable behavior before creating production implementation:

- State the first behavior in business, user, or public-contract terms.
- Choose the first stable boundary: public API, CLI command, UI interaction, domain service, pure function, persistence contract, or integration boundary.
- Write the failing test before creating the implementation.
- A RED state may fail because a symbol, route, class, command, or module does not exist yet; this is valid only when the missing element is exactly the boundary required by the behavior slice.
- Add only the production code needed to make the current test pass.
- Delay broad infrastructure, abstractions, and cleanup until a green test creates real pressure for them.
- Repeat with the next smallest behavior slice.

## Non-Negotiable Rules

- Do not add or change production behavior without a failing test that supports the desired observable behavior.
- For greenfield work, do not create broad infrastructure before the first failing behavior test unless the project cannot run tests without minimal setup.
- Do not accept "too small to test", "I will add tests later", "manual verification is enough", or "this is only plumbing" as reasons to skip RED.
- Do not name an incorrect current contract as the desired contract. When current behavior is wrong, explicitly choose either "characterize compatibility only" or "characterize, then continue fixing."
- For pure refactors, do not casually change public contracts, defaults, error semantics, ordering, pagination, transaction/consistency boundaries, security rules, persistence results, or external side effects.
- Assert observable behavior, not only implementation details or "no exception."
- Choose the narrowest test layer that truly protects the risk. Widen the test when a narrow test cannot cover a boundary risk.
- Refactor only after green. The same relevant test set should still pass after refactoring.
- Do not disguise architecture or technology-stack rules as TDD itself. Use the relevant technology-stack skill when a framework boundary matters.
- Treat `tdd_start`, `tdd_state`, and `tdd_finish` as the only stable validation interface. The semi-automated script should not infer project directories or framework types.
- Do not satisfy the protocol with vague evidence. RED evidence must show the target test failed for the target risk; GREEN evidence must show the same risk is protected after the minimal production change.

## Pre-Edit Check

Before the first production-code edit, write down:

- What behavior is being protected?
- What is the stable boundary?
- Is the task type `greenfield_feature`, `bug_fix`, `pure_refactor`, or `characterize_then_fix`?
- Which test will go red first? Why is that red meaningful?
- Which kind of boundary does this change touch: public contract, transport, orchestration, core logic, persistence, external system, or side effect?
- Which behaviors must not change?
- For greenfield work, what is the smallest useful behavior that can be observed through the boundary?
- If current behavior is wrong, is this task preserving compatibility or continuing to a fix?

If the answers are unclear, keep reading code or add tests before changing production code.

## Choosing Test Layers

Choose the test layer by risk, not by filename or technology preference:

- Core rules, calculations, state transitions, pure functions, value objects: unit tests.
- Orchestration logic, collaborator call order, batch processing, continue/stop-on-failure policy: component or orchestration-level tests.
- Public transport boundaries, request/response contracts, serialization, validation, authentication and authorization: boundary or contract tests.
- Persistence queries, ordering, pagination, constraints, transaction-sensitive behavior: persistence or integration tests.
- Cross-layer collaboration as the risk itself: a small number of end-to-end or system tests.
- Dependency direction or layering rules as the risk: architecture tests or static checks.

Treat environment-backed validation as part of the same TDD and verification continuum, not as work outside development:

- Use integration tests when the risk depends on real services, data stores, protocols, transactions, or toolchain behavior.
- Use property tests when invariants must hold across a generated input space rather than a few examples.
- Use canary tests when release behavior must be observed in a controlled environment before broader exposure.
- Turn production incident investigation into a reproducing test with sanitized inputs, observable evidence, and a regression assertion before fixing the defect.
- Keep unit tests, functional tests, integration tests, property tests, canary tests, and incident-reproduction tests connected by the same risk and behavior traceability.
- Record required services, fixtures, environment assumptions, commands, and observations. If an environment is unavailable, report the unverified layer and remaining risk instead of reclassifying it as unnecessary.

See `references/test-slices.md` for more detail.

## Characterization Tests

Before changing behavior-preserving code, capture the current behavior:

- Cover the happy path and awkward edge cases callers may depend on.
- Assert return values, error semantics, important parameters, persistence changes, and external side effects.
- For pagination, batching, import/export, callbacks, and repeated queries, capture the full sequence instead of only the first call.
- Assert exception types and meaningful messages or error codes.
- Keep test data small, readable, and named by business meaning.

See `references/characterization-tests.md` for the full rules.

## When Testing Feels Hard

Treat difficult tests as design feedback before widening the implementation:

- If setup is huge, look for an unstable boundary, hidden dependency, or missing seam at the public contract.
- If mocks are complex, reconsider whether the behavior belongs in a narrower core unit, a component test, or a real integration slice.
- If assertions are vague, write the desired assertion first and shape the test data around the behavior.
- If the first test would require broad infrastructure, choose a smaller observable behavior or a more stable boundary.

## Completion Criteria

- Each new or changed key test has gone RED and then GREEN after the production change.
- For greenfield work, each implemented behavior slice has gone RED before production implementation and GREEN after the smallest change.
- Moved responsibilities still have behavior-test protection at their new owner.
- There are no accidental behavior changes, especially in contracts, defaults, error semantics, ordering, pagination, consistency, security, persistence results, and side effects.
- The smallest relevant tests pass; broader checks have been run or explicitly called out as not run.
- Any deviation from the TDD flow is explicitly reported with the reason, compensating tests, and remaining risk.
- Final user-facing reports must be in Chinese and include protected behavior, test layer, design change, changed files, command results, and remaining risk.

## On-Demand References

- `references/test-slices.md`: choose test layers by risk.
- `references/hook-protocol.md`: fields, states, and blocking rules for the semi-automated TDD guardrail script.
- `references/characterization-tests.md`: how to write characterization tests for complex existing behavior.
- `references/checklists.md`: pre-edit, pre-finish, test-quality, and boundary-smell checks.
- `references/eval-cases.md`: failure samples and expected guardrail behavior for iterating this skill.
- `references/anti-patterns.md`: common TDD failure modes to reject or correct when iterating this skill.
- `templates/tdd_start.yaml`, `templates/tdd_state.yaml`, `templates/tdd_finish.yaml`: protocol block templates to load as needed.
- `scripts/validate-tdd-protocol.ts`: protocol validation script to run at fixed stages with `bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts`.
- `scripts/run-protocol-examples.test.ts`: lightweight regression suite to run with `bun test skills/df-tdd-skill/scripts/run-protocol-examples.test.ts`; it checks valid examples pass and common violations fail.

## Commit Message

When committing, follow the repository's existing format. If there is no stricter rule, use Conventional Commits with a Chinese summary:

- `feat: 新增工单创建服务`
- `refactor: 重构测试执行记录查询逻辑`
- `test: 补充工单创建服务单元测试`
- `fix: 修复权限绑定空列表处理`
- `chore: 调整测试数据构造方式`
