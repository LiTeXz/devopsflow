<!-- BEGIN:agents/AGENTS.md -->
# agents/AGENTS.md

Codex Subagents 官方文档：[Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)。完整配置字段以 [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference) 为准。

本目录维护 Codex custom agent 配置。新增、修改或审查 agent 时，如果对字段、继承优先级、model、reasoning effort、sandbox、permission、MCP、skill 或 subagent 调度行为存在任何不确定，必须先查询上述官方文档，不得依赖猜测或过时示例。

## Hydrated Project Context

本目录中的 agent 配置会被 hydration、复制或安装到其他项目后使用。编写时必须假定 spawned agent 当前处于用户指定的目标项目，而不是 DevopsFlow 源码仓库；agent 的职责是服务目标项目的实际任务。

- `description`、`developer_instructions` 和示例不得把 DevopsFlow 写成默认代码仓库、工作目录、文件树或唯一业务领域。
- 不得写入只在本仓库成立的相对路径、模块名、构建命令、分支名、临时状态或文件存在性假设；路径和命令必须从目标项目当前状态发现，或明确标注为可选/插件资源路径。
- agent 可以提及 DevopsFlow 作为插件、产品、配置提供方或分发来源，但不得以“只服务 DevopsFlow 项目”的角色态位进行调度。
- 指令需要访问文件或目录时，应以 session `cwd` 为目标项目根，先检查再操作；不要回到源仓库寻找实现材料。
- 修改 agent 时必须同时审查文件名、TOML 字段、角色自称、默认 prompt 和验证要求，确保 hydration 后仍能访问目标项目并返回目标项目语境下的证据。

## Type Definitions

以下 TypeScript 仅用于表达 TOML schema 和字段语义，不是需要编译或提交的运行时代码。

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
   */
  max_threads?: number;
}
```

本文件适用于 `agents/` 目录及其全部子目录。

## Distribution Model

- 当前目录中的所有 `.toml` 文件都是可分发的 Codex subagent 配置源，最终都会被复制、同步或合入其他项目的 `.codex/agents/` 目录；不要把它们视为只在 DevopsFlow 仓库内使用的本地配置。
- 保持配置可移植，不要写入仅在本仓库成立的绝对路径、临时状态或未声明的环境假设。
- 修改现有 `.toml` 时兼顾下游兼容性；除非迁移方案明确要求，否则不要随意重命名 `name`、删除既有职责或扩大权限。
- 新增或修改分发机制时，同步检查负责复制这些文件的 hook、安装脚本、版本校验和回归测试。

## Custom Agent Authoring

OpenAI Codex 使用独立的 TOML 文件定义 custom agent。个人级配置位于 `~/.codex/agents/`，项目级配置位于 `.codex/agents/`；每个文件定义一个 agent。本目录维护的是供其他项目安装的源文件。

每个 custom agent 文件必须包含：

- `name`：Codex 用于识别和调度 agent 的稳定名称，以该字段为准，文件名最好与之保持一致。
- `description`：面向调度器的使用说明，明确该 agent 适合处理什么任务以及何时不应使用。
- `developer_instructions`：定义角色、职责、约束、工作流程、验证要求和返回格式的核心指令。

按需配置 `model`、`model_reasoning_effort`、`sandbox_mode`、`approval_policy`、`web_search`、`personality`、`model_context_window`、`model_auto_compact_token_limit`、`mcp_servers` 或 `skills.config` 等受支持的 Codex session 配置键。Custom agent 文件作为 spawned session 的配置层，可使用普通 `config.toml` 支持的 session 配置；只覆盖该角色确实需要不同于父 agent 的字段。

字段解析优先级：显式 spawn 参数优先于 `[agents]` 默认值，agent 文件中显式设置的 `model` 或 `model_reasoning_effort` 再按官方规则参与解析，未配置的其他 session 设置从父 agent 继承。若 spawn 改变了 model 但没有任何显式或默认 reasoning effort，则使用该 model 的默认 effort。

常用可选字段及作用：

- `nickname_candidates`：提供 agent 的候选显示别名；这是当前 DevopsFlow agent 使用的扩展字段，不应替代作为身份来源的 `name`。
- `model`：为职责明确的 agent 固定模型；省略时允许 Codex 根据 spawn、`[agents]` 默认值和父 agent 配置解析。
- `model_reasoning_effort`：控制推理深度、延迟和 token 消耗；只使用目标 model 实际支持的等级。
- `sandbox_mode`：覆盖文件系统隔离级别；审查和探索优先 `read-only`，实现任务通常使用 `workspace-write`，避免无必要的 `danger-full-access`。
- `approval_policy`：控制受限操作的审批策略；`on-failure` 已弃用，不要用于新配置。
- `web_search`：选择 `disabled`、`cached`、`indexed` 或 `live` 搜索模式；旧的 `features.web_search*` 开关已弃用。
- `personality`：在 model 支持时选择 `none`、`friendly` 或 `pragmatic` 沟通风格。
- `model_context_window`：显式告知 Codex model 可用的上下文窗口；只有自定义或非标准 model 配置确实需要时才覆盖。
- `model_auto_compact_token_limit`：设置自动压缩阈值；必须低于可用上下文并为输出、工具结果和后续轮次保留空间。
- `mcp_servers`：按 agent 职责添加、覆盖、禁用或限制 MCP server；使用 `enabled_tools`/`disabled_tools` 缩小工具面，`required = true` 会使 server 初始化失败成为启动失败。
- `skills.config`：按路径启用或禁用特定 skill；路径指向包含 `SKILL.md` 的目录。

最小示例：

```toml
name = "example_reviewer"
description = "只读审查 agent，用于发现正确性风险、行为回归和测试缺口。"
sandbox_mode = "read-only"

developer_instructions = """
审查委托范围内的变更，不修改文件。
优先报告正确性、安全性、行为回归和测试缺口。
每项发现包含文件位置、影响、证据和建议。
没有发现时明确说明，并列出尚未验证的风险。
"""
```

项目可在 `.codex/config.toml` 的 `[agents]` 表中配置：

- `enabled`：是否启用 multi-agent tools，默认 `true`。
- `max_concurrent_threads_per_session`：限制当前 session 同时打开的 spawned-agent threads，不计 primary thread；`max_threads` 是兼容旧配置的 alias。
- `default_subagent_model`：spawn 和 agent 文件未指定时使用的默认 subagent model。
- `default_subagent_reasoning_effort`：未指定更具体值时使用的默认 reasoning effort。
- `interrupt_message`：agent turn 被中断时是否向其 context 写入 model-visible message，默认 `true`。

任务通过直接要求 Codex 使用 subagent，或由适用的 `AGENTS.md` / skill 指令触发；委托提示应说明如何拆分工作、是否等待全部 agent，以及期望汇总的内容。

## Naming Boundaries

Agent 名称必须使用 `df-<category>-<role>` 前缀，前缀表示职责边界：

- `df-dev-*`：开发工作，包括后端、前端、测试开发、数据库实现与调优。
- `df-ops-*`：运维与交付，包括发布制品、Docker、Jenkins、CI/CD、环境和代码托管。
- `df-doc-*`：文档编纂，包括维护说明、迁移指南、变更记录、示例和一致性检查。
- `df-ai-*`：AI 相关工作，包括 agent 提示词、模型交互策略、评测、上下文编排和 AI 工具集成。

文件名、TOML `name` 和主要自称必须保持一致。新增 agent 选择唯一且最窄的分类；跨分类任务由主 agent 协调，不通过模糊命名扩大单个 agent 的职责。

每个 agent TOML 必须以独占末行注释 `# DF_AGENT_EOF` 结尾。该标记位于 `developer_instructions` 的结束引号之后，用于确认配置完整；新增或修改 agent 时不得省略、移动或在其后追加内容。

## Best Practices

- 保持职责窄而明确。一个 agent 聚焦一种可判断的工作，例如代码探索、测试缺口审查或文档核验，避免把互相冲突的角色塞进同一配置。
- 把 `description` 写成调度契约，说明适用任务、触发条件和边界；把稳定的执行规则放进 `developer_instructions`，不要只重复角色名称。
- 明确输入、输出和完成标准。要求 subagent 返回经过提炼的结论、证据和文件引用，不要把大段日志或未经整理的中间输出带回主线程。
- 优先并行执行相互独立、以读取为主的探索、测试、分类和总结任务。多个 agent 同时写入同一批文件容易产生冲突和协调成本，只有文件所有权和依赖边界清楚时才并行写入。
- 为写入型 agent 指定负责的文件或模块，并要求保留其他 agent 与用户的现有修改；共享工作区中不得回滚不属于自己的变更。
- 权限遵循最小化原则。只读研究或审查 agent 应使用 `sandbox_mode = "read-only"`；只有任务确实需要时才开放写入、网络或额外工具。
- 根据任务难度选择 model 和 reasoning effort。轻量扫描与高并发任务优先考虑速度和成本，复杂审查、模糊决策或多步验证再提高推理强度；避免无理由固定高成本配置。
- 为专用 agent 提供与职责匹配的工具和 MCP server，并在指令中说明工具用途；不要赋予不会使用或不应使用的能力。
- 让主 agent 保留需求、决策和最终整合责任。subagent 负责有界子任务，主 agent 应等待所需结果、处理冲突并给出统一结论。
- 预计 subagent 会增加 token 消耗。只有可并行性、隔离噪声或专业化带来的收益足够明显时才委托。

## Official References

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)：custom agent 文件位置、必填字段、配置继承、触发方式、模型选择、并行策略和示例。
- [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference)：`[agents]`、model、reasoning、sandbox、approval、MCP、skill 和其他 TOML 配置键的权威定义。

<!-- END:agents/AGENTS.md -->
