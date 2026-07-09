---
name: df-requesting-code-review
description: "Prepare implemented code for review with a bug-focused self-review. Use after the main implementation is complete and before handoff, PR, or final completion to inspect diffs for behavioral regressions, missing tests, risky contracts, data consistency, security, error handling, and unclear verification evidence."
---

# Requesting Code Review

Use this skill after implementation and before asking someone else to trust the change.

## Self-Review Workflow

1. Inspect the diff and changed files.
2. Re-read the original requirement, plan, and verification evidence.
3. Look for issues in this order:
   - correctness bugs
   - behavior regressions
   - missing or weak tests
   - public contract changes
   - persistence, transaction, ordering, pagination, or concurrency risks
   - security, validation, serialization, or authorization risks
   - selected style pack, golden example, anti-pattern, or review checklist mismatches
   - unclear naming or maintainability concerns that could hide bugs
4. Run or cite the relevant verification.
5. Produce a review request summary that leads with risk, not praise.

## Output Format

```markdown
## 自查结果

### 必须关注
- <file:line> <risk>

### 测试与验证
- <command> -> <exit code/result>

### 审查重点
- <area reviewers should inspect>

### 已知风险
- <risk or none>
```

If no issues are found, say so clearly and name remaining test gaps or residual risk.

## Non-Negotiable Rules

- Do not use this as a generic summary. Review for bugs first.
- Do not hide weak test evidence.
- Do not ask for review while relevant tests are failing unless the review is explicitly about the failure.
- Do not include unrelated cleanup in the review scope.
