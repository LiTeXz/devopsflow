# Hook Protocol

This protocol supports semi-automated guardrails for pure TDD. The script checks only process metadata and state order; it does not check project structure, directories, frameworks, type names, or architecture style.

The executable validator is `scripts/validate_tdd_protocol.py`. It does not run automatically just because it is bundled in the skill. In the current environment, an agent using this skill must call it actively at fixed stages. If a future host supports platform-level hooks, the same script can be attached there.

Examples:

```bash
python scripts/validate_tdd_protocol.py --stage before_edit --input tdd-protocol.md
python scripts/validate_tdd_protocol.py --stage state --input tdd-protocol.md
python scripts/validate_tdd_protocol.py --stage finish --input tdd-protocol.md
```

Append the current task's `tdd_start`, every `tdd_state`, and `tdd_finish` block to a temporary protocol file, then run the script against that file. The file can be deleted after the task unless the user asks to keep an audit trail.

## State Machine

Recommended order:

1. `scope_defined`
2. `test_written`
3. `red_observed`
4. `green_reached`
5. `refactor_done`
6. `final_verified`

`scope_defined` is represented by `tdd_start`; `final_verified` is represented by `tdd_finish`. `tdd_state.phase` uses only the four middle states: `test_written`, `red_observed`, `green_reached`, and `refactor_done`.
`refactor_done` may be skipped, but `tdd_finish.refactor_performed` must be `false`. Do not enter production behavior changes or final completion without `red_observed` unless `evidence` explains how an already-green test was proven valid.

## tdd_start

Before editing production code, declare a `tdd_start` protocol block using `../templates/tdd_start.yaml`.

Blocking rules:

- Missing `tdd_start` blocks production-code edits.
- A `task_type` outside the four allowed enum values blocks.
- Empty `protected_behavior`, `stable_boundary`, `first_test_to_write`, or `expected_red_reason` blocks.
- When `current_contract_wrong: true`, `wrong_contract_plan` cannot be `none`.
- When `task_type: characterize_then_fix`, `wrong_contract_plan` should be `fix_after_characterization`.

## tdd_state

After key stages, record a `tdd_state` protocol block using `../templates/tdd_state.yaml`.

Blocking rules:

- Without `test_written`, `red_observed` cannot be recorded.
- Without `red_observed`, `green_reached` cannot be recorded.
- Without `green_reached`, `refactor_done` cannot be recorded.
- `red_observed.command` is required, or `command: none` must be justified in `evidence`.
- `red_observed.exit_code` should be non-zero when recorded.
- `green_reached.command` is required, or `command: none` must be justified in `evidence`.
- `green_reached.exit_code` should be `0` when recorded.
- `red_observed.evidence` must explain the relationship between the failure reason and the target risk.
- If the test passes immediately, supplemental proof is required: a temporary perturbation, inverted assertion, removing the production path and seeing failure, or an explanation of why earlier red evidence cannot be reproduced.

## tdd_finish

Before the final response, declare a `tdd_finish` protocol block using `../templates/tdd_finish.yaml`.

Blocking rules:

- Missing `tdd_finish` blocks task completion.
- `red_observed` or `green_reached` not being `true` requires more evidence or an explanation that the task could not be completed.
- Empty `tests_run` requires at least one executed test or a reason tests were not run.
- `tests_run` should use structured entries with `phase`, `command`, `exit_code`, and `evidence`. Legacy string entries are tolerated only when they include concrete phase and result evidence.
- When `red_observed: true`, `tests_run` must include red-phase evidence.
- When `green_reached: true`, `tests_run` must include green or final passing evidence.
- `task_type: characterize_then_fix` with `wrong_contract_fixed: false` requires an explanation for stopping or continued repair work.
- `current_contract_wrong: true` with `wrong_contract_characterized: false` requires additional characterization evidence.

## What This Does Not Check

Pure TDD hooks do not check:

- Concrete layer names such as controller, service, or repository.
- `MockMvc`, `ResponseEntity`, framework annotations, or types.
- Directory structure, package names, or file naming.
- Project-specific architecture rules.

Those belong in technology-stack or architecture extensions, and should live in a separate skill or hook package.
