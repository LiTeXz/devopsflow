---
name: df-receiving-code-review
description: "安全处理代码审查反馈。当 Codex 收到 PR 评论、审查线程、变更请求、行内代码审查反馈或维护者建议，需要对评论分类、决定修复或讨论、应用聚焦变更、验证每项修复并避免无关重构时使用。"
---

# Receiving Code Review

收到审查评论时使用此 skill。

## Review Intake

对于每条评论：

1. 阅读完整评论及其上下文代码。
2. 对评论分类：
   - `must_fix`
   - `discuss`
   - `decline_with_reason`
   - `already_addressed`
   - `needs_more_context`
3. 识别受影响的行为、文件和测试面。
4. 判断修复是否需要 `df-tdd-skill`、`df-systematic-debugging` 或 `df-spring-web-boundaries`。

## Fix Workflow

1. 每次处理一个审查主题。
2. 将变更范围限制在评论所指内容。
3. 当行为变化或评论暴露出未受保护的风险时，添加或更新测试。
4. 每个主题处理完后，运行最小的相关验证。
5. 记录证据以及给审查者的回复。

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

- 不要把无关的审查评论合并成一次大范围重构。
- 没有代码、证据或清晰解释时，不要将评论标记为已解决。
- 不要因为当前测试通过就忽略变更请求。
- 不要还原目标范围之外的用户或审查者变更。
- 当评论指出具体缺陷或契约风险时，不要以个人偏好作为反驳依据。
