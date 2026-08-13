# Agent Hook Scripts

本目录保存 plugin Hook 配置，以及 Codex or agent lifecycle Hook 单独调用的可执行脚本及其回归测试.

`hooks/hooks.codex.json` 保存 plugin Hook 配置; 本目录的时机子目录保存配置所调用 or 下游安装所需的 TypeScript 实现. 普通 repository 校验脚本继续保留在 `scripts/` 根目录, 不应迁入这里.

## Layout

- `pre-tool-use/`: 工具执行前的权限 and operation 门禁.
- `session-start/`: session 启动阶段的环境 or branch 检查.
- `subagent/`: Codex worker lifecycle state and 写入权限控制.
