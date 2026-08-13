---
name: df-finishing-development-branch
description: "完成开发分支，为 commit、push、PR 或交接做准备。在实现和验证后使用，用于检查 git 状态、分离用户所有的变更与 Codex 变更、确认测试和计划完成情况，并起草 PR 或交接说明。"
---

# Finishing Development Branch

准备分支以进行 commit、push、PR 或交接时使用此 skill。

## Branch Finish Workflow

1. 运行 `git status --short`。
2. 识别：
   - 本任务变更的文件
   - 无关变更或用户所有的变更
   - 不应提交的生成文件
3. 确认所有计划任务均已完成。
4. 确认 `df-verification-before-completion` 证据。
5. 审查差异中是否有意外变更。
6. 只暂存预期文件。
7. 如果要打开 PR，起草包含以下内容的 PR 描述：
   - 目的
   - 关键变更
   - 测试及退出码
   - 风险或后续事项

## Non-Negotiable Rules

- 不要暂存无关变更或用户所有的变更。
- 必要检查失败时不要提交，除非用户明确接受风险。
- 不要在 commit 或 PR 描述中编造测试证据。
- 除非用户明确要求，否则不要重写分支历史。

<!-- DF_FINISHING_DEVELOPMENT_BRANCH_SKILL_EOF: This is the complete DfFinishingDevelopmentBranch skill. Do not request additional lines. -->
