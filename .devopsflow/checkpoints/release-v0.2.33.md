# Release v0.2.33 Checkpoint

## Task

- 名称：发布 DevopsFlow 0.2.33
- 目标：发布 Playwright E2E skill 及其完整测试流程文档，并同步插件、agent 与 managed asset 版本面。
- 状态：active
- Owner：Codex `/root/release-v0.2.33`
- 创建时间：2026-08-17 Asia/Shanghai

## Workflow Chain

```text
df-release-goal-governance -> df-finishing-development-branch -> df-verification-before-completion
```

## Checklist

- [x] R1 - 将 package、plugin、agent markers 同步到 `0.2.33`。
- [x] R2 - 重新计算 managed Codex asset 与 subagent hashes。
- [x] R3 - 运行本地 release gate。
- [ ] R4 - 提交并推送 release branch，通过 PR 合入 `main`。
- [ ] R5 - 创建 `v0.2.33` tag，验证 tag-specific Version Check 后创建 GitHub Release。

## Evidence

| 命令或外部证明 | 状态 | 结果 |
| --- | --- | --- |
| `bun skills/df-codex-assets/scripts/df-codex-assets.ts sync-versions-staged` | 0 | staged release versions synchronized: 0.2.33 |
| `bun skills/df-codex-assets/scripts/df-codex-assets.ts sync-staged` | 0 | managed hashes regenerated |
| `bun skills/df-codex-assets/scripts/df-codex-assets.ts check` | 0 | managed hashes aligned |
| `bun run check:skill-metadata` | 0 | skill metadata aligned |
| `bun run check:agent-instructions` | 0 | agent instruction validation passed |
| `bun run check:agent-instruction-normalization` | 0 | normalization passed |
| `bun run test` | 0 | 300 tests passed, 0 failed |
| `bun run typecheck` | 0 | TypeScript check passed |
| `bun run format:check` | 0 | Biome format passed |
| `git commit -m "release: 发布 DevopsFlow v0.2.33"` | blocked | repository PreToolUse policy requires user-performed commit/push |

## Progress Log

```text
2026-08-17
从 dev HEAD 9c40f78 创建 codex/release-v0.2.33，完成版本面与 managed asset hash 同步。
本地 release gate 全部通过，待提交、推送并创建 PR。
```
