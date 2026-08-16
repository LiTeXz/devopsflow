# Release v0.2.32 Checkpoint

## Task

- 名称：修复 v0.2.31 精确 tag 安装失败并发布 DevopsFlow 0.2.32
- 目标：恢复 Codex marketplace 的可安装 source contract，通过本地与 tag 安装验证，发布 `v0.2.32` 并同步 `main` 到 `dev`。
- 状态：in_progress
- Owner：Codex `/root`
- 创建时间：2026-08-16 Asia/Shanghai

## Failure Review

- 预期：从精确 release tag 添加 marketplace 后，`codex plugin add devopsflow@devopsflow` 能发现并安装 plugin。
- 实际：v0.2.31 tag 的 `.agents/plugins/marketplace.json` 使用 `source=url` 与 `path=./`，临时 `CODEX_HOME` 中 marketplace 可拉取但 plugin list 为空，安装报 `plugin devopsflow was not found`。
- 根因：两个 marketplace manifest source 不一致，当前 Codex CLI 对该 URL source 形状不产生可安装 plugin 条目。
- 修复：统一 `.agents/plugins/marketplace.json` 与 `.codex-plugin/marketplace.json` 为 `source=local`, `path=.`，并加入 manifest contract 回归测试。
- 回归门：临时 `CODEX_HOME` 精确 tag install、full test、Version Check 与 managed asset checks。

## Workflow Chain

```text
df-systematic-debugging -> df-dev-tdd -> df-release-goal-governance -> df-verification-before-completion
```

## Checklist

- [x] F1 - 复现 v0.2.31 精确 tag 安装失败并记录根因。
- [x] F2 - 添加 marketplace manifest 回归测试并完成 RED -> GREEN。
- [ ] R1 - 同步 0.2.32 版本源并通过完整 release gate。
- [ ] R2 - 合并 `codex/release-v0.2.32` 到 `main`。
- [ ] R3 - 创建 `v0.2.32` tag 并验证 tag-specific checks。
- [ ] R4 - 创建 GitHub Release 并完成精确 tag 安装验证。
- [ ] R5 - 同步 `main` 到 `dev` 并关闭复盘。

## Evidence

| 命令或外部证明 | 状态 | 结果 |
| --- | --- | --- |
| `codex plugin marketplace add LiTeXz/devopsflow --ref v0.2.31` | 0 | marketplace clone 成功 |
| `codex plugin add devopsflow@devopsflow` | 1 | `plugin devopsflow was not found` |
| `bun test scripts/project-branding.test.ts --test-name-pattern 'marketplace manifests'` RED | 1 | 复现 `.agents` source mismatch |
| 同一测试 GREEN | 0 | 两个 manifests 均为 local/path . |

## Progress Log

```text
2026-08-16
v0.2.31 tag/Release/Version Check 已成功，但 exact-tag install 失败。
切换到 0.2.32 hotfix，先保护 manifest source contract，再重新发布。
```
