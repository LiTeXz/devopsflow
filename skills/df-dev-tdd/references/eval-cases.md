# Eval Cases

使用这些场景迭代 `df-dev-tdd`。当真实使用暴露出 agent 绕过 TDD、使用含糊证据或选择错误测试层的新方式时，在此添加场景。

## Case 1: Production Code First

用户请求：

> 在保持行为的前提下重构订单总额计算。

失败行为：

- agent 先编辑生产代码。
- 之后才添加特征测试。
- 生产代码编辑前未出现 `tdd_start`。

预期护栏：

- 因缺少 `tdd_start`，`before_edit` 失败。
- `tdd_start.first_test_to_write` 指明必须首先编写的特征测试。
- 最终报告说明 RED/GREEN 证据；如果已经违反流程，则说明补偿测试和剩余风险。

## Case 2: Vague RED Evidence

用户请求：

> 修复分页列表中的默认排序缺陷。

失败行为：

```jsonl
tdd_state:
  phase: red_observed
  evidence: "测试如预期失败"
```

预期护栏：

- 要求提供命令、退出码、测试名称和失败原因。
- RED 证据说明失败与默认排序风险的关系。

## Case 3: Pure Refactor Changes Public Behavior

用户请求：

> 在不改变 API 行为的前提下重构用户查询服务。

失败行为：

- agent 将空查询行为从返回空列表改为抛出错误。
- 特征测试只覆盖正常路径。

预期护栏：

- `protected_behavior` 或完成条件将公共契约、错误语义和默认值列为不得改变的行为。
- 特征测试覆盖调用方依赖的棘手边界场景。

## Case 4: Test Layer Too Narrow

用户请求：

> 修复导出任务跨多个页面时的数据丢失问题。

失败行为：

- 只有单元测试 mock 了第一页。
- 没有断言覆盖分页序列、终止条件或批次大小。

预期护栏：

- `stable_boundary` 标记编排或持久化边界风险。
- 测试捕获完整分页序列。
- 如果窄层测试无法覆盖边界风险，扩大到组件、持久化或集成测试。

## Case 5: Wrong Contract Named As Desired Contract

用户请求：

> 此旧版 API 当前错误地返回 500；先重构，再修复。

失败行为：

- agent 将 500 响应命名为期望行为。
- `current_contract_wrong` 仍为 `false`。

预期护栏：

- `current_contract_wrong: true`。
- `wrong_contract_plan: fix_after_characterization`。
- 特征测试将旧版行为标记为仅兼容，随后由期望行为测试驱动修复。

## Case 6: Greenfield Implementation First

用户请求：

> 从零构建新的价格计算器。

失败行为：

- agent 在任何可执行行为测试存在前创建生产类、路由或抽象。
- 首个测试在实现后编写，并且立即通过。
- `task_type` 不是 `greenfield_feature`。

预期护栏：

- `tdd_start.task_type: greenfield_feature`。
- `first_test_to_write` 指明首个期望行为测试。
- 只有缺失的符号、路由、命令或模块正是预期可观察边界时，RED 证据才可以是该元素缺失。
- GREEN 证据证明最小生产实现后，同一行为切片通过。
