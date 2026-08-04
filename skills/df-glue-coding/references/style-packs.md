# Style Packs

Style pack 是项目所有的参考材料，用于在业务设计清晰后帮助 agent 保留仓库的实现风格。

它们不是共享的 DevopsFlow template，除非属于通用示例，否则不应放在此公共 skill 内。具体项目示例属于目标仓库。

## When To Use

在以下情况下使用 style pack：

- DDD、CQRS、API 或工作流决策已经明确应存在的行为。
- 任务映射到重复的实现形态，如 command、event、aggregate、projection、controller、job、import、export、测试、migration 或 adapter。
- 多种有效代码风格都能实现相同行为，且本地一致性很重要。
- 重构正在将代码从 legacy pattern 迁移到明确选定的 target pattern。

不要使用 style pack 覆盖已确认的业务规则、安全要求、验证语义、持久化约束或公共契约。

## Discovery Locations

按以下顺序搜索项目所有的材料：

1. 用户明确提供的路径或名称。
2. `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`，以及指明 style pack 的本地工作流文档。
3. `.devopsflow/style-pack/`
4. `docs/patterns/`, `examples/`, `reference/`, and `references/`

如果 style pack 与当前生产代码冲突，优先采用当前生产代码，除非任务明确要求向该 style pack 迁移。

## Recommended Shape

```text
.devopsflow/style-pack/
  <style-pack-name>/
    .pack.toml
    rules.md
    examples/
      <golden-example files>
    anti-patterns.md
    review-checklist.md
```

`.pack.toml` 应描述 scope、适用任务类型、主要示例、验证命令、审查检查项和已知排除项等 metadata。

`rules.md` 应包含影响实现选择、naming、layering、error handling、transaction boundary、测试或 projection 行为的简洁规则。

`examples/` 应包含完整的 golden example 或聚焦的小片段。宁可使用一个高质量的真实示例，也不要使用大量空 scaffold。

`anti-patterns.md` 应描述 agent 必须避免的形态，尤其是看似相似但不应复制的 legacy structure。

`review-checklist.md` 应列出 reviewer 在交接前预期执行的特定风格检查。

## How Agents Should Use A Style Pack

1. 选择最接近且适用的 style pack，并记录其适用原因。
2. 只阅读相关规则、示例、anti-pattern 和 checklist entry。
3. 将每个发现的示例归类为 `target_pattern`、`legacy_pattern`、`anti_pattern`、`behavior_evidence` 或 `unknown`。
4. 说明必须保留的约定和任务所需的精确差异。
5. 将选定的 style pack、目标示例、需保留约定和差异传递给实施规划。
6. 验证期间，报告使用了哪个 style pack，以及实现是否仍符合其 review checklist。

## Good Style Pack Material

- 它归使用该材料的项目所有。
- 它展示完整的 naming、layering、dependency direction、测试和验证风格。
- 当 pattern 存在的原因并不明显时，它会解释原因。
- 它包含反例，或针对看似有吸引力的 legacy 形态给出明确的“不要复制”说明。
- 它足够精简，agent 可以在编码前读完。

## Poor Style Pack Material

- 鼓励机械复制粘贴的空白填充 template。
- 没有选择指导的大段源码转储。
- 公共 skill 仓库中的项目私有信息。
- 与当前生产代码冲突、却未说明属于迁移目标的过时示例。
- 重复 DDD、API 设计、安全 policy 或持久化约束已负责的业务决策的规则。
