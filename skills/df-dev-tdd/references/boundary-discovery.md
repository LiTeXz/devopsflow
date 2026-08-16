# Boundary Discovery

在 meaningful RED after and edit 生产行为 before, run 2 至 5 分钟 Boundary Discovery Burst. 目标是扩大已知风险空间, 不是扩大当前 implementation slice.

## Workflow

1. 固定 trigger test and stable boundary.
2. 对相关维度提出最小 counterexample.
3. 说明 each counterexample 会造成的 observable risk.
4. 选择真正保护该 risk 的最窄 test layer.
5. 将 candidate category 为 `current_slice`,`next_slice` or `deferred`.
6. append `tdd_boundary_scan`, then run protocol validator.

`current_slice` 最多 1 个. only when candidate 直接挑战当前 RED 的同一行为时选择它. 其他可执行 candidate 进入 `next_slice`, 在当前 GREEN after 逐个转为新 RED. 暂不 execution 的 candidate 使用 `deferred` and write 明 rationale and residual risk.

## Discovery Dimensions

- `input_partition`: null, empty, zero, minimum, maximum, just inside/outside, duplicate and malformed input.
- `state_sequence`: first, repeated, reordered, retried, interrupted, resumed and partially completed operation.
- `external_failure`: timeout, unavailable dependency, malformed response, partial success, rollback and compensation.
- `time_concurrency`: expiry, clock boundary, race, duplicate submission, idempotency and lost update.
- `invariant`: ordering, conservation, monotonicity, uniqueness, authorization, tenant isolation and consistency.
- `representation`: serialization, encoding, precision, timezone, pagination, locale and protocol version.

Domain-specific dimensions are allowed, but name them concretely. 不要机械填满全部维度; only record dimensions that can affect the stable boundary.

## Test Techniques

- 使用 Boundary Value Analysis and Equivalence Partitioning 覆盖 input range.
- 使用 Decision Tables 覆盖相互作用的 condition and policy combination.
- 使用 State Transition Testing 覆盖 lifecycle and retry sequence.
- Property-Based Testing for invariants across generated inputs.
- 当准确 output 可变但 relation 必须保持时, 使用 Metamorphic Testing.
- 使用 Failure Injection 覆盖 dependency, transaction and partial-success behavior.

## Guardrails

- 不要一次 write all candidate tests and use one broad implementation make all passed.
- 不要把 speculative architecture, future product work or unrelated cleanup 伪装成 boundary candidate.
- 不要仅列名词; each candidate must include concrete counterexample and observable risk.
- if scan 改变 expected behavior, update tests, 并在 edit 生产行为前重新观察 meaningful RED.
- if 没有 candidate, 记录具体 `none_found_reason`; 泛泛的 "none" or "not applicable" 不足以形成证据.
