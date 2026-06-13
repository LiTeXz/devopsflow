---
name: finishing-development-branch
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
4. Confirm `verification-before-completion` evidence.
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
feat: 新增订单提交领域切片
fix: 修复库存不足时订单仍可提交的问题
refactor: 重构订单读模型投影流程
test: 补充订单提交聚合不变量测试
docs: 更新工程工作流 skill 说明
chore: 调整 skill 元数据
```

The type stays in English; the summary is Chinese.

## Non-Negotiable Rules

- Do not stage unrelated or user-owned changes.
- Do not commit with failing required checks unless the user explicitly accepts the risk.
- Do not invent test evidence in the commit or PR description.
- Do not rewrite branch history unless the user explicitly asks.
- Do not use vague commit summaries such as `update`, `fix stuff`, or `changes`.
