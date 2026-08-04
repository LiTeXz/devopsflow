---
name: df-resumable-workflow-guard
description: "通过明确的 checkpoint、resume file 和交接说明保护长时间或易中断的工程工作。任务可能跨多轮或多个会话、耗时超过约 30 分钟、涉及多个工作流阶段、需要重复验证、接近上下文限制、在中断或压缩后续跑，或用户提到 continue、resume、checkpoint、long task、handoff、中断、继续、续跑、检查点、长任务或交接时使用。"
---

# Resumable Workflow Guard

将此 skill 作为现有 DevopsFlow 工作流的外层保护。它负责使长任务可续跑，不替代规划、TDD、调试、审查或验证 skills。

## Core Rule

开始受保护的任务时，在进行新的探索或编辑前查找 active checkpoint。如果 checkpoint 存在，依据仓库当前状态验证它，并从下一个未完成步骤继续，而不是重新开始。

默认 checkpoint 路径：

```text
.devopsflow/checkpoints/<task-slug>.md
```

每个 active task 使用一个 checkpoint。如果用户给出路径或现有 plan/spec file，将 checkpoint 存放在该产物旁边，或清晰链接到它。

## Trigger Decision

满足以下任一条件时，使用 checkpointed execution：

- 预计工作耗时超过约 30 分钟或超过一个 assistant turn。
- 工作流跨越三个或更多阶段，例如 research -> plan -> execute -> review。
- 工作涉及多个 module、repo、service 或 parallel agent。
- 验证需要多条命令、手动检查或分阶段证据。
- 对话足够长，可能发生上下文压缩或丢失。
- 任务在中断、工具失败、应用重启后续跑，或用户要求继续。

对于很小的一次性任务，除非用户要求，否则不要创建 checkpoint。

## Start Or Resume

1. 检查 `.devopsflow/checkpoints/` 以及用户提供的任何 plan/spec/handoff file。
2. 如果 checkpoint 不存在且任务需要它，在实现工作前创建。
3. 如果 checkpoint 存在，先只读取 active summary、checklist、最新日志条目和 resume cursor。
4. 将 checkpoint 与 `git status`、已变更文件和任何指定 plan/spec 对比。如果存在冲突，先记录并解决冲突，再编辑。
5. 简要说明续跑阶段和下一步操作，再调用常规 DevopsFlow skills 执行实际工作。

## Checkpoint Contents

以 [checkpoint-template.md](references/checkpoint-template.md) 作为规范结构。保持 active summary 简短，将冗长历史移入 progress log。

必填字段：

- 任务名称和目标
- checkpoint 状态：`active`、`blocked`、`completed` 或 `abandoned`
- 当前阶段和下一步操作
- active workflow chain
- in scope 和 out of scope
- 带稳定 item ID 的当前 checklist
- 已触及文件和所有权说明
- 包含命令、退出码和结果摘要的验证证据
- 决策、假设、blocker 和风险
- resume cursor：下一位 agent 应从何处准确继续

## Update Rhythm

在以下时机更新 checkpoint：

- 创建或变更计划后
- 任何高风险编辑批次前后
- 每个 checklist item 完成后
- 每条验证命令执行后
- 测试意外失败或计划变化时
- 暂停、交接、请求用户决策或以未完成工作结束当前 turn 前

不要记录“测试通过”或“继续实现”等模糊进度。应记录命令、退出码、范围、已变更文件和具体下一步。

## Integration

选择内部工作流前使用此 skill，之后让它作为 checkpointing layer 保持 active：

```text
df-engineering-workflow-router
  -> df-resumable-workflow-guard
  -> df-implementation-planning
  -> df-executing-implementation-plan
    -> df-tdd-skill / df-systematic-debugging / df-spring-web-boundaries
  -> df-requesting-code-review
  -> df-verification-before-completion
```

对于 DDD 工作：

```text
df-resumable-workflow-guard
  -> df-ddd-event-storming-design
  -> df-ddd-to-tdd-handoff
  -> df-implementation-planning
```

对于并行工作，每个子任务可以拥有自己的 checkpoint，但父 checkpoint 必须跟踪 owner、文件边界和 merge/review 状态。

## Recovery Rules

- 如果仓库状态与 checkpoint 不一致，绝不要假定 checkpoint 正确。应与当前文件及 git status 对账。
- 如果 checkpoint 已过时但仍可用，追加一条修正日志并继续。
- 如果 checkpoint 自相矛盾，将其标记为 `blocked`，解释冲突，并且只请求无法安全推断的决策。
- 如果工作在 checkpoint 之外完成，先更新证据，再从新状态继续。
- 如果任务变得足够小，可以立即完成，则完成任务并将 checkpoint 标记为 `completed`。

## Handoff

在任何主动暂停或以未完成工作给出最终回复前，留下包含以下内容的 handoff section：

```text
从此处继续：<checkpoint path>
当前阶段：<phase>
下一步操作：<single concrete action>
不要重做：<completed work that should not be repeated>
下次验证：<command or check>
未决风险：<short list or none>
```

任务完全结束后，将 checkpoint 标记为 `completed`，并在其中保留最终验证证据。

## References

- [checkpoint-template.md](references/checkpoint-template.md)：创建新 checkpoint 时复制此结构。
