# Agent Hook Scripts

本目录保存 plugin Hook 配置，以及供 Codex 或 agent lifecycle Hook 独立调用的 TypeScript 实现和回归测试。通用 repository 校验脚本保留在 `scripts/`，不应迁入本目录。

## Layout

- `pre-tool-use/`: 工具执行前的权限与操作门禁。
- `post-tool-use/`: 工具执行后的聚焦格式化与结果检查。
- `session-start/`: session 启动阶段的环境与分支检查。
- `subagent/`: Codex worker lifecycle state 和写入权限控制。

`SessionStart` 在 `cwd/.git` 为 directory 时从 `origin` 获取并 fast-forward-only 更新实际存在的 `dev`、`main`、`master`、`develop`、`devlop`；分支不存在时跳过，无法安全更新时阻止启动并要求 Agent 与 user 协商冲突处理。

`PreToolUse` 禁止所有 Agent 执行 `git commit` 和 `git push`，并禁止使用 `--no-verify`、`-n`、`core.hooksPath` 或关闭 Husky/Lefthook 的环境变量跳过本地 hooks。命中后必须提醒 user：Husky 和 Lefthook 检查是必要流程，不能跳过；完成检查后由 user 手动 commit 和 push。

`PostToolUse` 在成功的 `apply_patch` 完成后解析 patch 中新增或更新的文件；matcher 同时兼容官方 `Edit`/`Write` alias，而 hook input 仍使用 canonical `tool_name: "apply_patch"`。仅当当前 Git repository 声明 `biome.json` 或 `biome.jsonc` 时，才对 repository 内实际存在的目标运行本地已安装的 Biome `format --write`；删除、缺失、绝对路径和 repository 外路径会被跳过。formatter 不可用或失败时 hook 不会隐式安装依赖，并保持 fail-open，通过简短 `systemMessage` 报告原因。
