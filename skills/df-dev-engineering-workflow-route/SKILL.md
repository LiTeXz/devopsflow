---
name: df-dev-engineering-workflow-route
description: "强制开发工程工作流路由。在软件开发、重构、缺陷修复、领域建模、Glue Coding、API 或授权设计、代码审查、验证、分支收尾或 commit 准备开始时，对任务分类并选择必需的 skills。"
---

# Dev Engineering Workflow Route

在开始工程工作前使用此 skill。它只负责生成工作流决策，不代替被选中的 skills。

## Source Of Truth

分类、风险维度、skill 映射、选择理由、执行顺序和默认链全部集中定义在 [workflow-router.ts](scripts/workflow-router.ts)。不要在 Markdown、metadata 或其他脚本中复制这些定义。

## Workflow

1. 根据用户请求选择一个 `TaskType`，并识别所有适用的 `RiskDimension`。
2. 调用 TypeScript 路由器：

   ```bash
   bun skills/df-dev-engineering-workflow-route/scripts/workflow-router.ts --task-type <task-type> --risks <risk-1,risk-2>
   ```

3. 向用户简要说明返回的任务类型、主要风险、必需 skills 和执行顺序。
4. 立即按 `executionOrder` 使用选中的 skills。
5. 如果某个 skill 不可用，说明缺失项并使用最接近的可用工作流。

不确定可用值时运行：

```bash
bun skills/df-dev-engineering-workflow-route/scripts/workflow-router.ts --help
```

## Rules

- 除非任务仅涉及文档、格式或直接提问，否则不要因为任务看似很小而跳过路由。
- 路由要求先建模、规划、TDD 或调试时，不要提前编辑生产代码。
- 不要让 Glue Coding 绕过领域歧义检查。
- 工程变更没有经过返回结果中的完成门禁时，不要宣称完成。
- 尊重 worktree 中用户所有的变更，绝不还原无关编辑。

## References

- [workflow-map.md](references/workflow-map.md)：解释如何阅读路由结果，不包含第二份规则定义。

<!-- DF_DEV_ENGINEERING_WORKFLOW_ROUTE_SKILL_EOF: This is the complete DfDevEngineeringWorkflowRoute skill. Do not request additional lines. -->
