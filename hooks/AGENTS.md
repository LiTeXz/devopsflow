<!-- BEGIN:hooks/AGENTS.md -->
# hooks/AGENTS.md

Codex Hooks 官方文档:[Hooks](https://learn.chatgpt.com/docs/hooks).

this directory 用于维护 Codex Hooks. 新增, 修改 or 审查 Hook 时, if 对 event, 字段, matcher, input output protocol, execution 顺序, 信任机制 or run 行为存在任何不确定, 必须先查询上述官方文档, 不得依赖猜测 or 过时 example.

## Type Definitions

```typescript
/** Input delivered to a command hook when a subagent starts. */
export interface SubagentStartInput {
  /** Current Codex session id; subagent hooks use the parent session id. */
  session_id: string
  /** Path to the session transcript, or null when unavailable. */
  transcript_path: string | null
  /** Working directory of the Codex session. */
  cwd: string
  /** Name of the lifecycle event. */
  hook_event_name: 'SubagentStart'
  /** Active Codex model slug. */
  model: string
  /** Active Codex turn id. */
  turn_id: string
  /** Identifier assigned to the subagent. */
  agent_id: string
  /** Subagent type or profile used for this run. */
  agent_type: string
  /** Current permission mode for the subagent. */
  permission_mode: 'default' | 'acceptEdits' | 'plan' | 'dontAsk' | 'bypassPermissions'
}
```

```typescript
/** JSON output optionally returned by a SubagentStart command hook. */
export interface SubagentStartOutput {
  /** Common lifecycle status; false is parsed but does not stop the subagent. */
  continue?: boolean
  /** Optional reason recorded when the hook reports a stop condition. */
  stopReason?: string
  /** Warning or informational message surfaced by Codex. */
  systemMessage?: string
  /** Parsed for compatibility but not currently implemented. */
  suppressOutput?: boolean
  /** Event-specific context added to the subagent's developer context. */
  hookSpecificOutput?: {
    /** Name of the lifecycle event that produced this output. */
    hookEventName: 'SubagentStart'
    /** Additional instructions or context for the subagent. */
    additionalContext?: string
  }
}
```

## Scope

this directory 保存 DevopsFlow plugin 随附的 Codex lifecycle hooks. this file 记录完整能力摘要 and this directory 的维护约束.

## Current Configuration

`hooks.codex.json` 当前注册 `SessionStart` and `PreToolUse` matcher group. `SessionStart` 按顺序声明三个 `type: "command"` handler:

- use `${PLUGIN_ROOT}` 定位 installed plugin directory, run `df-codex-assets.ts hydrate`, 确保受管 subagent 配置集合存在.
- run `df-codex-assets.ts sync-project-gitignore`, 确保 project `.gitignore` rule 存在.
- run `update-protected-branches.ts`, fetch `origin` 并 fast-forward-only update 实际存在的 protected branch.

`PreToolUse` 对 shell tool run `prevent-git-push-protected-commit.ts`: 禁止任何 Agent push, 并禁止在 protected branch commit.

新增 or 修改 Hook 时必须同步 check plugin manifest, script 路径, Windows 行为, 信任提示 and 相关 tests; 不要把 this directory 的当前配置误 write 成 Codex 的全部 default event.

## Lifecycle Events

Codex 在以下时机触发 Hook:

| 时机 | event |
| --- | --- |
| 会话 or 子 agent 启动 | `SessionStart`,`SubagentStart` |
| 1 轮 execution 期间 | `UserPromptSubmit`,`PreToolUse`,`PermissionRequest`,`PostToolUse`,`PreCompact`,`PostCompact`,`SubagentStop`,`Stop` |
| 主线程会话结束 | `SessionEnd`(不对 subagent 触发) |

多个配置源中匹配的 Hook 会全部 run; 相同 event 的多个 command hook 并发启动, 因此 1 个 Hook 不能阻止 other Hook 启动.`SessionEnd` 始终同步 execution.

## Configuration

Codex 从每个活动配置层加载 `hooks.json`, 也支持 `config.toml` 中的内联 `[hooks]` 表:

- user:`~/.codex/hooks.json` or `~/.codex/config.toml`
- project:`<repo>/.codex/hooks.json` or `<repo>/.codex/config.toml`
- plugin: plugin 根 directory default `hooks/hooks.json`, or `.codex-plugin/plugin.json` 的 `hooks` 字段覆盖
- 企业管理:`requirements.toml` 中的 `[hooks]`

不同层不会互相覆盖, 而是合并所有匹配项. 相同层同时存在 `hooks.json` and 内联 `[hooks]` 时会合并并发出启动警告, 原则上每层只使用 1 种表示.

标准结构是"event -> matcher group -> handlers":

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

Handler 字段:

- `type`: 当前只有 `command` 会 execution;`prompt`,`agent` 会解析但跳过.
- `command`: 要 run 的命令; working directory 是会话 `cwd`. Windows 可使用 `commandWindows`(TOML 也接受 `command_windows`). repository Hook 应从 git root 解析 script 路径.
- `timeout`: 秒; 大多数 event default `600` 秒,`SessionEnd` default `1` 秒且上限 `3` 秒.
- `statusMessage`: 可选的 run 状态文本.
- `additionalContextLimit`:`additionalContext` 送入模型前的近似 token 上限, default 约 `2500`; 超出会 spill 到临时 file 并发送头尾预览,`0` 表示不限制.
- `async`: 设为 `true` 后在后台 run(`SessionEnd` 例外, 始终同步).

Hooks default enable; 可在 `config.toml` 用 `[features].hooks = false` 关闭, 旧别名 `codex_hooks` 仍兼容. 管理员可在 `requirements.toml` 强制开启.

## Trust And Management

非 managed command Hook 在首次出现 or definition 哈希变化后必须人工 review/trust; 未信任时会跳过. CLI 的 `/hooks` 可查看来源, 审核, 信任 or disable 单个 Hook.`--dangerously-bypass-hook-trust` 仅适用于已在外部完成审核的 1 次完成自动化.

来自 system, MDM, cloud or `requirements.toml` 的 managed Hook 由策略信任且 user 不能在 Hook 浏览器中 disable.`allow_managed_hooks_only = true` 可忽略 user, project, session, plugin Hook, 只保留管理 Hook; script 由企业设备管理 system 自行部署,`managed_dir` and `windows_managed_dir` 应使用绝对路径.

plugin Hook 由 `.codex-plugin/plugin.json` 的 `hooks` 字段声明, 可采用根 directory 内的 `./` 路径, 路径数组, 内联 object or object 数组. 路径不得越出 plugin 根 directory. plugin Hook 可使用 `PLUGIN_ROOT`,`PLUGIN_DATA`, 并兼容 `CLAUDE_PLUGIN_ROOT`,`CLAUDE_PLUGIN_DATA`; enable plugin 不会自动信任其 Hook.

## Matchers And Coverage

`matcher` 是正则字符串;`*`, 空字符串 or 省略表示全部匹配. 当前匹配字段如下:

| event | matcher 过滤 object |
| --- | --- |
| `PreToolUse`,`PermissionRequest`,`PostToolUse` | 工具名;`apply_patch` 还 available `Edit`,`Write` |
| `PreCompact`,`PostCompact` | `manual` or `auto` |
| `SessionStart` | `startup`,`resume`,`clear`,`compact` |
| `SessionEnd` | 当前仅 `other` |
| `SubagentStart`,`SubagentStop` | `agent_type` |
| `UserPromptSubmit`,`Stop` | 当前忽略 matcher |

工具 Hook 覆盖 shell(unified 匹配名 `Bash`),`exec_command`,`apply_patch`, MCP 工具 and other local function tools(如 `update_plan`,`Agent`). Hosted tools(如 `WebSearch`)不经过该路径;`write_stdin` 只是已有 exec 会话的传输, 不会再次触发 `PreToolUse`.

## Input And Output Contract

每个 command Hook 从 `stdin` 接收 1 个 JSON object, 通用字段 include `session_id`,`transcript_path`,`cwd`,`hook_event_name`,`model`; 多数 turn/subagent event 还提供 `turn_id`,`permission_mode`. Transcript 格式不是稳定接口, 不应依赖其内部结构.

可支持的通用 output 字段:`continue`,`stopReason`,`systemMessage`,`suppressOutput`(后者目前只解析, 未 implementation). exit code `0` 且无 output 表示成功继续.`PreToolUse`,`PermissionRequest` 不支持 `continue`/`stopReason`; return 不支持字段会报告 Hook 失败但继续原操作.

stdout 的纯文本在 `SessionStart`,`SubagentStart`,`UserPromptSubmit` 中作为额外 developer context;`PreToolUse`,`PermissionRequest`,`PostToolUse`, 压缩 event 不接受普通文本. 过大的 `additionalContext` 会 spill 到 `<temp_dir>/hook_outputs/<session_id>/`, 应保持 output 简短.

后台 Hook 最多每个 session 并发 8 个, 不能阻止, 批准, rewrite 触发它的操作; 会话结束时未完成 task 会取消且未投递 output 会丢弃. 需要策略决策时必须使用同步 Hook.

## Event Capabilities

- `SessionStart`: 按启动来源匹配; 可注入 `hookSpecificOutput.additionalContext`. 压缩后(include 自动压缩中途)会在后续模型请求前 run.
- `SessionEnd`: 主线程结束时保存笔记 or 清理; output 不能 change 会话 or 保持线程, 超时/错误会报告失败.
- `SubagentStart`: 按 `agent_type` 注入 subagent context;`continue: false` 不会阻止启动. input and output type 见文档开头的 `Type Definitions`.
- `PreToolUse`: run 前 check 工具; 可 `permissionDecision: deny` 阻止, or `allow` + `updatedInput` 重 write 参数; exit code `2` 并 write stderr 也可阻止. 支持 `additionalContext`.
- `PermissionRequest`: 审批即将发生的请求; 可 return `decision.behavior: allow`,`deny`(含 `message`), or 不决策以保留正常审批. 多个 Hook 中 any deny 优先.
- `PostToolUse`: 工具完成后审查(include 非零 exit); 不能撤销副作用, available `decision: block`/exit code `2` 提供反馈, or `continue: false` 替换 result.
- `PreCompact`: 压缩前按 `manual`/`auto` run;`continue: false` 可取消压缩.
- `PostCompact`: 压缩后 run;`continue: false` 可停止后续处理.
- `UserPromptSubmit`: 提交 prompt 前 check or 注入 context; available `decision: block` or exit code `2` 拒绝 prompt. matcher 当前无效.
- `SubagentStop`: check subagent 停止 result; available `decision: block` 要求继续, any `continue: false` 优先. exit code `0` 时必须 output JSON.
- `Stop`: 主 turn 停止时 check;`decision: block` 会以 reason 自动 create continuation prompt,`continue: false` 优先. exit code `0` 时必须 output JSON.

## Maintenance Rules

Hook 命令必须可审计, 最小权限, 幂等并明确超时; 禁止把密钥, 完整 transcript or 大段工具 output write 模型 context. 修改 `hooks.codex.json` 后 run repository 的 Bun/Biome verify and 相关 Hook tests, 并 check JSON 语法, plugin 根路径约束及当前 work 树中的无关 change.

<!-- END:hooks/AGENTS.md -->
