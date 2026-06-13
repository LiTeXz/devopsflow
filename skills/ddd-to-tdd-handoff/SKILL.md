---
name: ddd-to-tdd-handoff
description: "Convert confirmed DDD event-storming outputs and requirement traceability into executable, language-agnostic TDD implementation slices. Use after ddd-event-storming-design has produced confirmed requirements, commands, events, aggregates, policies, invariants, read models, or relationships and Codex needs tests, implementation planning, or development sequencing."
---

# DDD To TDD Handoff

Use this skill to bridge domain design into test-first development. It does not replace DDD modeling or TDD execution.

## Inputs

Read the confirmed DDD artifacts available in chat or in `event-storming/`:

- requirements intake and requirement IDs when present
- problem boundary and glossary
- domain events
- commands and actors
- policies and process managers
- aggregates, state, rules, and invariants
- read models and projection events
- relationships and external systems
- unresolved assumptions

If the DDD design is not confirmed, do not create implementation slices. Return to `ddd-event-storming-design` for confirmation.

## Mapping Rules

- Requirement item -> traceability anchor and acceptance intent for one or more slices.
- Domain event -> expected observable behavior test.
- Command -> application service, use case, or aggregate command-handler test.
- Aggregate invariant -> domain unit test.
- Policy -> event-to-command orchestration test.
- Process manager -> stateful workflow test with waiting, resumption, and idempotency cases.
- Read model -> projection or query test.
- External system -> contract, adapter, or integration seam test.
- Relationship dependency -> precondition, prior fact, or state setup in tests.
- Failure event with business meaning -> explicit behavior slice; technical failure -> adapter or infrastructure slice.
- Stakeholder/actor authority -> authorization or capability assumption to preserve in tests or planning, without choosing a framework.
- Trigger/follow-up row -> policy, process manager, projection, integration, or explicit non-domain concern.

Choose the narrowest test layer that protects the risk. Widen only when the behavior cannot be observed at a narrower boundary.

Do not introduce language, framework, package, HTTP, database, or UI structure unless the user asks or existing repository conventions are already part of the implementation planning step. This handoff may name generic boundaries such as domain model, application command, query/projection, process manager, port/adapter, and contract test.

## Handoff Workflow

1. List the DDD inputs being used.
2. List requirement traceability coverage when requirement IDs exist.
3. Identify implementation boundaries without inventing framework structure.
4. Create small TDD slices in business order.
5. For each slice, name:
   - requirement ID(s) when available
   - behavior
   - source DDD artifact
   - test layer
   - first RED expectation
   - minimal GREEN implementation boundary
   - protected invariant or read model outcome
   - dependencies and unresolved facts
6. Mark slices that need a technology-specific boundary skill only when the later implementation stack is known.
7. Pass the slices to `implementation-planning` or `tdd-skill`.

## Output Format

```markdown
# DDD to TDD Handoff

## 使用的 DDD 结论

## 需求追踪

## 实现边界

## TDD 切片

### Slice 1: <behavior>
- 需求ID：
- DDD 来源：
- 测试层：
- 预期 RED：
- 最小 GREEN：
- 保护的规则/读模型：
- 不应改变：
- 依赖/未决事实：

## 建议执行顺序

## 需要额外 skill
```

## Non-Negotiable Rules

- Do not write production code.
- Do not create tests directly unless the user explicitly asks to start implementation.
- Do not turn HTTP endpoints, database tables, DTOs, or pages into domain commands.
- Do not introduce framework-specific implementation rules in this generic handoff.
- Do not hide aggregate invariants inside policies or application services.
- Do not invent a read model that cannot be projected from events without calling out the gap.
- Do not drop requirement IDs or confirmed requirement coverage when they exist.
- Do not proceed when a slice depends on an unconfirmed business conclusion that could change the model.

See `references/mapping-examples.md` for compact examples.
