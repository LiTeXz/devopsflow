# Engineering Workflow Map

```text
用户提出需求
  -> engineering-workflow-router
    -> 长任务/续跑/易中断：resumable-workflow-guard
    -> 需求模糊或领域复杂：ddd-event-storming-design
    -> 领域已清楚且存在相似实现：glue-coding
    -> 设计已确认且要实现：ddd-to-tdd-handoff
    -> 多步骤实现：implementation-planning
    -> 开始编码：executing-implementation-plan
      -> 每个行为切片：tdd-skill
      -> Spring Web 变更：spring-web-boundaries
      -> 失败/异常：systematic-debugging
    -> 独立模块或新上下文审查：parallel-agent-orchestration
    -> 完成实现：requesting-code-review
    -> 修 review：receiving-code-review
    -> 最终声明完成：verification-before-completion
    -> 提交/PR：finishing-development-branch
```

Default minimal chain for complex domain implementation:

```text
engineering-workflow-router
  -> resumable-workflow-guard
  -> ddd-event-storming-design
  -> glue-coding
  -> ddd-to-tdd-handoff
  -> implementation-planning
  -> executing-implementation-plan
  -> tdd-skill
  -> verification-before-completion
```

Default minimal chain for glue-style implementation:

```text
engineering-workflow-router
  -> DDD gate when business meaning is unclear
  -> glue-coding
  -> implementation-planning
  -> executing-implementation-plan
  -> tdd-skill when behavior changes
  -> verification-before-completion
```
