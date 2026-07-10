# Engineering Workflow Map

```text
用户提出需求
  -> df-engineering-workflow-router
  -> 长任务/续跑/易中断：df-resumable-workflow-guard
  -> 需求模糊或领域复杂：df-ddd-event-storming-design
  -> 领域已清楚且存在相似实现：df-glue-coding
  -> 设计已确认且要实现：df-ddd-to-tdd-handoff
  -> 多步骤实现：df-implementation-planning
  -> 开始编码：df-executing-implementation-plan
    -> 每个行为切片：df-tdd-skill
    -> Spring Web 变更：df-spring-web-boundaries
    -> IAM 权限命名、RBAC/ABAC 或 API 鉴权映射：df-iam-access-control-design
    -> 失败/异常：df-systematic-debugging
  -> 独立模块或新上下文审查：df-parallel-agent-orchestration
  -> 完成实现：df-requesting-code-review
  -> 修 review：df-receiving-code-review
  -> 最终声明完成：df-verification-before-completion
  -> 提交/PR：df-finishing-development-branch
```

Default minimal chain for complex domain implementation:

```text
df-engineering-workflow-router
  -> df-resumable-workflow-guard
  -> df-ddd-event-storming-design
  -> df-glue-coding
  -> df-ddd-to-tdd-handoff
  -> df-implementation-planning
  -> df-executing-implementation-plan
  -> df-tdd-skill
  -> df-verification-before-completion
```

Default minimal chain for glue-style implementation:

```text
df-engineering-workflow-router
  -> DDD gate when business meaning is unclear
  -> df-glue-coding
  -> df-implementation-planning
  -> df-executing-implementation-plan
  -> df-tdd-skill when behavior changes
  -> df-verification-before-completion
```

Default minimal chain for API authorization design:

```text
df-engineering-workflow-router
  -> df-iam-access-control-design
  -> df-google-aip-api-design when resource or transport design is involved
  -> df-implementation-planning when executable behavior changes
  -> df-tdd-skill when executable behavior changes
  -> df-verification-before-completion
```
