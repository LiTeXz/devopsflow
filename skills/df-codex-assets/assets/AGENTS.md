<!-- BEGIN:skills/df-codex-assets/assets/AGENTS.md -->
# skills/df-codex-assets/assets/AGENTS.md

## Lock Files

不要使用 `edit` or other 直接 edit 工具修改 `all.lock`,`subagent.lock` 等 lock file. 已有 Husky hook 会在提交前根据暂存区内容自动计算, update 并暂存这些 file; 如需 change 锁内容, 应修改其受管源 file 后交由 Husky 管理.

<!-- END:skills/df-codex-assets/assets/AGENTS.md -->
