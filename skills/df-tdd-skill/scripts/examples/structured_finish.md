```yaml
tdd_start:
  task_type: pure_refactor
  protected_behavior: "list returns items in existing sort order"
  stable_boundary: "public query contract"
  first_test_to_write: "list_givenExistingItems_shouldKeepSortOrder"
  expected_red_reason: "fails when the existing sort path is removed"
  current_contract_wrong: false
  wrong_contract_plan: none
```

```yaml
tdd_state:
  phase: test_written
  command: "none"
  exit_code: null
  evidence: "Added list_givenExistingItems_shouldKeepSortOrder"
```

```yaml
tdd_state:
  phase: red_observed
  command: "bun test tests/list.test.ts -t keeps-existing-sort-order"
  exit_code: 1
  evidence: "test_list_given_existing_items_should_keep_sort_order failed because the sort-order path was removed"
```

```yaml
tdd_state:
  phase: green_reached
  command: "bun test tests/list.test.ts -t keeps-existing-sort-order"
  exit_code: 0
  evidence: "same targeted test passed after restoring the sort-order behavior"
```

```yaml
tdd_finish:
  task_type: pure_refactor
  red_observed: true
  green_reached: true
  refactor_performed: true
  tests_run:
    - phase: red
      command: "bun test tests/list.test.ts -t keeps-existing-sort-order"
      exit_code: 1
      evidence: "failed for expected sort-order reason"
    - phase: green
      command: "bun test tests/list.test.ts -t keeps-existing-sort-order"
      exit_code: 0
      evidence: "passed after minimal production change"
  current_contract_wrong: false
  wrong_contract_characterized: false
  wrong_contract_fixed: false
  residual_risk: "none"
```
