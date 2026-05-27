---
name: implementation-planning
description: "Write a concrete, small-step implementation plan before coding. Use for multi-step features, bug fixes, refactors, DDD-to-TDD handoffs, risky behavior changes, or any engineering task that needs files, commands, expected RED/GREEN results, verification steps, and completion criteria before implementation."
---

# Implementation Planning

Use this skill to turn a requirement, confirmed DDD handoff, Glue Coding pattern selection, bug investigation result, or refactor goal into a plan that another agent can execute.

Do not edit production code while using this skill.

## Planning Workflow

1. Restate the goal and scope.
2. List constraints:
   - behaviors that must not change
   - public contracts
   - data, persistence, ordering, pagination, security, or side-effect risks
   - selected glue target pattern, local conventions, legacy behavior evidence, anti-patterns to remove, and project material that must be preserved
   - user-owned worktree changes to avoid
3. Identify behavior slices.
4. For each task, specify:
   - objective
   - files or modules likely involved
   - test or verification command
   - expected RED, GREEN, or unchanged result
   - completion standard
5. Keep each task small enough to complete and verify independently.
6. Mark steps that require `tdd-skill`, `spring-web-boundaries`, or `systematic-debugging`.
7. For glue-style work, include the selected target pattern and the exact delta each task is allowed to change.
8. For refactor glue work, separate characterization, target-pattern migration, and cleanup steps. Do not plan to copy legacy structure unless it is explicitly classified as the target pattern.
9. State whether user confirmation is required before execution.

## Step Size

Prefer 2-5 minute execution steps. Split a step when it combines:

- creating tests and implementing production code
- unrelated behavior slices
- multiple modules with separate risks
- refactor and behavior change
- debugging and fixing
- code changes and commit/PR work

## Output Format

Use `templates/implementation-plan.md` when a file artifact is useful. In chat, use the same structure:

```markdown
# <Name> Implementation Plan

## 目标

## 约束

## 行为切片

## 任务列表

1. 写失败测试：<behavior>
   - 文件：
   - 命令：
   - 预期 RED：
   - 完成标准：

2. 最小实现：<behavior>
   - 文件：
   - 命令：
   - 预期 GREEN：
   - 完成标准：

3. 重构：<design cleanup>
   - 文件：
   - 命令：
   - 必须保持：
   - 完成标准：

## 验证矩阵

## 需要用户确认
```

## Non-Negotiable Rules

- Do not write production code in this phase.
- Do not produce vague steps such as "implement feature" or "run tests".
- Do not omit commands when the project has discoverable test commands.
- Do not plan a fix before a reproducible failure and root-cause evidence exists for unclear bugs.
- Do not mix behavior change and broad cleanup in the same step.
- Do not invent new structure for glue-style work when a selected local target pattern must be preserved.
- Do not plan refactors that treat legacy code or anti-patterns as the target pattern without explicit justification.
- Do not assume approval for risky scope expansion; call it out.
