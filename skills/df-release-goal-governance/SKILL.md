---
name: df-release-goal-governance
description: "创建、更新、执行或关闭 GitHub milestone、release plan、release checklist、tagged release、goal/roadmap issue set、deployment-proof workflow、failure review 或 process feedback loop 时使用；这些工作必须保持 issue scope、milestone description、Mermaid diagram、draw.io diagram、template 和 workflow skill 一致。"
---

# Release Goal Governance

当工作从单一代码变更扩展到 release、milestone 或 goal governance 时，使用此 skill。

## Core Rule

Milestone、release、diagram、template 和 skill 必须描述同一个 workflow。如果实际情况改变了其中一项，应更新其他项，或记录它们有意保持差异的原因。

## When Starting A Milestone

1. 检查现有 label、milestone、open issue 和 release/tag 约定。
2. 创建或更新 milestone，并包含：
   - goal 与 non-goal
   - planned issue
   - success criteria
   - verification gate
   - closeout 与 failure-review link 或 placeholder
3. 将相关 issue 绑定到 milestone。
4. 确保 issue label 能区分 release work、milestone planning、goal、roadmap item、docs 和 automation/process work。
5. 如果当前 process 需要 template 未涵盖的 field，更新 milestone plan template。
6. milestone workflow 变化时，更新 Mermaid 和 draw.io diagram。

## When Executing A Release

1. 创建 tag 或 release 前，根据 repository policy 确认 version/tag 格式。
2. 验证 milestone scope 和 required issue 是否为当前状态。
3. 运行 repository 的 release gate，并记录命令与 exit code。
4. 仅在 release gate evidence 可用后创建 tag。
5. 创建或更新 GitHub release，并包含：
   - tag
   - 已链接的 milestone
   - 已链接的 PR/issue
   - verification summary
   - deployment proof，或其 pending 的明确原因
6. 如果重复执行的 release step 缺失或已过时，更新 release checklist template。

## When Reviewing Failure

当 gate 失败、release 被 rollback、缺少 deployment proof，或 process mistake 导致返工时，创建 failure review。

Failure review 必须包含：

- expected 与 actual behavior 对比
- evidence，包括命令 exit code 或 external proof link
- root cause
- corrective action
- regression gate 或 checklist update
- Mermaid、draw.io、template 或 skill 是否需要变更

不要仅用 chat summary 结束反馈闭环。将持久化的 follow-up work 放入 issue、template、diagram 或 skill。

## When Closing A Milestone

1. 收集 closed issue、merged PR、release/tag link、deployment proof 和 verification command。
2. 识别 carried-forward issue，并将其分配到下一个 milestone 或 backlog 状态。
3. 记录 lightweight metric：
   - planned issue
   - closed issue
   - carried issue
   - verification command
   - failure review
   - release proof link
4. 使用 residual risk 和 next action 更新 closeout note。
5. 如果真实 workflow 与文档化 workflow 不同，更新 Mermaid 和 draw.io diagram。
6. 如果 closeout 暴露出重复的 agent mistake 或缺失 SOP，更新 workflow skill。

## Diagram Requirements

- Mermaid block 用于 Markdown 中 lightweight、可评审的 process flow。
- Draw.io 或 `.df-drawio.svg` 用于持久且可编辑的 source diagram。
- 在 process boundary 保持两者同步：milestone start、release execution、failure review 和 milestone closeout。
- 如果 repository 中存在既有 diagram style、file path 和 validation command，应沿用它们。
- 提交前，使用可用的 XML parser 校验 draw.io XML 或 SVG。

## Handoff Checklist

PR 或最终 handoff 前，报告：

- milestone URL 或 identifier
- 已绑定、评论、关闭或 carried forward 的 issue
- 已创建时的 release/tag URL
- 已修改的 template 和 diagram 文件
- 已进行或有意跳过的 skill update
- verification command 与 exit code
- incomplete item 或 blocker
