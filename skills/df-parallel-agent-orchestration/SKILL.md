---
name: df-parallel-agent-orchestration
description: "为工程任务规划安全的并行 agent 工作。当独立模块、计划审查、实现、验证或代码审查可在文件所有权互不重叠的上下文中运行，或需要全新审查上下文以避免复杂工作中的自我确认时使用。"
---

# Parallel Agent Orchestration

仅当并行处理可以降低风险或缩短周期时，才使用此 skill 拆分工作。

## Use Parallel Agents For

- 文件互不重叠的独立模块
- 相互独立的只读代码库问题
- 实现准备继续进行时开展计划审查
- 实现完成后使用全新上下文进行代码审查
- 可与另一项独立任务同时运行的验证

## Do Not Split When

- 下一个本地步骤受该结果阻塞
- 文件所有权大量重叠
- 任务要求一次连贯的编辑
- 子任务需要提示词中没有的隐藏上下文
- 简短的本地检查会更快

## Delegation Contract

每项委派任务必须包含：

- 目标
- agent 所有的文件或模块
- 禁止触碰的文件或模块
- 预期输出
- 验证命令或证据
- 不得还原他人编辑的指令
- 报告变更文件路径的指令

## Coordination Rules

- 当 worker 拥有某个范围时，规划者不在该范围内进行大范围实现。
- Worker 执行有边界的任务，并适应现有变更。
- Reviewer 使用全新上下文，聚焦缺陷、回归和测试缺口。
- 并行实现任务的写入集合必须互不相交。
- 集成负责人解决冲突并运行最终验证。

## Output Format

```markdown
## Parallel Work Plan

### Local owner
- Immediate work:

### Agent 1
- Role:
- Owns:
- Avoids:
- Task:
- Verification:

### Agent 2
- Role:
- Owns:
- Avoids:
- Task:
- Verification:

## Integration Plan
```

<!-- DF_PARALLEL_AGENT_ORCHESTRATION_EOF: This is the complete DfParallelAgentOrchestration skill. Do not request additional lines. -->
