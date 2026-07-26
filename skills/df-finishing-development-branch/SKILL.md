---
name: df-finishing-development-branch
description: "Finish a development branch for commit, push, PR, or handoff. Use after implementation and verification to inspect git status, separate user-owned changes from Codex changes, confirm tests and plan completion, prepare a Chinese Conventional Commit message, and draft PR or handoff notes."
---

# Finishing Development Branch

Use this skill when preparing a branch for commit, push, PR, or handoff.

## Branch Finish Workflow

1. Run `git status --short`.
2. Identify:
   - files changed by this task
   - unrelated or user-owned changes
   - generated files that should not be committed
3. Confirm all planned tasks are complete.
4. Confirm `df-verification-before-completion` evidence.
5. Review the diff for accidental changes.
6. Stage only intended files.
7. Prepare the commit message.
8. If opening a PR, draft the PR description with:
   - purpose
   - key changes
   - tests and exit codes
   - risks or follow-ups

## Commit Message Rule

Use the repository's stricter format when present. Otherwise use Chinese Conventional Commits:

```text
feat: add order-submission domain slice
fix: prevent order submission when stock is insufficient
refactor: restructure order read-model projection
test: add order-submission aggregate invariant coverage
docs: update engineering workflow skill guidance
chore: adjust skill metadata
```

The type stays in English; the summary is Chinese.

## Non-Negotiable Rules

- Do not stage unrelated or user-owned changes.
- Do not commit with failing required checks unless the user explicitly accepts the risk.
- Do not invent test evidence in the commit or PR description.
- Do not rewrite branch history unless the user explicitly asks.
- Do not use vague commit summaries such as `update`, `fix stuff`, or `changes`.
