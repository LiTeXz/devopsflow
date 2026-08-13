---
name: df-finishing-development-branch
description: "完成 development 分支, 为 commit, push, PR or 交接做 ready. 在 implementation and 验证后使用, 用于 check git 状态, 分离 user 所有的 change and Codex change, 确认 tests and 计划完成情况, 并起草 PR or 交接说明."
---

# Finishing Development Branch

ready 分支以进行 commit, push, PR or 交接时使用此 skill.

## Branch Finish Workflow

1. run `git status --short`.
2. 识别:
   - this task change 的 file
   - 无关 change or user 所有的 change
   - 不应提交的 generate file
3. 确认所有计划 task 均已完成.
4. 确认 `df-verification-before-completion` 证据.
5. 审查差异中是否有意外 change.
6. 只暂存预期 file.
7. if 要打开 PR, 起草 include 以下内容的 PR description:
   - 目的
   - 关键 change
   - tests 及 exit code
   - 风险 or 后续事项

## Non-Negotiable Rules

- 不要暂存无关 change or user 所有的 change.
- 必要 check 失败时不要提交, 除非 user 明确接受风险.
- 不要在 commit or PR description 中编造 tests 证据.
- 除非 user 明确要求, 否则不要重 write 分支 history.

<!-- DF_FINISHING_DEVELOPMENT_BRANCH_SKILL_EOF: This is the complete DfFinishingDevelopmentBranch skill. Do not request additional lines. -->
