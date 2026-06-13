# Eval Cases

Use these cases to iterate `tdd-skill`. When real use reveals a new way agents bypass TDD, vague evidence, or pick the wrong test layer, add a case here.

## Case 1: Production Code First

User request:

> Refactor order total calculation while preserving behavior.

Failure behavior:

- The agent edits production code first.
- Characterization tests are added only afterward.
- `tdd_start` does not appear before production-code edits.

Expected guardrail:

- `before_edit` fails because `tdd_start` is missing.
- `tdd_start.first_test_to_write` names the characterization test that must be written first.
- The final report states RED/GREEN evidence; if the flow was already violated, it states compensating tests and remaining risk.

## Case 2: Vague RED Evidence

User request:

> Fix the default sorting bug in paginated listing.

Failure behavior:

```yaml
tdd_state:
  phase: red_observed
  evidence: "the test failed as expected"
```

Expected guardrail:

- Require command, exit code, test name, and failure reason.
- RED evidence explains how the failure relates to the default-sort risk.

## Case 3: Pure Refactor Changes Public Behavior

User request:

> Refactor the user query service without changing API behavior.

Failure behavior:

- The agent changes empty-query behavior from returning an empty list to throwing an error.
- Characterization tests cover only the happy path.

Expected guardrail:

- `protected_behavior` or completion criteria name public contracts, error semantics, and defaults as non-changing behavior.
- Characterization tests cover caller-dependent awkward edge cases.

## Case 4: Test Layer Too Narrow

User request:

> Fix export job data loss across multiple pages.

Failure behavior:

- Only a unit test mocks the first page.
- No assertion covers pagination sequence, termination condition, or batch size.

Expected guardrail:

- `stable_boundary` marks orchestration or persistence boundary risk.
- The test captures the full pagination sequence.
- If a narrow test cannot cover the boundary risk, widen to component, persistence, or integration tests.

## Case 5: Wrong Contract Named As Desired Contract

User request:

> This legacy API currently returns 500 incorrectly; refactor first, then fix it.

Failure behavior:

- The agent names the 500 response as expected behavior.
- `current_contract_wrong` remains `false`.

Expected guardrail:

- `current_contract_wrong: true`.
- `wrong_contract_plan: fix_after_characterization`.
- Characterization test marks legacy behavior as compatibility-only, then a desired-behavior test drives the fix.

## Case 6: Greenfield Implementation First

User request:

> Build a new price calculator from scratch.

Failure behavior:

- The agent creates production classes, routes, or abstractions before any executable behavior test exists.
- The first test is written after implementation and passes immediately.
- `task_type` is not `greenfield_feature`.

Expected guardrail:

- `tdd_start.task_type: greenfield_feature`.
- `first_test_to_write` names the first desired-behavior test.
- RED evidence may be a missing symbol, route, command, or module only when it is the intended observable boundary.
- GREEN evidence proves the same behavior slice passes after the smallest production implementation.
