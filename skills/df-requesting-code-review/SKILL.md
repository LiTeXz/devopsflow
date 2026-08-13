---
name: df-requesting-code-review
description: "via 聚焦缺陷的自查, 为已 implementation 的 code ready 审查. 在主要 implementation 完成后, 交接, PR or 最终完成前使用, check 差异中是否存在行为回归, tests 缺失, 契约风险, 数据 consistency, 安全, 错误处理 and 验证证据不清等问题."
---

# Requesting Code Review

在 implementation 完成后, 要求他人信任该 change 前使用此 skill.

## Self-Review Workflow

1. check 差异 and 已 change file.
2. 重新阅读原始需求, 计划 and 验证证据.
3. 按以下顺序查找问题:
   - 正确性缺陷
   - 行为回归
   - 缺失 or 薄弱的 tests
   - 公共契约 change
   - 持久化, 事务, 顺序, 分页 or 并发风险
   - 安全, 验证, 序列化 or 授权风险
   - and 选定 style pack, golden example, anti-pattern or 审查 manifest inconsistent
   - 可能掩盖缺陷的命名不清 or 可维护性问题
4. run or 引用相关验证.
5. generate 以风险而非赞扬开头的审查请求摘要.

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

if 未发现问题, 应明确说明, 并列出剩余 tests 缺口 or 残余风险.

## Non-Negotiable Rules

- 不要将其用作通用摘要; 应优先审查缺陷.
- 不要隐瞒薄弱的 tests 证据.
- 相关 tests 失败时, 不要请求审查, 除非审查明确针对该失败.
- 不要在审查范围中 include 无关清理.

<!-- DF_REQUESTING_CODE_REVIEW_SKILL_EOF: This is the complete DfRequestingCodeReview skill. Do not request additional lines. -->
