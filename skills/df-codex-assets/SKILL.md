---
name: df-codex-assets
description: "在其他 hook 运行前，将 DevopsFlow Codex hook 运行时资产引导至已安装的插件镜像。"
---

# DevopsFlow Codex Asset Bootstrap

此内部 skill 携带 DevopsFlow 托管的 Codex 运行时资产引导脚本及预期哈希值。

SessionStart hook 会在运行时 hook 脚本之前运行 `scripts/df-codex-assets.ts hydrate`。该脚本会校验托管资产的哈希值；当已安装的插件镜像缺少这些资产时，会从匹配的 GitHub tag 下载对应版本的文件。
