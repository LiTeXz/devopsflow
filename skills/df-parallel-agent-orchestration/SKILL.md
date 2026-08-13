---
name: df-parallel-agent-orchestration
description: "为工程 task 规划安全的并行 agent work. 当独立 module, 计划审查, implementation, 验证 or code 审查可在 file 所有权互不重叠的 context 中 run, or 需要全新审查 context 以避免复杂 work 中的自我确认时使用."
---

# Parallel Agent Orchestration

仅当并行处理可以降低风险 or 缩短周期时, 才使用此 skill 拆分 work.

## Use Parallel Agents For

- file 互不重叠的独立 module
- 相互独立的只读 code 库问题
- implementation ready 继续进行时开展计划审查
- implementation 完成后使用全新 context 进行 code 审查
- 可 and other item 独立 task 同时 run 的验证

## Do Not Split When

- 后续 local 步骤受该 result 阻塞
- file 所有权大量重叠
- task 要求 once 连贯的 edit
- 子 task 需要 prompt 中没有的隐藏 context
- 简短的 local check 会更快

## Delegation Contract

每项委派 task 必须 include:

- target
- agent 所有的 file or module
- 禁止触碰的 file or module
- 预期 output
- 验证命令 or 证据
- 不得还原他人 edit 的指令
- 报告 change file 路径的指令

## Coordination Rules

- 当 worker 拥有某个范围时, 规划者不在该范围内进行大范围 implementation.
- Worker execution 有边界的 task, 并适应现有 change.
- Reviewer 使用全新 context, 聚焦缺陷, 回归 and tests 缺口.
- 并行 implementation task 的 write 集合必须互不相交.
- integration 负责人解决冲突并 run 最终验证.

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

<!-- DF_PARALLEL_AGENT_ORCHESTRATION_SKILL_EOF: This is the complete DfParallelAgentOrchestration skill. Do not request additional lines. -->
