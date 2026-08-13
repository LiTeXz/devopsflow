---
name: df-ai-agentinstruction-authoring
description: "改进 AGENTS, SKILL and agent 指令的结构, 格式 and execution 效果."
---

# AI Agentinstruction Authoring

改进 AGENTS, skills and agent 指令的结构 and execution 效果.

## Scope

当 user 要求改进 AGENTS 格式 or execution 效果, unified AGENTS 行为, 优化 SKILL or 优化 agent 时使用. 治理范围 include project 中的 `AGENTS.md`, `SKILL.md`, `agents/` 指令 and skill metadata. README, references, templates and examples 仅在 user 明确扩大范围时处理.

## Workflow

1. pre edit 识别受治理内容 and 更深层 `AGENTS.md`.
2. 先 run normalizer 的 `--diff`, 审查确定性 rewrite result.
3. 确认 result 后 run `--fix`.
4. 手工处理 title, wrapper, prose/table context and 无法由词典表达的语义问题.
5. 完成前 run normalizer `--check` and authoring validator.

## Normalization

规范化词汇, context rule, 标点 mapping and 允许符号集中维护在 [vocabulary.yaml](dictionary/vocabulary.yaml). `to` 可以是单 value or 多 value array; array 首项是 canonical output, 全部 value 均为允许译法. 不要把词表复制回 this skill.

check 整个 target project:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/normalize-agent-instructions.ts" --root <PROJECT_ROOT> --check
```

预览 unified diff:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/normalize-agent-instructions.ts" --root <PROJECT_ROOT> --diff
```

rewrite 整个 target project:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/normalize-agent-instructions.ts" --root <PROJECT_ROOT> --fix
```

仅处理 1 个 target file or directory:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/normalize-agent-instructions.ts" --root <PROJECT_ROOT> --path <TARGET_PATH> --fix
```

normalizer 按最长匹配优先应用词典, 并保持 fenced code, inline code, URL and Markdown link destination 原样. 转换必须幂等: 连续 execution `--fix` 后,`--check` 必须 passed.

## Language Rules

- H1 至 H6 title 必须使用英文; 正文可以采用 project work language.
- title 必须 include 无法避免的 chinese 术语时, 用 ASCII 双引号 wrap 该术语, 例如 `Vendor "公司名"` or `Domain Term "修仙"`.
- 不要使用纯 chinese title, 也不要在混合 title 的双引号外放置 chinese.
- 词汇 and 标点限制以 [vocabulary.yaml](dictionary/vocabulary.yaml) and normalizer result 为准.

## AGENTS Structure

project root file 必须使用精确 wrapper and 首个 H1:

```markdown
<!-- BEGIN:/AGENTS.md -->

# /AGENTS.md

...

<!-- END:/AGENTS.md -->
```

nesting file 使用不带前导斜杠的 project 相对路径:

```markdown
<!-- BEGIN:skills/AGENTS.md -->

# skills/AGENTS.md

...

<!-- END:skills/AGENTS.md -->
```

对于 `~/.codex/AGENTS.md`, 保留有意使用的 `BEGINE` spelling:

```markdown
<!-- BEGINE_GLOBAL:~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Constitution

...

<!-- END_GLOBAL:~/.codex/ -->
```

不要向 skills or agent definitions 添加 path H1 or AGENTS wrapper comment.

## Validation

在 target project root run:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/normalize-agent-instructions.ts" --root <PROJECT_ROOT> --check
bun "<SKILL_INSTALL_ROOT>/scripts/validate-agent-instructions.ts" --root <PROJECT_ROOT>
```

全局 AGENTS 在纳入范围时单独验证:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/validate-agent-instructions.ts" --global ~/.codex/AGENTS.md
```

normalizer or validator 报告的违规均为阻断项.

<!-- DF_AI_AGENTINSTRUCTION_AUTHORING_SKILL_EOF: This is the complete DfAiAgentinstructionAuthoring skill. Do not request additional lines. -->
