```yaml
tdd_start:
  task_type: greenfield_feature
  protected_behavior: "A new price calculator returns the subtotal for a single line item."
  stable_boundary: "Core logic function calculate_subtotal(quantity, unit_price)."
  first_test_to_write: "test_calculate_subtotal_multiplies_quantity_by_unit_price"
  expected_red_reason: "The calculate_subtotal function does not exist yet, so the desired boundary should fail before implementation."
  current_contract_wrong: false
  wrong_contract_plan: none
```

```yaml
tdd_state:
  phase: test_written
  command: "pytest tests/test_price_calculator.py::test_calculate_subtotal_multiplies_quantity_by_unit_price"
  exit_code: null
  evidence: "Test written against the new core boundary before production implementation exists."
```

```yaml
tdd_state:
  phase: red_observed
  command: "pytest tests/test_price_calculator.py::test_calculate_subtotal_multiplies_quantity_by_unit_price"
  exit_code: 1
  evidence: "RED: import failed because calculate_subtotal is missing, which is the expected failure for the new behavior boundary."
```

```yaml
tdd_state:
  phase: green_reached
  command: "pytest tests/test_price_calculator.py::test_calculate_subtotal_multiplies_quantity_by_unit_price"
  exit_code: 0
  evidence: "GREEN: the new subtotal behavior passes after adding the smallest calculate_subtotal implementation."
```

```yaml
tdd_finish:
  task_type: greenfield_feature
  red_observed: true
  green_reached: true
  refactor_performed: false
  tests_run:
    - phase: red
      command: "pytest tests/test_price_calculator.py::test_calculate_subtotal_multiplies_quantity_by_unit_price"
      exit_code: 1
      evidence: "RED import failure proved the new production boundary did not exist before implementation."
    - phase: green
      command: "pytest tests/test_price_calculator.py::test_calculate_subtotal_multiplies_quantity_by_unit_price"
      exit_code: 0
      evidence: "GREEN passing test protects the new subtotal behavior."
  current_contract_wrong: false
  wrong_contract_characterized: false
  wrong_contract_fixed: false
  residual_risk: "Only the first greenfield behavior slice is covered; discounts and taxes are not implemented."
```
