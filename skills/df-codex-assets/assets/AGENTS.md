<!-- BEGIN:skills/df-codex-assets/assets/AGENTS.md -->
# skills/df-codex-assets/assets/AGENTS.md

## Lock Files

不要使用 `edit` 或其他直接编辑工具修改 `all.lock`、`subagent.lock` 等 lock 文件。已有 Husky hook 会在提交前根据暂存区内容自动计算、更新并暂存这些文件；如需变更锁内容，应修改其受管源文件后交由 Husky 管理。

<!-- END:skills/df-codex-assets/assets/AGENTS.md -->
