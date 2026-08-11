---
name: df-codex-assets
description: "在其他 hook 运行前，将 DevopsFlow Codex hook 运行时资产引导至已安装的插件镜像。"
---

# DevopsFlow Codex Asset Bootstrap

此内部 skill 携带 DevopsFlow 托管的 Codex 运行时资产引导脚本及预期哈希值。

SessionStart hook 会在运行时 hook 脚本之前运行 `scripts/df-codex-assets.ts hydrate`。该脚本会校验托管资产的哈希值；当已安装的插件镜像缺少这些资产时，会从匹配的 GitHub tag 下载对应版本的文件。

## Explicit Hook Trust

仅当用户明确要求信任 DevopsFlow hooks 时，运行：

```bash
bun "<PLUGIN_ROOT>/skills/df-codex-assets/scripts/trust-codex-hooks.ts"
```

将 `<PLUGIN_ROOT>` 替换为当前 skill 所属的已安装插件根目录。

该命令读取插件 manifest 中声明的 hook 文件，复算所有受支持 command hooks 的 Codex 信任指纹，并将缺失或过期的 `trusted_hash` 原子写入 `~/.codex/config.toml`。已经匹配的 hook 保持不变；全部匹配时不写配置文件。

不要从 `SessionStart` hydration 或其他隐式路径运行此命令。用户主动调用是允许脚本跳过 Codex 交互式 hook 审核的授权边界。
