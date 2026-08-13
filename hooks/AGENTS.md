<!-- BEGIN hooks/AGENTS.md -->
# hooks/AGENTS.md

Codex Hooks 官方文档：[Hooks](https://learn.chatgpt.com/docs/hooks)。

本目录用于维护 Codex Hooks。新增、修改或审查 Hook 时，如果对事件、字段、matcher、输入输出协议、执行顺序、信任机制或运行行为存在任何不确定，必须先查询上述官方文档，不得依赖猜测或过时示例。

## Type Definitions

```typescript
/** Input delivered to a command hook when a subagent starts. */
export interface SubagentStartInput {
  /** Current Codex session id; subagent hooks use the parent session id. */
  session_id: string;
  /** Path to the session transcript, or null when unavailable. */
  transcript_path: string | null;
  /** Working directory of the Codex session. */
  cwd: string;
  /** Name of the lifecycle event. */
  hook_event_name: "SubagentStart";
  /** Active Codex model slug. */
  model: string;
  /** Active Codex turn id. */
  turn_id: string;
  /** Identifier assigned to the subagent. */
  agent_id: string;
  /** Subagent type or profile used for this run. */
  agent_type: string;
  /** Current permission mode for the subagent. */
  permission_mode:
    | "default"
    | "acceptEdits"
    | "plan"
    | "dontAsk"
    | "bypassPermissions";
}
```

```typescript

/** JSON output optionally returned by a SubagentStart command hook. */
export interface SubagentStartOutput {
  /** Common lifecycle status; false is parsed but does not stop the subagent. */
  continue?: boolean;
  /** Optional reason recorded when the hook reports a stop condition. */
  stopReason?: string;
  /** Warning or informational message surfaced by Codex. */
  systemMessage?: string;
  /** Parsed for compatibility but not currently implemented. */
  suppressOutput?: boolean;
  /** Event-specific context added to the subagent's developer context. */
  hookSpecificOutput?: {
    /** Name of the lifecycle event that produced this output. */
    hookEventName: "SubagentStart";
    /** Additional instructions or context for the subagent. */
    additionalContext?: string;
  };
}
```

## Scope

本目录保存 DevopsFlow 插件随附的 Codex lifecycle hooks。本文记录完整能力摘要和本目录的维护约束。

## Current Configuration

`hooks.codex.json` 当前只注册一个 `SessionStart` matcher group，并按顺序声明两个 `type: "command"` handler：

- 使用 `${PLUGIN_ROOT}` 定位插件安装目录，运行 `df-codex-assets.ts hydrate`，确保受管 subagent 配置集合存在。
- 运行 `df-codex-assets.ts sync-project-gitignore`，确保项目 `.gitignore` 规则存在。

新增或修改 Hook 时必须同步检查插件清单、脚本路径、Windows 行为、信任提示和相关测试；不要把本目录的当前配置误写成 Codex 的全部默认事件。

## Lifecycle Events

Codex 在以下时机触发 Hook：

| 时机 | 事件 |
| --- | --- |
| 会话或子代理启动 | `SessionStart`、`SubagentStart` |
| 一轮执行期间 | `UserPromptSubmit`、`PreToolUse`、`PermissionRequest`、`PostToolUse`、`PreCompact`、`PostCompact`、`SubagentStop`、`Stop` |
| 主线程会话结束 | `SessionEnd`（不对 subagent 触发） |

多个配置源中匹配的 Hook 会全部运行；同一事件的多个 command hook 并发启动，因此一个 Hook 不能阻止另一个 Hook 启动。`SessionEnd` 始终同步执行。

## Configuration

Codex 从每个活动配置层加载 `hooks.json`，也支持 `config.toml` 中的内联 `[hooks]` 表：

- 用户：`~/.codex/hooks.json` 或 `~/.codex/config.toml`
- 项目：`<repo>/.codex/hooks.json` 或 `<repo>/.codex/config.toml`
- 插件：插件根目录默认 `hooks/hooks.json`，或 `.codex-plugin/plugin.json` 的 `hooks` 字段覆盖
- 企业管理：`requirements.toml` 中的 `[hooks]`

不同层不会互相覆盖，而是合并所有匹配项。同一层同时存在 `hooks.json` 和内联 `[hooks]` 时会合并并发出启动警告，原则上每层只使用一种表示。

标准结构是“事件 -> matcher group -> handlers”：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bun .codex/hooks/check.ts",
            "timeout": 30,
            "statusMessage": "Checking command"
          }
        ]
      }
    ]
  }
}
```

Handler 字段：

- `type`：当前只有 `command` 会执行；`prompt`、`agent` 会解析但跳过。
- `command`：要运行的命令；工作目录是会话 `cwd`。Windows 可用 `commandWindows`（TOML 也接受 `command_windows`）。仓库 Hook 应从 git root 解析脚本路径。
- `timeout`：秒；大多数事件默认 `600` 秒，`SessionEnd` 默认 `1` 秒且上限 `3` 秒。
- `statusMessage`：可选的运行状态文本。
- `additionalContextLimit`：`additionalContext` 送入模型前的近似 token 上限，默认约 `2500`；超出会 spill 到临时文件并发送头尾预览，`0` 表示不限制。
- `async`：设为 `true` 后在后台运行（`SessionEnd` 例外，始终同步）。

Hooks 默认启用；可在 `config.toml` 用 `[features].hooks = false` 关闭，旧别名 `codex_hooks` 仍兼容。管理员可在 `requirements.toml` 强制开启。

## Trust And Management

非 managed command Hook 在首次出现或定义哈希变化后必须人工 review/trust；未信任时会跳过。CLI 的 `/hooks` 可查看来源、审核、信任或禁用单个 Hook。`--dangerously-bypass-hook-trust` 仅适用于已在外部完成审核的一次性自动化。

来自 system、MDM、cloud 或 `requirements.toml` 的 managed Hook 由策略信任且用户不能在 Hook 浏览器中禁用。`allow_managed_hooks_only = true` 可忽略用户、项目、session、plugin Hook，只保留管理 Hook；脚本由企业设备管理系统自行部署，`managed_dir` 与 `windows_managed_dir` 应使用绝对路径。

插件 Hook 通过 `.codex-plugin/plugin.json` 的 `hooks` 指向根目录内的 `./` 路径、路径数组、内联对象或对象数组。路径不得越出插件根目录。插件 Hook 可使用 `PLUGIN_ROOT`、`PLUGIN_DATA`，并兼容 `CLAUDE_PLUGIN_ROOT`、`CLAUDE_PLUGIN_DATA`；启用插件不会自动信任其 Hook。

## Matchers And Coverage

`matcher` 是正则字符串；`*`、空字符串或省略表示全部匹配。当前匹配字段如下：

| 事件 | matcher 过滤对象 |
| --- | --- |
| `PreToolUse`、`PermissionRequest`、`PostToolUse` | 工具名；`apply_patch` 还可用 `Edit`、`Write` |
| `PreCompact`、`PostCompact` | `manual` 或 `auto` |
| `SessionStart` | `startup`、`resume`、`clear`、`compact` |
| `SessionEnd` | 当前仅 `other` |
| `SubagentStart`、`SubagentStop` | `agent_type` |
| `UserPromptSubmit`、`Stop` | 当前忽略 matcher |

工具 Hook 覆盖 shell（统一匹配名 `Bash`）、`exec_command`、`apply_patch`、MCP 工具和其他本地 function tools（如 `update_plan`、`Agent`）。Hosted tools（如 `WebSearch`）不经过该路径；`write_stdin` 只是已有 exec 会话的传输，不会再次触发 `PreToolUse`。

## Input And Output Contract

每个 command Hook 从 `stdin` 接收一个 JSON 对象，通用字段包括 `session_id`、`transcript_path`、`cwd`、`hook_event_name`、`model`；多数 turn/subagent 事件还提供 `turn_id`、`permission_mode`。Transcript 格式不是稳定接口，不应依赖其内部结构。

可支持的通用输出字段：`continue`、`stopReason`、`systemMessage`、`suppressOutput`（后者目前只解析、未实现）。退出码 `0` 且无输出表示成功继续。`PreToolUse`、`PermissionRequest` 不支持 `continue`/`stopReason`；返回不支持字段会报告 Hook 失败但继续原操作。

stdout 的纯文本在 `SessionStart`、`SubagentStart`、`UserPromptSubmit` 中作为额外 developer context；`PreToolUse`、`PermissionRequest`、`PostToolUse`、压缩事件不接受普通文本。过大的 `additionalContext` 会 spill 到 `<temp_dir>/hook_outputs/<session_id>/`，应保持输出简短。

后台 Hook 最多每个 session 并发 8 个，不能阻止、批准、改写触发它的操作；会话结束时未完成任务会取消且未投递输出会丢弃。需要策略决策时必须使用同步 Hook。

## Event Capabilities

- `SessionStart`：按启动来源匹配；可注入 `hookSpecificOutput.additionalContext`。压缩后（包括自动压缩中途）会在下一次模型请求前运行。
- `SessionEnd`：主线程结束时保存笔记或清理；输出不能改变会话或保持线程，超时/错误会报告失败。
- `SubagentStart`：按 `agent_type` 注入 subagent context；`continue: false` 不会阻止启动。输入和输出类型见文档开头的 `Type Definitions`。
- `PreToolUse`：运行前检查工具；可 `permissionDecision: deny` 阻止，或 `allow` + `updatedInput` 重写参数；退出码 `2` 并写 stderr 也可阻止。支持 `additionalContext`。
- `PermissionRequest`：审批即将发生的请求；可返回 `decision.behavior: allow`、`deny`（含 `message`），或不决策以保留正常审批。多个 Hook 中任一 deny 优先。
- `PostToolUse`：工具完成后审查（包括非零退出）；不能撤销副作用，可用 `decision: block`/退出码 `2` 提供反馈，或 `continue: false` 替换结果。
- `PreCompact`：压缩前按 `manual`/`auto` 运行；`continue: false` 可取消压缩。
- `PostCompact`：压缩后运行；`continue: false` 可停止后续处理。
- `UserPromptSubmit`：提交 prompt 前检查或注入 context；可用 `decision: block` 或退出码 `2` 拒绝 prompt。matcher 当前无效。
- `SubagentStop`：检查 subagent 停止结果；可用 `decision: block` 要求继续，任一 `continue: false` 优先。退出码 `0` 时必须输出 JSON。
- `Stop`：主 turn 停止时检查；`decision: block` 会以 reason 自动创建 continuation prompt，`continue: false` 优先。退出码 `0` 时必须输出 JSON。

## Maintenance Rules

Hook 命令必须可审计、最小权限、幂等并明确超时；禁止把密钥、完整 transcript 或大段工具输出写入模型上下文。修改 `hooks.codex.json` 后运行仓库的 Bun/Biome 校验和相关 Hook 测试，并检查 JSON 语法、插件根路径约束及当前工作树中的无关变更。

<!-- END hooks/AGENTS.md -->
