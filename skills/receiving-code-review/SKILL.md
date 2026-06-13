---
name: receiving-code-review
description: "Address code review feedback safely. Use when Codex receives PR comments, review threads, requested changes, inline code review feedback, or maintainer suggestions and must classify comments, decide what to fix or discuss, apply focused changes, verify each fix, and avoid unrelated refactors."
---

# Receiving Code Review

Use this skill when review comments arrive.

## Review Intake

For each comment:

1. Read the full comment and surrounding code.
2. Classify it:
   - `must_fix`
   - `discuss`
   - `decline_with_reason`
   - `already_addressed`
   - `needs_more_context`
3. Identify the affected behavior, file, and test surface.
4. Decide whether the fix requires `tdd-skill`, `systematic-debugging`, or `spring-web-boundaries`.

## Fix Workflow

1. Address one review topic at a time.
2. Keep changes scoped to the comment.
3. Add or update tests when behavior changes or the comment exposes an unprotected risk.
4. Run the smallest relevant verification after each topic.
5. Record evidence and the response for the reviewer.

## Response Format

```markdown
## Review Resolution

### Comment: <short title>
- 分类：
- 处理：
- 文件：
- 验证：
- 回复建议：
```

## Non-Negotiable Rules

- Do not batch unrelated review comments into one broad refactor.
- Do not mark a comment resolved without code, evidence, or a clear explanation.
- Do not ignore requested changes because tests currently pass.
- Do not revert user or reviewer changes outside the targeted scope.
- Do not argue from preference when the comment identifies a concrete bug or contract risk.
