```yaml
tdd_start:
  task_type: bug_fix
  protected_behavior: "pagination keeps default sort order"
  stable_boundary: "public query contract"
  first_test_to_write: "list_givenNoSort_shouldUseDefaultSort"
  expected_red_reason: "fails before the default sort fix"
  current_contract_wrong: true
  wrong_contract_plan: fix_after_characterization
```

```yaml
tdd_state:
  phase: test_written
  evidence: "Added list_givenNoSort_shouldUseDefaultSort"
```

```yaml
tdd_state:
  phase: red_observed
  evidence: "the test failed as expected"
```
