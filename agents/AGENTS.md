<!-- BEGIN:agents/AGENTS.md -->
# agents/AGENTS.md

Codex Subagents 官方文档:[Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents). 完整配置字段以 [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference) 为准.

this directory 维护 Codex custom agent 配置. 新增, 修改 or 审查 agent 时, if 对字段, 继承优先级, model, reasoning effort, sandbox, permission, MCP, skill or subagent 调度行为存在任何不确定, 必须先查询上述官方文档, 不得依赖猜测 or 过时 example.

## Hydrated Project Context

this directory 中的 agent 配置会被 hydration, 复制 or install 到 other project 后使用. write 时必须假定 spawned agent 当前处于 user 指定的 target project, 而不是 DevopsFlow 源 code repository; agent 的职责是 service target project 的实际 task.

- `description`,`developer_instructions` and example 不得把 DevopsFlow write 成 default code repository, work directory, file 树 or unique 业务 domain.
- 不得 write 只在 this repository 成立的相对路径, module 名, 构建命令, 分支名, 临时状态 or file 存在性假设; 路径 and 命令必须从 target project 当前状态发现, or 明确标注为可选/plugin resources 路径.
- agent 可以提及 DevopsFlow 作为 plugin, 产品, 配置提供方 or 分发来源, 但不得以"只 service DevopsFlow project"的角色态位进行调度.
- 指令需要访问 file or directory 时, 应以 session `cwd` 为 target project root, 先 check 再操作; 不要回到源 repository 寻找 implementation 材料.
- 修改 agent 时必须同时审查 file 名, TOML 字段, 角色自称, default prompt and 验证要求, 确保 hydration 后仍能访问 target project 并 return target project 语境下的证据.

## Type Definitions

以下 TypeScript 仅用于表达 TOML schema and 字段语义, 不是需要编译 or 提交的 runtime code.

```typescript
/** Reasoning levels accepted when supported by the selected model. */
export type ModelReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "ultra";

/** Filesystem isolation applied to the custom agent session. */
export type SandboxMode =
  | "read-only"
  | "workspace-write"
  | "danger-full-access";

/** Web-search source selected for the custom agent session. */
export type WebSearchMode = "disabled" | "cached" | "indexed" | "live";

/** Communication style used when the selected model supports personalities. */
export type Personality = "none" | "friendly" | "pragmatic";

/** Per-skill enablement override inherited by the custom agent session. */
export interface SkillConfig {
  /** Path to a directory that contains SKILL.md. */
  path: string;
  /** Enables or disables this skill for the agent. */
  enabled: boolean;
}

/** Common MCP server settings that a custom agent may override. */
export interface McpServerConfig {
  /**
   * Executable used by a stdio MCP server.
   * @default undefined
   */
  command?: string;
  /**
   * Arguments passed to the stdio server executable.
   * @default []
   */
  args?: string[];
  /**
   * Working directory of the stdio server process.
   * @default Inherited session working directory
   */
  cwd?: string;
  /**
   * Streamable HTTP endpoint; use this instead of command for remote servers.
   * @default undefined
   */
  url?: string;
  /**
   * Enables or disables the server without deleting its configuration.
   * @default true
   */
  enabled?: boolean;
  /**
   * Makes agent startup fail when this server cannot initialize.
   * @default false
   */
  required?: boolean;
  /**
   * Maximum server startup time in seconds.
   * @default 10
   */
  startup_timeout_sec?: number;
  /**
   * Maximum time allowed for an MCP tool call in seconds.
   * @default 60
   */
  tool_timeout_sec?: number;
  /**
   * Allowlist of tools exposed from this server.
   * @default All server tools
   */
  enabled_tools?: string[];
  /**
   * Denylist applied after enabled_tools.
   * @default []
   */
  disabled_tools?: string[];
}

/** Schema for one standalone file under ~/.codex/agents or .codex/agents. */
export interface CustomAgentConfig {
  /** Stable agent identifier used for spawning and references. */
  name: string;
  /** Routing guidance describing when Codex should use this agent. */
  description: string;
  /** Core role, constraints, workflow, validation, and output instructions. */
  developer_instructions: string;

  /**
   * Optional display aliases suggested for the agent.
   * @default []
   */
  nickname_candidates?: string[];
  /**
   * Overrides the model selected for this agent.
   * @default Resolved from the spawn value, [agents] default, then parent
   */
  model?: string;
  /**
   * Overrides reasoning effort when supported by the selected model.
   * @default Resolved from the spawn value, [agents] default, then parent
   */
  model_reasoning_effort?: ModelReasoningEffort;
  /**
   * Overrides the inherited filesystem sandbox for this agent.
   * @default Inherited from the parent agent
   */
  sandbox_mode?: SandboxMode;
  /**
   * Controls when this agent asks for approval before restricted actions.
   * @default Inherited from the parent agent
   */
  approval_policy?: "untrusted" | "on-request" | "never";
  /**
   * Selects the web-search source available to this agent.
   * @default Inherited; normally "cached", or "live" in full-access mode
   */
  web_search?: WebSearchMode;
  /**
   * Selects the agent communication style when supported by the model.
   * @default Inherited from the parent agent
   */
  personality?: Personality;
  /**
   * Overrides the model context-window size known to Codex.
   * @default Derived from the selected model
   */
  model_context_window?: number;
  /**
   * Starts automatic compaction near this token count.
   * @default Derived from the selected model
   */
  model_auto_compact_token_limit?: number;
  /**
   * Adds or overrides MCP servers available to this agent.
   * @default Inherited from the parent agent
   */
  mcp_servers?: Record<string, McpServerConfig>;
  /**
   * Enables or disables individual skills for this agent.
   * @default Inherited from the parent agent
   */
  skills?: {
    /**
     * Per-skill enablement overrides.
     * @default Inherited from the parent agent
     */
    config?: SkillConfig[];
  };
}

/** Global subagent settings configured under [agents] in config.toml. */
export interface AgentsConfig {
  /**
   * Enables or disables multi-agent tools.
   * @default true
   */
  enabled?: boolean;
  /**
   * Caps concurrently open spawned-agent threads, excluding the primary.
   * @default Codex-selected limit
   */
  max_concurrent_threads_per_session?: number;
  /**
   * Default model used when neither the spawn nor agent file selects one.
   * @default Parent agent model
   */
  default_subagent_model?: string;
  /**
   * Default reasoning effort used when no more specific value is set.
   * @default Parent effort, or the selected model default after a model change
   */
  default_subagent_reasoning_effort?: ModelReasoningEffort;
  /**
   * Records a model-visible message when an agent turn is interrupted.
   * @default true
   */
  interrupt_message?: boolean;
  /**
   * Legacy alias for max_concurrent_threads_per_session.
   * @default Codex-selected limit
   * @deprecated Legacy alias for max_concurrent_threads_per_session.
   */
  max_threads?: number;
}
```

this file 适用于 `agents/` directory 及其全部子 directory.

## Distribution Model

- 当前 directory 中的所有 `.toml` file 都是可分发的 Codex subagent 配置源, 最终都会被复制, 同步 or 合入 other project 的 `.codex/agents/` directory; 不要把它们视为只在 DevopsFlow repository 内使用的 local 配置.
- 保持配置可移植, 不要 write 仅在 this repository 成立的绝对路径, 临时状态 or 未声明的环境假设.
- 修改现有 `.toml` 时兼顾下游兼容性; 除非迁移方案明确要求, 否则不要随意重命名 `name`, 删除既有职责 or 扩大权限.
- 新增 or 修改分发机制时, 同步 check 负责复制这些 file 的 hook, install script, 版本 verify and 回归 tests.

## Custom Agent Authoring

OpenAI Codex 使用独立 TOML file define custom agent. 个人级配置位于 `~/.codex/agents/`, project 级配置位于 `.codex/agents/`; 每个 file define 1 个 agent. this directory 维护的是供 other project install 的源 file.

每个 custom agent file 必须 include:

- `name`: Codex 用于识别 and 调度 agent 的稳定 name, 以该字段为准, file 名最好保持 consistent.
- `description`: 面向调度器的使用说明, 明确该 agent 适合处理什么 task 以及何时不应使用.
- `developer_instructions`: definition 角色, 职责, 约束, workflow, 验证要求 and return 格式的核心指令.

按需配置 `model`,`model_reasoning_effort`,`sandbox_mode`,`approval_policy`,`web_search`,`personality`,`model_context_window`,`model_auto_compact_token_limit`,`mcp_servers` or `skills.config` 等受支持的 Codex session 配置键. Custom agent file 作为 spawned session 的配置层, 可使用普通 `config.toml` 支持的 session 配置; 只覆盖该角色确实需要不同于父 agent 的字段.

字段解析优先级: 显式 spawn 参数优先于 `[agents]` default value, agent file 中显式设置的 `model` or `model_reasoning_effort` 再按官方 rule participate in parsing, 未配置的 other session 设置从父 agent 继承. 若 spawn change 了 model 但没有任何显式 or default reasoning effort, 则使用该 model 的 default effort.

常用可选字段及作用:

- `nickname_candidates`: 提供 agent 的候选显示别名; 这是当前 DevopsFlow agent 使用的扩展字段, 不应替代作为身份来源的 `name`.
- `model`: 为职责明确的 agent 固定模型; 省略时允许 Codex 根据 spawn,`[agents]` default value and 父 agent 配置解析.
- `model_reasoning_effort`: 控制推理深度, 延迟 and token 消耗; 只使用 target model 实际支持的等级.
- `sandbox_mode`: 覆盖 file system 隔离级别; 审查 and 探索优先 `read-only`, implementation task 通常使用 `workspace-write`, 避免无必要的 `danger-full-access`.
- `approval_policy`: 控制受限操作的审批策略;`on-failure` 已弃用, 不要用于新配置.
- `web_search`: 选择 `disabled`,`cached`,`indexed` or `live` 搜索模式; 旧的 `features.web_search*` 开关已弃用.
- `personality`: 在 model 支持时选择 `none`,`friendly` or `pragmatic` 沟通风格.
- `model_context_window`: 显式告知 Codex model available 的 context 窗口; 只有自 definition or 非标准 model 配置确实需要时才覆盖.
- `model_auto_compact_token_limit`: 设置自动压缩 threshold; 必须低于 available context 并为 output, 工具 result and 后续轮次保留空间.
- `mcp_servers`: 按 agent 职责添加, 覆盖, disable or 限制 MCP server; 使用 `enabled_tools`/`disabled_tools` 缩小工具面,`required = true` 会使 server 初始化失败成为启动失败.
- `skills.config`: 按路径 enable or disable 特定 skill; 路径指向 include `SKILL.md` 的 directory.

最小 example:

```toml
name = "example_reviewer"
description = "只读审查 agent, 用于发现正确性风险, 行为回归 and 测试缺口."
sandbox_mode = "read-only"

developer_instructions = """
审查委托范围内的变更, 不修改 file.
优先报告正确性, 安全性, 行为回归 and 测试缺口.
每项发现包含 file 位置, 影响, 证据 and 建议.
没有发现时明确说明, 并列出尚未验证的风险.
"""
```

project 可在 `.codex/config.toml` 的 `[agents]` 表中配置:

- `enabled`: 是否 enable multi-agent tools, default `true`.
- `max_concurrent_threads_per_session`: 限制当前 session 同时打开的 spawned-agent threads, 不计 primary thread;`max_threads` 是兼容旧配置的 alias.
- `default_subagent_model`: spawn and agent file 未指定时使用的 default subagent model.
- `default_subagent_reasoning_effort`: 未指定更具体 value 时使用的 default reasoning effort.
- `interrupt_message`: agent turn 被中断时是否向其 context write model-visible message, default `true`.

task 由 user 直接要求 Codex 使用 subagent, or 由适用的 `AGENTS.md` / skill 指令触发; 委托提示应说明如何拆分 work, 是否等待全部 agent, 以及期望汇总的内容.

## Naming Boundaries

Agent name 必须使用 `df-<category>-<role>` 前缀, 前缀表示职责边界:

- `df-dev-*`: development work, include 后端, 前端, tests development, 数据库 implementation and 调优.
- `df-ops-*`: 运维 and 交付, include 发布制品, Docker, Jenkins, CI/CD, 环境 and code 托管.
- `df-doc-*`: 文档编纂, include 维护说明, 迁移指南, change 记录, example and consistency check.
- `df-ai-*`: AI 相关 work, include agent prompt, 模型交互策略, 评测, context 编排 and AI 工具 integration.

file 名, TOML `name` and 主要自称必须保持 consistent. 新增 agent 应选择 unique 且最窄的 category; 跨 category task 由主 agent 协调, 不要用模糊命名扩大单个 agent 的职责.

每个 agent TOML 必须以独占末行 comment `# DF_AGENT_EOF` 结尾. 该标记位于 `developer_instructions` 的结束引号之后, 用于确认配置完整; 新增 or 修改 agent 时不得省略, 移动 or 在其后追加内容.

## Best Practices

- 保持职责窄而明确. 1 个 agent 聚焦 1 种可判断的 work, 例如 code 探索, tests 缺口审查 or 文档核验, 避免把互相冲突的角色塞进相同配置.
- 把 `description` write 成调度契约, 说明适用 task, 触发条件 and 边界; 把稳定的 execution rule 放进 `developer_instructions`, 不要只重复角色 name.
- 明确 input, output and 完成标准. 要求 subagent return 经过提炼的结论, 证据 and file 引用, 不要把大段日志 or 未经整理的中间 output 带回主线程.
- 优先并行 execution 相互独立, 以读取为主的探索, tests, category and 总结 task. 多个 agent 同时 write 相同批 file 容易产生冲突 and 协调成本, 只有 file 所有权 and 依赖边界清楚时才并行 write.
- 为 write 型 agent 指定负责的 file or module, 并要求保留 other agent and user 的现有修改; 共享 work 区中不得回滚不属于自己的 change.
- 权限遵循最小化原则. 只读研究 or 审查 agent 应使用 `sandbox_mode = "read-only"`; 只有 task 确实需要时才开放 write, 网络 or 额外工具.
- 根据 task 难度选择 model and reasoning effort. 轻量扫描 and 高并发 task 优先考虑速度 and 成本, 复杂审查, 模糊决策 or 多步验证再提高推理强度; 避免无理由固定高成本配置.
- 为专用 agent 提供 and 职责匹配的工具 and MCP server, 并在指令中说明工具用途; 不要赋予不会使用 or 不应使用的能力.
- 让主 agent 保留需求, 决策 and 最终整合责任. subagent 负责有界子 task, 主 agent 应等待所需 result, 处理冲突并给出 unified 结论.
- 预计 subagent 会增加 token 消耗. 只有可并行性, 隔离噪声 or 专业化带来的收益足够明显时才委托.

## Official References

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): custom agent file 位置, 必填字段, 配置继承, 触发方式, 模型选择, 并行策略 and example.
- [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference):`[agents]`, model, reasoning, sandbox, approval, MCP, skill and other TOML 配置键的权威 definition.

<!-- END:agents/AGENTS.md -->
