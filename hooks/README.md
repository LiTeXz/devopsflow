# Agent Hook Scripts

本目录保存 plugin Hook 配置，以及 Codex or agent lifecycle Hook 单独调用的可执行脚本及其回归测试.

`hooks/hooks.codex.json` 保存 plugin Hook 配置; 本目录的时机子目录保存配置所调用 or 下游安装所需的 TypeScript 实现. 普通 repository 校验脚本继续保留在 `scripts/` 根目录, 不应迁入这里.

## Layout

- `pre-tool-use/`: 工具执行前的权限 and operation 门禁.
- `session-start/`: session 启动阶段的环境 or branch 检查.
- `subagent/`: Codex worker lifecycle state and 写入权限控制.

`SessionStart` 会在 `cwd/.git` 是 directory 时从 `origin` 获取并以 fast-forward-only 方式更新 `dev`, `main`, `master`, `develop`, `devlop`; 分支不存在时跳过，无法安全更新时阻止启动流程并要求 Agent 与 user 协商冲突处理.

`PreToolUse` 禁止所有 Agent 执行 `git push`, 并禁止在上述 protected branch 执行 `git commit`; 命中后要求 user 先 review 当前 code, 再逐个 manual commit and push.
