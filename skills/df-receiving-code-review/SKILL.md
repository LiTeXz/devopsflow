---
name: df-receiving-code-review
description: "安全处理 code 审查反馈. 当 Codex 收到 PR 评论, 审查线程, change 请求, 行内 code 审查反馈 or 维护者建议, 需要对评论 category, 决定 fix or 讨论, 应用聚焦 change, 验证每项 fix 并避免无关 refactor 时使用."
version: "0.2.29"
license: "GPL-3.0-only"
metadata:
  version: "0.2.29"
---

# Receiving Code Review

收到审查评论时使用此 skill.

## Review Intake

对于每条评论:

1. 阅读完整评论及其 context code.
2. 对评论 category:
   - `must_fix`
   - `discuss`
   - `decline_with_reason`
   - `already_addressed`
   - `needs_more_context`
3. 识别受影响的行为, file and tests 面.
4. 判断 fix 是否需要 `df-dev-tdd`,`df-systematic-debugging` or `df-spring-web-boundaries`.

## Fix Workflow

1. 每次处理 1 个审查主题.
2. 将 change 范围限制在评论所指内容.
3. 当行为变化 or 评论暴露出未受保护的风险时, 添加 or update tests.
4. 每个主题处理完后, run 最小的相关验证.
5. 记录证据以及给审查者的回复.

## Response Format

```markdown
## Review Resolution

### Comment: <short title>
- Classification:
- Resolution:
- Files:
- Verification:
- Suggested Reply:
```

## Non-Negotiable Rules

- 不要把无关的审查评论合并成单次大范围 refactor.
- 没有 code, 证据 or 清晰解释时, 不要将评论标记为已解决.
- 不要因为当前 tests passed 就忽略 change 请求.
- 不要还原 target 范围之外的 user or 审查者 change.
- 当评论指出具体缺陷 or 契约风险时, 不要以个人偏好作为反驳依据.

<!-- DF_RECEIVING_CODE_REVIEW_SKILL_EOF: This is the complete DfReceivingCodeReview skill. Do not request additional lines. -->
