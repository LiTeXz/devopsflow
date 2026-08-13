# Workflow Map

路由结果由 [workflow-router.ts](../scripts/workflow-router.ts) 中的集中定义计算，不在此文件重复维护路由规则。

输出遵循以下 `.d.ts` 风格契约：

```typescript
/** A selected skill and the reason it is required by the route. */
interface SkillSelection {
  /** Canonical DevopsFlow skill identifier. */
  readonly skill: Skill

  /** English explanation of why the route requires this skill. */
  readonly reason: string
}

/** Complete deterministic result returned by the workflow router. */
interface RouteDecision {
  /** Primary classification of the engineering request. */
  readonly taskType: TaskType

  /** Deduplicated risk dimensions in first-seen input order. */
  readonly risks: readonly RiskDimension[]

  /** Required skills with English selection reasons, in execution order. */
  readonly requiredSkills: readonly SkillSelection[]

  /** Unique skill identifiers in dependency-safe execution order. */
  readonly executionOrder: readonly Skill[]
}
```

`TaskType`、`RiskDimension` and `Skill` 的枚举成员以 [workflow-router.ts](../scripts/workflow-router.ts) 为唯一事实来源。运行 `workflow-router.ts --help` 查看当前 CLI 接受的枚举值；运行带参数的命令生成具体任务的路由结果。
