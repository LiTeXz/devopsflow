# Release v0.2.31 Checkpoint

## Task

- 名称：从 `dev` 发布 DevopsFlow 0.2.31
- 目标：将 `origin/dev` 的版本源同步到 0.2.31，通过本地发布门禁，使用 `dev -> main` PR 合入，创建并验证 `v0.2.31` tag、tag-specific Version Check、GitHub Release、精确 tag 安装，并同步 `main` 到 `dev`。
- 状态：in_progress
- Owner：Codex `/root`
- 创建时间：2026-08-16 Asia/Shanghai

## Workflow Chain

```text
df-dev-engineering-workflow-route
  -> df-release-goal-governance
  -> df-finishing-development-branch
  -> df-verification-before-completion
```

## Scope

- 范围内：0.2.31 版本源、release gate、`dev -> main` 发布 PR、`v0.2.31` tag、tag-specific Version Check、GitHub Release、精确 tag 安装验证、`main -> dev` 同步。
- 范围外：未纳入本次发布的开放 issue、与门禁无关的重构、旧版本 checkpoint 改写。
- 当前基线：最新正式版 `v0.2.30`，发布源分支 `dev`，默认分支 `main`。

## Checklist

- [x] R1 - 核对分支、远端、版本源、现有 tag/Release 与开放 PR。
- [x] R2 - 将 package/plugin/agent/managed asset 版本同步到 0.2.31。
- [ ] R3 - 运行完整本地 release gate，提交并推送 `codex/release-v0.2.31`。
- [ ] R4 - 创建并合并 `dev -> main` 发布 PR。
- [ ] R5 - 推送 `v0.2.31` 并等待 tag-specific Version Check。
- [ ] R6 - 创建 GitHub Release 并验证精确 tag 安装。
- [ ] R7 - 同步 `main` 到 `dev` 并完成最终验证。

## Verification Evidence

| 命令或外部证明 | 退出码/状态 | 结果 |
| --- | --- | --- |
| `git status --short --branch` | 0 | `dev...origin/dev`，工作区干净 |
| `gh release list --limit 10` | 0 | 最新正式版 `v0.2.30` |
| `gh repo view --json nameWithOwner,defaultBranchRef` | 0 | `LiTeXz/devopsflow`，默认分支 `main` |
| `bun skills/df-codex-assets/scripts/df-codex-assets.ts sync-versions-staged` | 0 | package/plugin/agent versions synchronized to 0.2.31 |
| `bun skills/df-codex-assets/scripts/df-codex-assets.ts sync-staged` | 0 | managed hashes refreshed |
| `git merge-base --is-ancestor origin/main origin/dev` | 0 | `origin/main` is an ancestor of `origin/dev` |

## Risks And Blockers

- 版本发布必须分别验证 merge commit、tag workflow 和 GitHub Release，不能以本地 gate 代替远端证明。
- 当前无已确认 blocker。

## Progress Log

```text
2026-08-16
任务：发布前现状核对。
证据：dev/origin/dev=891cc82，最新 Release/tag=v0.2.30，工作区干净。
结论：下一版本确定为 0.2.31。
变更：版本源已同步，创建发布分支 `codex/release-v0.2.31`。
下一步：运行完整 release gate 并提交推送发布分支。
```
