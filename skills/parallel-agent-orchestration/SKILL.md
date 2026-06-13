---
name: parallel-agent-orchestration
description: "Plan safe parallel agent work for engineering tasks. Use when independent modules, plan review, implementation, verification, or code review can run in separate contexts with non-overlapping file ownership, or when a fresh reviewer context is valuable to avoid self-confirming complex work."
---

# Parallel Agent Orchestration

Use this skill to split work only when parallelism reduces risk or cycle time.

## Use Parallel Agents For

- independent modules with non-overlapping files
- separate read-only codebase questions
- plan review while implementation preparation continues
- fresh-context code review after implementation
- verification that can run while another independent task proceeds

## Do Not Split When

- the next local step is blocked on the result
- file ownership overlaps heavily
- the task requires a single coherent edit
- the subtask needs hidden context not available in the prompt
- a small local inspection would be faster

## Delegation Contract

Each delegated task must include:

- objective
- files or modules owned by the agent
- files or modules off-limits
- expected output
- verification command or evidence
- instruction not to revert others' edits
- instruction to report changed file paths

## Coordination Rules

- The planner does not do broad implementation while workers own that scope.
- Workers execute bounded tasks and adapt to existing changes.
- Reviewer uses fresh context and focuses on bugs, regressions, and test gaps.
- Parallel implementation tasks must have disjoint write sets.
- Integration owner resolves conflicts and runs final verification.

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
