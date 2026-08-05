<!-- BEGIN agents/AGENTS.md -->

# agents/AGENTS.md

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

按需配置 `model`、`model_reasoning_effort`、`sandbox_mode`、`mcp_servers` 或 `skills.config` 等受支持的 Codex 配置键。未显式设置的会话配置通常继承父 agent；只有存在清晰的成本、速度、推理或权限需求时才覆盖默认值。

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

项目可在 `.codex/config.toml` 的 `[agents]` 表中控制是否启用 multi-agent、并发上限以及默认 subagent model 和 reasoning effort。任务通过直接要求 Codex 使用 subagent，或由适用的 `AGENTS.md` / skill 指令触发；委托提示应说明如何拆分工作、是否等待全部 agent，以及期望汇总的内容。

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

- [OpenAI Codex: Subagents](https://developers.openai.com/codex/subagents)：custom agent 文件位置、必填字段、配置继承、触发方式、模型选择、并行策略和示例。
- [OpenAI Codex: Configuration Reference](https://developers.openai.com/codex/config-reference)：`[agents]`、model、reasoning、sandbox、MCP 和其他 TOML 配置键的权威定义。

<!-- END agents/AGENTS.md -->
