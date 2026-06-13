---
name: executing-implementation-plan
description: "Execute an implementation plan safely. Use when Codex has a written plan or is about to follow planned engineering steps: first review the plan for missing tests, oversized steps, wrong ordering, or stale assumptions, then execute one task at a time with verification evidence."
---

# Executing Implementation Plan

Use this skill to execute a plan without drifting.

## Pre-Execution Review

Before editing files, read the plan and check:

- Does each behavior slice have a test or verification command?
- Are RED and GREEN expectations explicit where behavior changes?
- Are steps small and independently verifiable?
- Are files/modules named enough to avoid wandering?
- Are refactor steps separated from behavior changes?
- Are public contracts, persistence, security, ordering, and side effects protected?
- Does the plan conflict with the current repository state?
- Are user-owned or unrelated changes present?

If the plan is unsafe, update it or ask for confirmation before proceeding.

## Execution Loop

For each task:

1. Announce the current task and expected verification.
2. Execute only that task.
3. Run the specified verification command.
4. Record evidence:
   - command
   - exit code
   - relevant test names or checks
   - result summary
5. If tests fail unexpectedly, switch to `systematic-debugging`.
6. If the next step is TDD behavior work, use `tdd-skill`.
7. If the task touches Spring Web boundaries, use `spring-web-boundaries`.
8. If reality invalidates the plan, stop and revise the plan.

## Progress Log

Keep a concise progress log:

```text
任务：<plan item>
变更：<files/modules>
验证：<command> -> <exit code>, <result>
状态：done / blocked / plan-updated
证据：<short concrete detail>
```

## Non-Negotiable Rules

- Do not execute multiple plan items at once unless they are mechanically inseparable.
- Do not silently skip a planned test or verification command.
- Do not continue after an unexpected failure by guessing a fix; debug systematically.
- Do not add unplanned refactors while tests are red.
- Do not expand file scope without updating the plan or stating the reason.
- Do not claim completion until `verification-before-completion` has checked the whole result.
