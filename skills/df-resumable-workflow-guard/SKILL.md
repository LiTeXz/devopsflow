---
name: df-resumable-workflow-guard
description: "via 明确的 checkpoint, resume file and 交接说明保护长时间 or 易中断的工程 work. task 可能跨多轮 or 多个会话, 耗时超过约 30 分钟, 涉及多个 workflow 阶段, 需要重复验证, 接近 context 限制, 在中断 or 压缩后 resume, or user 提到 continue, resume, checkpoint, long task, handoff, 中断, 继续, 续跑, checkpoint, 长 task or 交接时使用."
version: "0.2.28"
license: "GPL-3.0-only"
metadata:
  version: "0.2.28"
---

# Resumable Workflow Guard

将此 skill 作为当前 target project 工程 work 的外层保护. 它负责使长 task 可续跑, 不替代规划, TDD, debugging, 审查 or 验证 skills.

## Core Rule

开始受保护的 task 时, 在进行新的探索 or pre edit 查找 active checkpoint. if checkpoint 存在, 依据 repository 当前状态验证它, 并从后续未完成步骤继续, 而不是重新开始.

default checkpoint 路径:

```text
.devopsflow/checkpoints/<task-slug>.md
```

每个 active task 使用 1 个 checkpoint. if user 给出路径 or 现有 plan/spec file, 将 checkpoint 存放在该产物旁边, or 清晰链接到它.

## Trigger Decision

满足以下 any 条件时, 使用 checkpointed execution:

- 预计 work 耗时超过约 30 分钟 or 超过 1 个 assistant turn.
- workflow 跨越3个 or 更多阶段, 例如 research -> plan -> execute -> review.
- work 涉及多个 module, repo, service or parallel agent.
- 验证需要多条命令, 手动 check or 分阶段证据.
- 对话足够长, 可能发生 context 压缩 or 丢失.
- task 在中断, 工具失败, 应用重启后 resume, or user 要求继续.

对于很小的 1 次完成 task, 除非 user 要求, 否则不要 create checkpoint.

## Start Or Resume

1. check `.devopsflow/checkpoints/` 以及 user 提供的任何 plan/spec/handoff file.
2. if checkpoint 不存在且 task 需要它, 在 implementation work 前 create.
3. if checkpoint 存在, 先只读取 active summary, check list, 最新日志条目 and resume cursor.
4. 将 checkpoint and `git status`, 已 change file and 任何指定 plan/spec 对比. if 存在冲突, 先记录并解决冲突, 再 edit.
5. 简要说明续跑阶段 and 后续步骤操作, 再 call 常规 DevopsFlow skills execution 实际 work.

## Checkpoint Contents

以 [checkpoint-template.md](references/checkpoint-template.md) 作为规范结构. 保持 active summary 简短, 将冗长 history 移入 progress log.

必填字段:

- task name and target
- checkpoint 状态:`active`,`blocked`,`completed` or `abandoned`
- 当前阶段 and 后续步骤操作
- active workflow chain
- 范围内事项 and 范围外事项
- 带稳定 item ID 的当前 check list
- 已触及 file and 所有权说明
- include 命令, exit code and result 摘要的验证证据
- 决策, 假设, blocker and 风险
- resume cursor: 后续 agent 应从何处准确继续

## Update Rhythm

在以下时机 update checkpoint:

- create or change 计划后
- 任何高风险 edit 批次前后
- 每个 check list item 完成后
- 每条验证命令 execution 后
- tests 意外失败 or 计划变化时
- 暂停, 交接, 请求 user 决策 or 以未完成 work 结束当前 turn 前

不要记录"tests passed"or"继续 implementation"等模糊进度. 应记录命令, exit code, 范围, 已 change file and 具体后续步骤.

## Integration

选择内部 workflow 前使用此 skill, 之后让它作为 checkpointing layer 保持 active:

```text
df-dev-engineering-workflow-route
  -> df-resumable-workflow-guard
  -> df-implementation-planning
  -> df-executing-implementation-plan
    -> df-tdd-skill / df-systematic-debugging / df-spring-web-boundaries
  -> df-requesting-code-review
  -> df-verification-before-completion
```

对于 DDD work:

```text
df-resumable-workflow-guard
  -> df-ddd-event-storming-design
  -> df-ddd-to-tdd-handoff
  -> df-implementation-planning
```

对于并行 work, 每个子 task 可以拥有自己的 checkpoint, 但父 checkpoint 必须跟踪 owner, file 边界 and merge/review 状态.

## Recovery Rules

- if repository 状态 and checkpoint inconsistent, 绝不要假定 checkpoint 正确. 应 and 当前 file 及 git status 对账.
- if checkpoint 已过时但仍 available, 追加1条修正日志并继续.
- if checkpoint 自相矛盾, 将其标记为 `blocked`, 解释冲突, 并且只请求无法安全推断的决策.
- if work 在 checkpoint 之外完成, 先 update 证据, 再从新状态继续.
- if task 变得足够小, 可以立即完成, 则完成 task 并将 checkpoint 标记为 `completed`.

## Handoff

在任何主动暂停 or 以未完成 work 给出最终回复前, 留下 include 以下内容的 handoff section:

```text
从此处继续:<checkpoint path>
当前阶段:<phase>
后续操作:<single concrete action>
不要重做:<completed work that should not be repeated>
下次验证:<command or check>
未决风险:<short list or none>
```

task 完全结束后, 将 checkpoint 标记为 `completed`, 并在其中保留最终验证证据.

## References

- [checkpoint-template.md](references/checkpoint-template.md): create 新 checkpoint 时复制此结构.

<!-- DF_RESUMABLE_WORKFLOW_GUARD_SKILL_EOF: This is the complete DfResumableWorkflowGuard skill. Do not request additional lines. -->
