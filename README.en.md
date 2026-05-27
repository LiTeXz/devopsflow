# DevFlow Skills

[简体中文](README.md) | English

DevFlow Skills is a set of Codex engineering workflow skills. It organizes DDD, Glue Coding, TDD, planning, execution, debugging, review, verification, and branch finishing into a composable workflow system.

## Important: Use Plan Mode First

Before using DevFlow Skills, enable Plan mode in Codex.

These skills assume a workflow of clarify first, model first, plan first, then execute. This is especially important for DDD, TDD, implementation planning, debugging, and review workflows. Without Plan mode, Codex can be pulled into the user's table-driven, CRUD-page, or implementation-first framing and may start coding or produce an unconfirmed full design too early.

Recommended usage:

1. Enable Plan mode first.
2. Let `engineering-workflow-router` classify the task and choose the required skills.
3. Follow the selected skill's confirmation, modeling, or planning workflow.
4. Move to implementation, verification, commit, or PR only after user confirmation.

Do not treat Plan mode as optional; it is the entry guard for the DevFlow workflow.

## Installation

Install all skills from the repository root:

```bash
npx skills add https://github.com/LiTeXz/devflow-skills.git -g -a codex --skill engineering-workflow-router resumable-workflow-guard ddd-event-storming-design glue-coding ddd-to-tdd-handoff implementation-planning executing-implementation-plan systematic-debugging verification-before-completion requesting-code-review receiving-code-review finishing-development-branch parallel-agent-orchestration tdd-skill spring-web-boundaries
```

Install a single skill:

```bash
npx skills add https://github.com/LiTeXz/devflow-skills/tree/main/engineering-workflow-router -g -a codex
```

Restart Codex after installation so the new skills are loaded.

## Skills

- `engineering-workflow-router`: entry router for development, refactor, bug fix, modeling, review, verification, and branch finishing.
- `resumable-workflow-guard`: creates checkpoints, resume cursors, and handoff notes for long-running, resumed, or interruption-prone work.
- `ddd-event-storming-design`: pure DDD modeling from Event Storming and CQRS.
- `glue-coding`: after domain conclusions are clear, finds project-local patterns and implements only the delta.
- `ddd-to-tdd-handoff`: converts confirmed DDD outputs into executable TDD slices.
- `implementation-planning`: writes small, verifiable implementation plans before coding.
- `executing-implementation-plan`: reviews and executes a plan one checked task at a time.
- `systematic-debugging`: reproduces failures, proves root cause, and protects fixes with regression coverage.
- `verification-before-completion`: completion gate for requirements, changed files, command evidence, skipped checks, and remaining risk.
- `requesting-code-review`: performs a bug-focused self-review after implementation.
- `receiving-code-review`: classifies and resolves review feedback with verification.
- `finishing-development-branch`: prepares a branch for commit, push, PR, or handoff.
- `parallel-agent-orchestration`: splits independent work across agents with non-overlapping ownership.
- `tdd-skill`: project-agnostic RED/GREEN/REFACTOR TDD workflow and protocol validation.
- `spring-web-boundaries`: Spring Web boundary guardrails for controllers, endpoints, validation, security, uploads/downloads, exports, and service layering.

## Workflow Map

```text
user request
  -> engineering-workflow-router
    -> long-running/resumed/interruption-prone: resumable-workflow-guard
    -> domain complexity: ddd-event-storming-design
    -> clear domain with similar local implementation: glue-coding
    -> confirmed design to implementation: ddd-to-tdd-handoff
    -> multi-step work: implementation-planning
    -> coding: executing-implementation-plan
      -> behavior slice: tdd-skill
      -> Spring Web change: spring-web-boundaries
      -> failure or unknown root cause: systematic-debugging
    -> implementation complete: requesting-code-review
    -> review feedback: receiving-code-review
    -> final claim: verification-before-completion
    -> commit or PR: finishing-development-branch
```

## Repository Layout

```text
engineering-workflow-router/
resumable-workflow-guard/
ddd-event-storming-design/
glue-coding/
ddd-to-tdd-handoff/
implementation-planning/
executing-implementation-plan/
systematic-debugging/
verification-before-completion/
requesting-code-review/
receiving-code-review/
finishing-development-branch/
parallel-agent-orchestration/
tdd-skill/
spring-web-boundaries/
```

Each directory is an independent Codex skill with a required `SKILL.md` and optional `agents/`, `references/`, `scripts/`, and `templates/`.

## Validation

Format validation:

```bash
python -X utf8 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py engineering-workflow-router
```

TDD protocol regression:

```bash
python -X utf8 tdd-skill/scripts/run_protocol_examples.py
```

DDD design guardrail regression:

```bash
python -X utf8 ddd-event-storming-design/scripts/run_design_examples.py
```

## Commit Message

Use Chinese Conventional Commits:

```text
feat: 新增工程工作流入口调度器
fix: 修复 DDD 校验脚本编码问题
docs: 更新技能组合说明
```
