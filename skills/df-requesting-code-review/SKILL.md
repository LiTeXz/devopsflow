---
name: df-requesting-code-review
description: "通过聚焦缺陷的自查，为已实现的代码准备审查。在主要实现完成后、交接、PR 或最终完成前使用，检查差异中是否存在行为回归、测试缺失、契约风险、数据一致性、安全、错误处理和验证证据不清等问题。"
---

# Requesting Code Review

在实现完成后、要求他人信任该变更前使用此 skill。

## Self-Review Workflow

1. 检查差异和已变更文件。
2. 重新阅读原始需求、计划和验证证据。
3. 按以下顺序查找问题：
   - 正确性缺陷
   - 行为回归
   - 缺失或薄弱的测试
   - 公共契约变更
   - 持久化、事务、顺序、分页或并发风险
   - 安全、验证、序列化或授权风险
   - 与选定 style pack、golden example、anti-pattern 或审查清单不一致
   - 可能掩盖缺陷的命名不清或可维护性问题
4. 运行或引用相关验证。
5. 生成以风险而非赞扬开头的审查请求摘要。

## Output Format

```markdown
## Self-Review Results

### Required Attention
- <file:line> <risk>

### Tests and Verification
- <command> -> <exit code/result>

### Review Focus
- <area reviewers should inspect>

### Known Risks
- <risk or none>
```

如果未发现问题，应明确说明，并列出剩余测试缺口或残余风险。

## Non-Negotiable Rules

- 不要将其用作通用摘要；应优先审查缺陷。
- 不要隐瞒薄弱的测试证据。
- 相关测试失败时，不要请求审查，除非审查明确针对该失败。
- 不要在审查范围中包含无关清理。
