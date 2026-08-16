```jsonl
{"tdd_start":{"task_type":"greenfield_feature","protected_behavior":"新的价格计算器返回单个条目的小计。","stable_boundary":"核心逻辑函数 calculate_subtotal(quantity, unit_price)。","first_test_to_write":"test_calculate_subtotal_multiplies_quantity_by_unit_price","expected_red_reason":"calculate_subtotal 函数尚不存在，因此期望边界应在实现前失败。","current_contract_wrong":false,"wrong_contract_plan":"none"}}
```

```jsonl
{"tdd_state":{"phase":"test_written","command":"bun test tests/price-calculator.test.ts -t multiplies-quantity-by-unit-price","exit_code":null,"evidence":"在生产实现存在前，已针对新的核心边界编写测试。"}}
```

```jsonl
{"tdd_state":{"phase":"red_observed","command":"bun test tests/price-calculator.test.ts -t multiplies-quantity-by-unit-price","exit_code":1,"evidence":"RED：由于缺少 calculate_subtotal，导入失败；这是新行为边界的预期失败。"}}
```

```jsonl
{"tdd_boundary_scan":{"trigger_test":"test_calculate_subtotal_multiplies_quantity_by_unit_price","stable_boundary":"核心逻辑函数 calculate_subtotal(quantity, unit_price)","dimensions_considered":["input_partition","invariant","representation"],"candidates":[{"dimension":"input_partition","counterexample":"quantity 为零","risk":"错误产生非零小计","disposition":"current_slice","test_layer":"unit","rationale":"属于相同乘法边界"},{"dimension":"representation","counterexample":"unit_price 包含小数精度","risk":"金额精度丢失","disposition":"next_slice","test_layer":"property","rationale":"需要独立定义金额精度契约"}]}}
```

```jsonl
{"tdd_state":{"phase":"green_reached","command":"bun test tests/price-calculator.test.ts -t multiplies-quantity-by-unit-price","exit_code":0,"evidence":"GREEN：添加最小 calculate_subtotal 实现后，新的小计行为通过。"}}
```

```jsonl
{"tdd_finish":{"task_type":"greenfield_feature","red_observed":true,"green_reached":true,"refactor_performed":false,"tests_run":[{"phase":"red","command":"bun test tests/price-calculator.test.ts -t multiplies-quantity-by-unit-price","exit_code":1,"evidence":"RED 导入失败证明新的生产边界在实现前不存在。"},{"phase":"green","command":"bun test tests/price-calculator.test.ts -t multiplies-quantity-by-unit-price","exit_code":0,"evidence":"GREEN 通过的测试保护新的小计行为。"}],"current_contract_wrong":false,"wrong_contract_characterized":false,"wrong_contract_fixed":false,"residual_risk":"仅覆盖第一个全新行为切片；折扣和税费尚未实现。"}}
```
