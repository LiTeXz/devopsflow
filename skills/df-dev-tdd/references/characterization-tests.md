# Characterization Tests

特征测试的目标是冻结当前可观察行为，避免结构变更引起漂移。不要把明显错误的行为命名为期望契约；将其标记为当前兼容行为或缺陷候选项。

## What To Cover

- 调用方可能依赖的正常路径和棘手边界场景。
- 返回值、错误类型、错误码或关键消息。
- 持久化数量、关键字段、过滤、排序、分页元数据以及嵌套或聚合结构。
- 协作者的插入、更新、删除、绑定、发布、缓存失效和通知调用。
- 事务行为：整个操作使用一个事务还是每个条目使用一个事务；失败后继续还是停止。
- 导入、导出、同步和批处理：每个页面、批次或条目的请求序列、大小、顺序、类型选择、序号和终止条件。

## Capturing Parameters

当行为取决于构造出的对象时，捕获并断言它们：

- 分页请求、排序规则和查询规范。
- 批次大小、页面索引和继续条件。
- 类型标记、回调、文件名和边界元数据。
- 命令或结果对象中的关键字段。

不要只断言第一次调用。分页和批处理应断言完整序列。

## Test Naming

使用面向行为的名称，例如：

- `export_givenMultiplePages_shouldKeepSequenceAcrossPages`
- `create_givenInvalidOwner_shouldThrowBusinessException`
- `list_givenDefaultParams_shouldDelegateWithDefaultPageSize`
- `validate_givenLegacyInvalidInput_shouldKeepCurrent500ForCompatibility`

最后一个示例仅适合兼容性刻画。如果目标是修复缺陷，另写一个期望行为测试。

## Good Enough

当未来常见错误改变行为时，特征测试应当失败。如果它只验证“调用了某个方法”或“没有抛出异常”，通常过于薄弱。
