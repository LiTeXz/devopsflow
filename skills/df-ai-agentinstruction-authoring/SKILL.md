---
name: df-ai-agentinstruction-authoring
description: "改进 AGENTS, SKILL and agent 指令的结构, 格式与执行效果."
---

# AI Agentinstruction Authoring

改进 AGENTS, skills and agent 指令的结构与执行效果.

## Scope

当用户要求改进 AGENTS 格式 or 执行效果, 统一 AGENTS 行为, 优化 SKILL or 优化 agent 时使用. 治理范围包括 project 及嵌套的 `AGENTS.md`, `SKILL.md`, `agents/` 下的所有指令文档, 以及 skill 的 [openai.yaml](agents/openai.yaml) metadata. 除非用户扩大范围, 否则不适用于 README, references, templates or examples.

## Workflow

1. 编辑前识别所有受治理 file.
2. 保留现有技术行为, 标识符, 命令 and 非语言政策.
3. 仅对 H1 至 H6 标题应用英文规则.
4. 完成前验证仓库, 以及用户要求纳入范围的全局指令 file.

## Language Rules

- H1 至 H6 标题必须使用英文; 正文可以使用 project 工作语言.
- 标题必须包含无法避免的中文术语时, 用 ASCII 双引号包裹, 例如 `Vendor "公司名"` or `Domain Term "修仙"`.
- 不要使用纯中文标题, 也不要在混合标题的双引号外放置中文.

## Chinese Word Constraints

- 在 agent 指令正文中, `和` 必须替换为 `and`.
- 在 agent 指令正文中, `或` 必须替换为 `or`.
- 在 agent 指令正文中, `如果` 必须替换为 `if`.
- 在 agent 指令正文中, `文件` 必须替换为 `file`.
- 在 agent 指令正文中, `目录` and `文件夹` 必须替换为 `directory`.
- 在 agent 指令正文中, `注释` 必须替换为 `comment`.
- 在 agent 指令正文中, 完整短语 `验证失败` 必须替换为 `verification error`.
- 在 agent 指令正文中, 完整短语 `项目根` 必须替换为 `project root`.
- 在 agent 指令正文中, `项目` 必须替换为 `project`.
- 在 agent 指令正文中, 完整短语 `嵌套文件` 必须替换为 `nesting file`.
- 不允许使用中文标点符号, `￥` 除外. 必须将中文标点符号替换为对应的 ASCII 标点符号.
- 按最长匹配优先执行替换. 先替换 `验证失败`, `项目根`, `嵌套文件` and `文件夹`, 再将 `项目` 替换为 `project`, 避免产生部分替换结果.

使用以下 diff 示例执行替换:

```diff
- 保留命令和标识符.
+ 保留命令 and 标识符.
```

```diff
- 修改 AGENTS 或 SKILL 文件.
+ 修改 AGENTS or SKILL file.
```

```diff
- 保留现有注释.
+ 保留现有 comment.
```

```diff
- 如果验证失败, 则停止交接.
+ if 出现 verification error, 则停止交接.
```

```diff
- 将配置保存到项目 directory or 临时文件夹.
+ 将配置保存到 project directory or 临时 directory.
```

```diff
- 项目根 file 必须包含 AGENTS.md.
+ project root file 必须包含 AGENTS.md.
```

```diff
- 嵌套文件使用项目相对路径.
+ nesting file 使用 project 相对路径.
```

```diff
- 使用 U+FF0C and U+3002, 但保留 U+FFE5.
+ 将 U+FF0C 替换为 `,`, 将 U+3002 替换为 `.`, and 保留 `￥`.
```

## AGENTS Structure

project root file 必须使用以下精确 wrapper and 首个 H1:

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

对于 `~/.codex/AGENTS.md`, 保留有意使用的 `BEGINE` 拼写:

```markdown
<!-- BEGINE_GLOBAL:~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Constitution

...

<!-- END_GLOBAL:~/.codex/ -->
```

不要向 skills or agent definitions add path H1 or AGENTS wrapper comment.

## Validation

Run the repository check from its root:

```bash
bun run check:agent-instructions
```

Validate the global file explicitly when it is in scope:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/validate-agent-instructions.ts" --global ~/.codex/AGENTS.md
```

将所有报告的违规视为阻断项. If 标题必须使用中文例外, 保持规定的引号形式.

<!-- DF_AI_AGENTINSTRUCTION_AUTHORING_SKILL_EOF: This is the complete DfAiAgentinstructionAuthoring skill. Do not request additional lines. -->
