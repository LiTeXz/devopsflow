---
name: df-ai-agentinstruction-authoring
description: "改进 AGENTS、SKILL 和 agent 指令的结构、格式与执行效果。"
---

# AI Agentinstruction Authoring

改进 AGENTS、skills 和 agent 指令的结构与执行效果。

## Scope

当用户要求改进 AGENTS 格式或执行效果、统一 AGENTS 行为、优化 SKILL 或优化 agent 时使用。治理范围包括项目及嵌套的 `AGENTS.md`、`SKILL.md`、`agents/` 下的所有指令文档，以及 skill 的 [openai.yaml](agents/openai.yaml) metadata。除非用户扩大范围，否则不适用于 README、references、templates 或 examples。

## Workflow

1. 编辑前识别所有受治理文件。
2. 保留现有技术行为、标识符、命令和非语言政策。
3. 仅对 H1 至 H6 标题应用英文规则。
4. 完成前验证仓库，以及用户要求纳入范围的全局指令文件。

## Language Rules

- H1 至 H6 标题必须使用英文；正文可以使用项目工作语言。
- 标题必须包含无法避免的中文术语时，用 ASCII 双引号包裹，例如 `Vendor "公司名"` 或 `Domain Term "修仙"`。
- 不要使用纯中文标题，也不要在混合标题的双引号外放置中文。

## AGENTS Structure

项目根文件必须使用以下精确 wrapper 和首个 H1：

```markdown
<!-- BEGIN:/AGENTS.md -->

# /AGENTS.md

...

<!-- END:/AGENTS.md -->
```

嵌套文件使用不带前导斜杠的项目相对路径：

```markdown
<!-- BEGIN:skills/AGENTS.md -->

# skills/AGENTS.md

...

<!-- END:skills/AGENTS.md -->
```

对于 `~/.codex/AGENTS.md`，保留有意使用的 `BEGINE` 拼写：

```markdown
<!-- BEGINE_GLOBAL:~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Constitution

...

<!-- END_GLOBAL:~/.codex/ -->
```

不要向 skills 或 agent definitions 添加路径 H1 或 AGENTS wrapper 注释。

## Validation

Run the repository check from its root:

```bash
bun run check:agent-instructions
```

Validate the global file explicitly when it is in scope:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/validate-agent-instructions.ts" --global ~/.codex/AGENTS.md
```

将所有报告的违规视为阻断项。如果标题必须使用中文例外，保持规定的引号形式。

<!-- DF_AI_AGENTINSTRUCTION_AUTHORING_SKILL_EOF: This is the complete DfAiAgentinstructionAuthoring skill. Do not request additional lines. -->
