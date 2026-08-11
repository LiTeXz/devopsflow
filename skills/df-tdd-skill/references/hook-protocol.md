# Hook Protocol

此 protocol 为纯 TDD 提供半自动护栏。脚本只检查流程元数据和状态顺序；不检查项目结构、目录、框架、类型名称或架构风格。

可执行 validator 是 [validate-tdd-protocol.ts](../scripts/validate-tdd-protocol.ts)。它不会仅因随 skill 一起分发就自动运行。在当前环境中，使用此 skill 的 agent 必须在固定阶段主动调用它。如果未来宿主支持平台级 hook，可以在那里挂接同一脚本。

示例：

```bash
bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts --stage before_edit --input .devopsflow/.tdd_checkpoints/<task-slug>.jsonl
bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts --stage state --input .devopsflow/.tdd_checkpoints/<task-slug>.jsonl
bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts --stage finish --input .devopsflow/.tdd_checkpoints/<task-slug>.jsonl
```

将当前任务的 `tdd_start`、每个 `tdd_state` 以及 `tdd_finish` blocks 追加到 protocol file，然后对该文件运行脚本。除非用户要求保留审计记录，否则任务完成后可以删除该文件。

## State Machine

推荐顺序：

1. `scope_defined`
2. `test_written`
3. `red_observed`
4. `green_reached`
5. `refactor_done`
6. `final_verified`

`scope_defined` 由 `tdd_start` 表示；`final_verified` 由 `tdd_finish` 表示。`tdd_state.phase` 只使用中间四种状态：`test_written`、`red_observed`、`green_reached` 和 `refactor_done`。
可以跳过 `refactor_done`，但 `tdd_finish.refactor_performed` 必须为 `false`。除非 `evidence` 说明如何证明一个已经 GREEN 的测试有效，否则在没有 `red_observed` 时，不得进入生产行为修改或最终完成阶段。

## tdd_start

编辑生产代码前，使用 [tdd_start.jsonl](../templates/tdd_start.jsonl) 声明 `tdd_start` protocol block。

阻断规则：

- 缺少 `tdd_start` 时阻断生产代码编辑。
- `task_type` 不属于四个允许的枚举值时阻断。
- `protected_behavior`、`stable_boundary`、`first_test_to_write` 或 `expected_red_reason` 为空时阻断。
- 当 `current_contract_wrong: true` 时，`wrong_contract_plan` 不能为 `none`。
- 当 `task_type: characterize_then_fix` 时，`wrong_contract_plan` 应为 `fix_after_characterization`。

## tdd_state

关键阶段后，使用 [tdd_state.jsonl](../templates/tdd_state.jsonl) 记录 `tdd_state` protocol block。

阻断规则：

- 没有 `test_written` 时，不能记录 `red_observed`。
- 没有 `red_observed` 时，不能记录 `green_reached`。
- 没有 `green_reached` 时，不能记录 `refactor_done`。
- 必须提供 `red_observed.command`；若使用 `command: none`，必须在 `evidence` 中说明理由。
- 记录 `red_observed.exit_code` 时应为非零值。
- 必须提供 `green_reached.command`；若使用 `command: none`，必须在 `evidence` 中说明理由。
- 记录 `green_reached.exit_code` 时应为 `0`。
- `red_observed.evidence` 必须说明失败原因与目标风险之间的关系。
- 如果测试立即通过，必须提供补充证明：临时扰动、反转断言、移除生产路径并观察失败，或说明无法复现先前 RED 证据的原因。

## tdd_finish

最终响应前，使用 [tdd_finish.jsonl](../templates/tdd_finish.jsonl) 声明 `tdd_finish` protocol block。

阻断规则：

- 缺少 `tdd_finish` 时阻断任务完成。
- `red_observed` 或 `green_reached` 不为 `true` 时，需要更多证据或任务无法完成的说明。
- `tests_run` 为空时，必须至少运行一个测试或说明未运行测试的原因。
- `tests_run` 应使用包含 `phase`、`command`、`exit_code` 和 `evidence` 的结构化条目。只有在旧式字符串包含具体阶段和结果证据时才予以兼容。
- 当 `red_observed: true` 时，`tests_run` 必须包含 RED 阶段证据。
- 当 `green_reached: true` 时，`tests_run` 必须包含 GREEN 或最终通过证据。
- `task_type: characterize_then_fix` 且 `wrong_contract_fixed: false` 时，需要说明停止或继续修复工作的原因。
- `current_contract_wrong: true` 且 `wrong_contract_characterized: false` 时，需要额外的特征测试证据。

## What This Does Not Check

纯 TDD hook 不检查：

- controller、service 或 repository 等具体层名称。
- `MockMvc`、`ResponseEntity`、框架 annotation 或类型。
- 目录结构、包名或文件命名。
- 项目专用架构规则。

这些内容属于技术栈或架构扩展，应位于独立的 skill 或 hook 包中。
