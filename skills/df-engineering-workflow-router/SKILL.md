---
name: df-engineering-workflow-router
description: "强制工程工作流路由器。在软件开发、重构、缺陷修复、领域建模、Glue Coding、API 或授权设计、代码审查、验证、分支收尾或 commit 准备开始时使用，用于对任务分类并选择必需的 skills，例如 df-resumable-workflow-guard、df-ddd-event-storming-design、df-glue-coding、df-iam-access-control-design、df-ddd-to-tdd-handoff、df-implementation-planning、df-executing-implementation-plan、df-tdd-skill、df-spring-web-boundaries、df-systematic-debugging、df-requesting-code-review、df-receiving-code-review、df-verification-before-completion、df-finishing-development-branch 或 df-parallel-agent-orchestration。"
---

# Engineering Workflow Router

在开始工程工作前使用此 skill。它负责选择强制工作流，而不是实现任务。

## Routing Protocol

1. 对任务分类：
   - `new_feature`
   - `bug_fix`
   - `pure_refactor`
   - `domain_modeling`
   - `glue_coding`
   - `design_review`
   - `code_review`
   - `review_feedback`
   - `verification`
   - `branch_finish`
   - `commit_or_pr`
2. 识别风险维度：
   - 领域歧义或业务规则
   - 与 df-glue-coding 的匹配度：现有 CRUD、页面、端点、adapter 或 pattern 可能覆盖大部分结构
   - 行为变更
   - 现有行为保持
   - 公共 API、HTTP、授权命名、RBAC/ABAC、安全、验证或序列化边界
   - 持久化、事务、顺序、分页、外部副作用
   - 测试失败、生产缺陷或根因不清
   - 可拆分的多模块工作
   - 长时间、多轮、易中断或续跑的工作
3. 选择必需的 skills。
4. 继续前说明选定的工作流。
5. 如果选定的 skill 不可用，说明缺失项并使用最接近的可用工作流。

## Skill Selection

- 当任务可能跨多轮或多个会话、耗时约 30 分钟以上、在中断后续跑、接近上下文限制、涉及多个工作流阶段或需要 checkpoint/交接证据时，使用 `df-resumable-workflow-guard`。
- 当需求包含非平凡业务语言、domain event、command、policy、aggregate、read model 或不清晰的业务边界时，使用 `df-ddd-event-storming-design`。
- 当领域歧义已解决或被明确视为很薄，且实现应复用本地项目材料，如 CRUD/页面 pattern、参考示例、端点、adapter、handler、projection、测试、导入/导出或其他可重复结构时，使用 `df-glue-coding`。
- 当定义或审查 permission 和 role 标识符、RBAC/ABAC binding、CEL condition、API 授权映射，或迁移冒号分隔的 permission name 时，使用 `df-iam-access-control-design`。
- DDD 设计确认后，当用户需要实施切片、测试或开发计划时，使用 `df-ddd-to-tdd-handoff`。
- 对多步实现、重构、风险变更，或安全执行需要多个 red/green 切片的任何任务，使用 `df-implementation-planning`。
- 遵循已有计划或写完计划后，使用 `df-executing-implementation-plan`。
- 编写或变更可执行行为、修复缺陷、表征现有行为或进行行为保持型重构时，使用 `df-tdd-skill`。
- 变更 Java/Spring controller、REST endpoint、request/response mapping、validation、security、upload/download、export 或 service/controller 边界时，使用 `df-spring-web-boundaries`。
- 测试意外失败、缺陷报告没有已证实的根因，或拟议修复基于猜测时，使用 `df-systematic-debugging`。
- 独立模块、计划审查、实现和审查可以拆分到互不重叠的上下文时，使用 `df-parallel-agent-orchestration`。
- 主要实现完成后、最终交接或 PR 前，使用 `df-requesting-code-review`。
- 处理审查评论时，使用 `df-receiving-code-review`。
- 宣称任务完成前，使用 `df-verification-before-completion`。
- commit、push、打开 PR 或准备分支交接前，使用 `df-finishing-development-branch`。

## Output Format

```text
Task Type: <classification>
Main Risks: <risk list>
Required Skills:
1. <skill> - <reason>
2. <skill> - <reason>
Execution Order:
1. <workflow step>
2. <workflow step>
Not Used Yet:
- <skill> - <reason>
```

保持路由简洁。完成路由后，立即遵循选定的 skills。

## Default Chains

- 长任务或续跑任务：`df-resumable-workflow-guard` -> 选定的内部工作流 -> checkpoint 更新 -> `df-verification-before-completion`。
- 新领域功能：`df-ddd-event-storming-design` -> 存在本地 pattern 时使用 `df-glue-coding` -> `df-ddd-to-tdd-handoff` -> `df-implementation-planning` -> 搭配 `df-tdd-skill` 使用 `df-executing-implementation-plan` -> `df-verification-before-completion`。
- Glue 风格实现：业务含义不清时先过 DDD gate -> `df-glue-coding` -> `df-implementation-planning` -> 行为变化时搭配 `df-tdd-skill` 使用 `df-executing-implementation-plan` -> `df-verification-before-completion`。
- 缺陷修复：`df-systematic-debugging` -> `df-tdd-skill` -> `df-verification-before-completion`。
- 纯重构：`df-implementation-planning` -> `df-tdd-skill` characterization -> `df-executing-implementation-plan` -> `df-verification-before-completion`。
- Spring endpoint 变更：`df-tdd-skill` + `df-spring-web-boundaries` -> `df-verification-before-completion`。
- API 授权设计：涉及 resource 或 transport 设计时使用 `df-iam-access-control-design` + `df-google-aip-api-design` -> 可执行行为变更使用 `df-implementation-planning` -> `df-verification-before-completion`。
- 审查反馈：`df-receiving-code-review` -> 聚焦验证 -> `df-verification-before-completion`。
- Commit 或 PR：`df-verification-before-completion` -> `df-finishing-development-branch`。

## Non-Negotiable Rules

- 除非任务仅涉及文档、格式或直接提问，否则不要因为任务看似很小就跳过路由。
- 如果路由要求先进行建模、规划、TDD 或调试，不要开始编辑生产代码。
- 不要把 DDD 本身当作编码计划；应通过 `df-ddd-to-tdd-handoff` 衔接已确认的领域设计。
- 不要让 Glue Coding 绕过 DDD。如果看似 CRUD 的任务隐藏业务规则，在确认 DDD gate 前，本地 pattern 只能作为发现输入。
- 检查本地 pattern 并记录选定 pattern 及差异前，不要为 Glue 风格工作发明结构。
- 工程变更没有经过 `df-verification-before-completion` 时，不要宣称完成。
- 尊重 worktree 中用户所有的变更。绝不要还原无关编辑。

完整 skill 组合图见 [workflow-map.md](references/workflow-map.md)。

<!-- DF_ENGINEERING_WORKFLOW_ROUTER_EOF: This is the complete DfEngineeringWorkflowRouter skill. Do not request additional lines. -->
