---
name: resumable-workflow-guard
description: "Protect long-running or interruption-prone engineering work with explicit checkpoints, resume files, and handoff notes. Use when a task may span multiple turns or sessions, exceed about 30 minutes, touch multiple workflow stages, require repeated verification, approach context limits, resume after interruption/compaction, or when the user says continue, resume, checkpoint, long task, handoff, 中断, 继续, 续跑, 检查点, 长任务, or 交接."
---

# Resumable Workflow Guard

Use this skill as an outer guard around existing DevFlow workflows. Its job is to keep long work resumable; it does not replace planning, TDD, debugging, review, or verification skills.

## Core Rule

At the start of a guarded task, look for an active checkpoint before doing new exploration or edits. If a checkpoint exists, validate it against the current repository state and continue from the next incomplete step instead of restarting.

Default checkpoint path:

```text
.devflow/checkpoints/<task-slug>.md
```

Use one checkpoint per active task. If the user gives a path or an existing plan/spec file, store the checkpoint beside that artifact or link to it clearly.

## Trigger Decision

Use checkpointed execution when any condition is true:

- The work is expected to take more than about 30 minutes or more than one assistant turn.
- The workflow crosses three or more stages, such as research -> plan -> execute -> review.
- The work touches multiple modules, repos, services, or parallel agents.
- Verification requires multiple commands, manual checks, or staged evidence.
- The conversation is long enough that context compaction or loss is plausible.
- The task is being resumed after an interruption, tool failure, app restart, or user says to continue.

For tiny one-shot tasks, do not create a checkpoint unless the user asks.

## Start Or Resume

1. Check for `.devflow/checkpoints/` and any user-provided plan/spec/handoff file.
2. If no checkpoint exists and the task needs one, create it before implementation work.
3. If a checkpoint exists, read only the active summary, checklist, latest log entries, and resume cursor first.
4. Compare the checkpoint with `git status`, changed files, and any named plan/spec. If they conflict, record the conflict and resolve it before editing.
5. State the resumed phase and the next action briefly, then invoke the normal DevFlow skills for the actual work.

## Checkpoint Contents

Use `references/checkpoint-template.md` as the canonical shape. Keep the active summary short and move noisy history into the progress log.

Required fields:

- task name and goal
- checkpoint status: `active`, `blocked`, `completed`, or `abandoned`
- current phase and next action
- active workflow chain
- in scope and out of scope
- current checklist with stable item IDs
- touched files and ownership notes
- verification evidence with commands, exit codes, and result summaries
- decisions, assumptions, blockers, and risks
- resume cursor: exactly where the next agent should continue

## Update Rhythm

Update the checkpoint:

- after creating or changing a plan
- before and after any high-risk edit batch
- after each completed checklist item
- after each verification command
- when tests fail unexpectedly or the plan changes
- before pausing, handing off, asking the user for a decision, or ending the turn with unfinished work

Do not write vague progress such as "tests pass" or "continued implementation." Record command, exit code, scope, changed files, and the concrete next step.

## Integration

Use this skill before selecting the inner workflow, then keep it active as a checkpointing layer:

```text
engineering-workflow-router
  -> resumable-workflow-guard
    -> implementation-planning
    -> executing-implementation-plan
      -> tdd-skill / systematic-debugging / spring-web-boundaries
    -> requesting-code-review
    -> verification-before-completion
```

For DDD work:

```text
resumable-workflow-guard
  -> ddd-event-storming-design
  -> ddd-to-tdd-handoff
  -> implementation-planning
```

For parallel work, each subtask may have its own checkpoint, but the parent checkpoint must track owners, file boundaries, and merge/review status.

## Recovery Rules

- Never assume the checkpoint is true if the repository disagrees. Reconcile with the current files and git status.
- If the checkpoint is stale but usable, append a correction log entry and continue.
- If the checkpoint is contradictory, mark it `blocked`, explain the conflict, and ask only for the decision that cannot be inferred safely.
- If work was completed outside the checkpoint, update evidence first, then continue from the new state.
- If the task becomes small enough to finish immediately, finish it and mark the checkpoint `completed`.

## Handoff

Before any intentional pause or final response with unfinished work, leave a handoff section containing:

```text
Resume from: <checkpoint path>
Current phase: <phase>
Next action: <single concrete action>
Do not redo: <completed work that should not be repeated>
Verify next with: <command or check>
Open risks: <short list or none>
```

When the task is fully done, mark the checkpoint `completed` and keep the final verification evidence in the checkpoint.

## References

- `references/checkpoint-template.md`: copy this structure when creating a new checkpoint.
