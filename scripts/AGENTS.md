<!-- BEGIN:scripts/AGENTS.md -->

# scripts/AGENTS.md

this file 补充 [AGENTS.md](../AGENTS.md), 适用于 `scripts/` 子树.

## Scope

`scripts/` 只存放用于 development and 维护当前 DevopsFlow repository 的 script 及其 test, 不 include Codex, agent, plugin, skill or later integration 在 runtime 使用的 script.

- 所有可 execution script 必须 passed `package.json` 的 `scripts` 公开入口.
- Husky 必须使用 `bun run <script-name>` call 这些入口, 不得直接 execution `scripts/*.ts`.
- repository other directory, 外部 project and 已 install plugin 不得 import, 链接 or 直接 execution `scripts/` 下的 implementation file.
- `*.test.ts` and 被测 implementation 共同属于 repository development tooling, passed `package.json` 中覆盖 `scripts/` 的 test 入口 run.
- Codex or agent hook script 存放在 `hooks/<执行时机>/`; skill 专用 script 存放在对应 `skills/<skill-name>/scripts/`.

## Changes

新增, 移动 or 删除 script 时, 必须同步 update `package.json`, Husky 配置 and script 边界回归 test. script 保持 self-contained TypeScript, Bun shebang, ESM and fail-open 约定; 仅在配置明确要求 blocking 时例外.

## Verification

至少 run:

```bash
bun run test:repository-scripts
bun run typecheck
```

<!-- END:scripts/AGENTS.md -->
