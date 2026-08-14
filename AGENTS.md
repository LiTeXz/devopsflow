<!-- BEGIN:/AGENTS.md -->
# /AGENTS.md

this file 适用于整个 DevopsFlow repository. 更深层的 `AGENTS.md` 只补充所在子树的 rule; 发生冲突时, 以距离 target file 最近的 rule 为准.

## Language

- 面向 user 沟通以及计划, 审查, 验证 and 交接说明使用 chinese.
- repository Markdown title 使用英文, 正文使用 chinese; code 标识符, 命令, 路径, protocol 名, 产品名 and 原文引用保持原样.

## Repository Structure

```text
.codex-plugin/  Codex plugin and marketplace menifest
.github/        GitHub Actions workflows
.opencode/      OpenCode adaptors
assets/         plugin image and static resources
hooks/          Codex hooks config
scripts/        校验脚本 and 自动化测试
skills/         DevopsFlow skills 及其配套资源
src/shared/     hook and 适配器共享的 TypeScript implementations
```

## Technology Stack

- runtime and package manager: Bun 1.3.14.
- development language: TypeScript 7, use ESM,`ESNext` and strict mode, do not generate 编译产物.
- tests framework: Bun Test.
- format and static check: Biome 2.5; type check 使用 TypeScript compiler.
- Git hooks: Husky 9.
- integration platform: Codex plugin, Codex hooks and OpenCode adapter.

<!-- END:/AGENTS.md -->
