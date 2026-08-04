<!-- BEGINE /AGENTS.md -->
# /AGENTS.md

本文件适用于整个 DevopsFlow 仓库。更深层的 `AGENTS.md` 只补充所在子树的规则；发生冲突时，以距离目标文件最近的规则为准。

## Language

- 与用户沟通以及计划、审查、验证和交接说明使用中文。
- 仓库 Markdown 标题使用英文，正文使用中文；代码标识符、命令、路径、协议名、产品名和原文引用保持原样。

## Repository Structure

```text
.codex-plugin/  Codex 插件与 marketplace 清单
.github/        GitHub Actions 工作流
.opencode/      OpenCode 适配
assets/         插件图片与静态资源
hooks/          Codex hook 配置
scripts/        校验脚本与自动化测试
skills/         DevopsFlow skills 及其配套资源
src/shared/     hook 与适配器共享的 TypeScript 实现
```

## Technology Stack

- 运行时与包管理器：Bun 1.3.14。
- 开发语言：TypeScript 7，使用 ESM、`ESNext` 和 strict mode，不生成编译产物。
- 测试框架：Bun Test。
- 格式化与静态检查：Biome 2.5；类型检查使用 TypeScript compiler。
- Git hooks：Husky 9。
- 集成平台：Codex plugin、Codex hooks 和 OpenCode adapter。

<!-- END /AGENTS.md -->
