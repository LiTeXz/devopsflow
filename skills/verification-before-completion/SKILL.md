---
name: verification-before-completion
description: "Mandatory completion gate for engineering work. Use before saying a development, refactor, bug fix, modeling, review, documentation, configuration, commit, or PR task is complete to verify user requirements, changed files, commands run with exit codes, skipped checks, manual validation, residual risks, unrelated changes, and Chinese Conventional Commit readiness."
---

# Verification Before Completion

Use this skill before claiming completion. It is a completion gate, not a testing strategy by itself.

## Verification Checklist

Answer every item:

1. Did the final result satisfy every user request?
2. What files changed?
3. Which commands were run, and what were their exit codes?
4. Which relevant tests or checks were not run, and why?
5. Was there manual verification? What exactly was observed?
6. Are there remaining risks, assumptions, or incomplete areas?
7. Are there unrelated or user-owned worktree changes?
8. If committing, does the commit message use Chinese Conventional Commits or the repository's stricter format?
9. If TDD was required, is there RED/GREEN/REFACTOR evidence?
10. If DDD modeling was required, were conclusions confirmed before persistence?
11. If Spring Web boundaries changed, were endpoint contracts and service boundary scans covered?
12. If Glue Coding was required, which local target pattern was used, which delta was implemented, and should any new rule, knowledge, pattern, or track be persisted? For refactors, which legacy patterns or anti-patterns were avoided, and what characterization evidence protected behavior?

## Evidence Standard

Use concrete evidence:

- command line and exit code
- test names or suite names
- file paths
- observed behavior
- skipped command with reason

Do not write vague statements such as "tests pass" without the command and scope.

## Output Format

For internal notes or handoff files, use `templates/verification-report.md`. In the final response, summarize the same evidence briefly:

```markdown
完成情况：
- 已满足：
- 变更文件：
- 验证：
- 未运行：
- 剩余风险：
```

## Non-Negotiable Rules

- Do not say "done", "complete", or equivalent until this checklist has been satisfied.
- Do not hide skipped tests.
- Do not imply broader verification than was actually run.
- Do not ignore dirty worktree changes. Separate your edits from unrelated changes.
- Do not commit if required evidence is missing unless the user explicitly accepts the risk.
