# Release v0.2.30 Checkpoint

## Task

- 名称：发布 DevopsFlow 0.2.30
- 目标：将 `origin/dev` 的 0.2.30 内容通过发布门禁合入 `main`，创建并验证 `v0.2.30` tag、GitHub Release、精确 tag 安装，并同步 `dev`。
- 状态：active
- Owner：Codex `/root`
- 创建时间：2026-08-14 Asia/Shanghai
- 更新时间：2026-08-14 Asia/Shanghai

## Resume Cursor

- 当前阶段：本地 release gate 已通过，待提交
- 下一步操作：提交门禁修复，随后创建 `dev -> main` PR。
- 从此处继续：从当前工作区的修复 diff 和完整 gate 证据继续，不要重复版本同步。
- 不要重做：版本号已由提交 `33a5d90` 同步到 `0.2.30`；不要重复修改版本文件。

## Workflow Chain

```text
df-dev-engineering-workflow-route
  -> df-resumable-workflow-guard
  -> df-release-goal-governance
  -> df-verification-before-completion
  -> df-finishing-development-branch
```

## Scope

- 范围内：本地 release gate、`dev -> main` PR、`v0.2.30` tag、tag-specific Version Check、GitHub Release、精确 tag 安装验证、`main -> dev` 同步。
- 范围外：未纳入本次发布的开放 issue、与门禁无关的重构、milestone 新建。
- 用户所有的变更：开始时 `git status --short --branch` 显示工作区干净；现有其他 checkpoint 不改动。

## Checklist

- [x] R1 - 核对分支、远端、版本源、现有 tag/Release 与开放 PR。
- [x] R2 - 运行本地 release gate。
- [x] R2a - 修复 normalizer 对合法 asset path/ASCII 单词的破坏并加入回归测试。
- [x] R2b - 修复 TDD protocol 文档 TypeScript 示例的分号契约。
- [ ] R3 - 创建并合并 `dev -> main` 发布 PR。
- [ ] R4 - 推送 `v0.2.30` 并等待 tag-specific Version Check。
- [ ] R5 - 创建 GitHub Release 并验证精确 tag 安装。
- [ ] R6 - 同步 `main` 到 `dev` 并完成最终验证。

## Touched Files

| 文件 | Owner | 原因 | 状态 |
| --- | --- | --- | --- |
| `.devopsflow/checkpoints/release-v0.2.30.md` | Codex | 长任务续跑证据 | active |
| `skills/df-ai-agentinstruction-authoring/scripts/normalize-agent-instructions.ts` | Codex | 保留 asset path 并避免单词内部 token 匹配 | modified |
| `skills/df-ai-agentinstruction-authoring/scripts/normalize-agent-instructions.test.ts` | Codex | normalizer 回归覆盖 | modified |
| `skills/df-tdd-skill/references/hook-protocol.md` | Codex | 满足 TypeScript 文档契约 | modified |
| `skills/df-tdd-skill/scripts/run-protocol-examples.test.ts` | Codex | 对齐 Biome formatter 的 TypeScript 契约 | modified |
| `hooks/AGENTS.md` | Codex | 应用仓库 normalizer 规范 | modified |
| `skills/AGENTS.md` | Codex | 应用仓库 normalizer 规范 | modified |

## Decisions And Assumptions

- 决策：按当前仓库的 `package.json`、`.codex-plugin/plugin.json`、agent 注释版本与 tag workflow 执行，不沿用已删除的旧版 `df-publisher.toml`/`hash.txt` 流程。
- 假设：用户指定 `0.2.30`，因此允许从已发布 `0.2.28` 直接发布 `0.2.30`；`0.2.29` 作为 `dev` 中间版本提交包含在范围内但不单独发 tag。

## Verification Evidence

| 命令 | 退出码 | 范围 | 结果 |
| --- | --- | --- | --- |
| `git status --short --branch` | 0 | 本地工作区 | 开始时 `dev...origin/dev`，无变更 |
| `gh release list --limit 6` | 0 | 远端发布 | 最新为 `v0.2.28` |
| `git ls-remote --heads --tags origin ...` | 0 | 远端 refs | `origin/dev=33a5d90`，`origin/main=64ff015`，无 `v0.2.29`/`v0.2.30` |
| `bun test` | 0 | 全仓库 | 全部测试通过 |
| `bun run typecheck` | 0 | TypeScript | 通过 |
| `bun run format:check` | 0 | Biome format | 通过 |
| `bun run lint` | 0 | Biome lint | 通过 |
| `bun run check:agent-instructions` | 0 | instruction validator | 通过 |
| `bun run check:agent-instruction-normalization` | 0 | instruction normalizer | 通过 |
| `bun run check:skill-eof` | 0 | skill EOF | 通过 |
| `bun run check:skill-metadata` | 0 | skill metadata | 通过 |
| `bun test scripts/version-check-workflow.test.ts` | 0 | tag workflow contract | 通过 |

## Risks And Blockers

- 风险：发布包含 `v0.2.28..origin/dev` 的累计提交，需要以完整本地 gate 和 PR checks 证明可发布。
- Blocker：无；远端 PR checks、tag-specific Version Check 和 Release 尚未执行。

## Progress Log

```text
2026-08-14
任务：发布前现状核对。
变更：仅创建 checkpoint。
验证：工作区、远端分支、版本源、tag/Release、开放 PR 已核对。
状态：active。
证据：origin/dev=33a5d90，origin/main=64ff015，package/plugin/agents=0.2.30。
下一步：提交当前修复并创建 `dev -> main` 发布 PR。
```

## Handoff

```text
从此处继续：.devopsflow/checkpoints/release-v0.2.30.md
当前阶段：发布前验证
下一步操作：运行当前仓库 release gate。
不要重做：不要再次修改 0.2.30 版本源。
下次验证：bun test、bun run typecheck、bun run format:check、bun run lint 及仓库专用检查。
未决风险：累计变更尚未通过本次发布验证。
```
