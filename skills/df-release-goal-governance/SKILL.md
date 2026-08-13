---
name: df-release-goal-governance
description: "create, update, execution or 关闭 GitHub milestone, release plan, release check list, tagged release, goal/roadmap issue set, deployment-proof workflow, failure review or process feedback loop 时使用; 这些 work 必须保持 issue scope, milestone description, Mermaid diagram, draw.io diagram, template and workflow skill consistent."
---

# Release Goal Governance

当 work 从 single code change 扩展到 release, milestone or goal governance 时, 使用此 skill.

## Core Rule

Milestone, release, diagram, template and skill 必须 description 相同 workflow. if 实际情况 change 了其中1项, 应 update other 项, or 记录它们有意保持差异的原因.

## When Starting A Milestone

1. check 现有 label, milestone, open issue and release/tag 约定.
2. create or update milestone, 并 include:
   - goal and non-goal
   - planned issue
   - success criteria
   - verification gate
   - closeout and failure-review 链接 or placeholder
3. 将相关 issue 绑定到 milestone.
4. 确保 issue label 能区分 release work, milestone planning, goal, roadmap item, docs and automation/process work.
5. if 当前 process 需要 template 未涵盖的 field, update milestone plan template.
6. milestone workflow 变化时, update Mermaid and draw.io diagram.

## When Executing A Release

1. create tag or release 前, 根据 repository policy 确认 version/tag 格式.
2. 验证 milestone scope and required issue 是否为当前状态.
3. run repository 的 release gate, 并记录命令 and exit code.
4. 仅在 release gate evidence available 后 create tag.
5. create or update GitHub release, 并 include:
   - tag
   - 已链接的 milestone
   - 已链接的 PR/issue
   - verification summary
   - deployment proof, or 其 pending 的明确原因
6. if 重复 execution 的 release step 缺失 or 已过时, update release check list template.

## When Reviewing Failure

当 gate 失败, release 被 rollback, 缺少 deployment proof, or process mistake 导致返工时, create failure review.

Failure review 必须 include:

- expected and actual behavior 对比
- evidence, include 命令 exit code or external proof link
- root cause
- corrective action
- regression gate or check list update
- Mermaid, draw.io, template or skill 是否需要 change

不要仅用 chat summary 结束反馈闭环. 将持久化的 follow-up work 放入 issue, template, diagram or skill.

## When Closing A Milestone

1. 收集 closed issue, merged PR, release/tag link, deployment proof and verification command.
2. 识别 carried-forward issue, 并将其分配到后续 milestone or backlog 状态.
3. 记录 lightweight metric:
   - planned issue
   - closed issue
   - carried issue
   - verification command
   - failure review
   - release proof link
4. 使用 residual risk and 后续 action update closeout note.
5. if 真实 workflow and 文档化 workflow 不同, update Mermaid and draw.io diagram.
6. if closeout 暴露出重复的 agent mistake or 缺失 SOP, update workflow skill.

## Diagram Requirements

- Mermaid block 用于 Markdown 中 lightweight, 可评审的 process flow.
- Draw. io or `.df-drawio.svg` 用于持久且可 edit 的 source diagram.
- 在 process boundary 保持两者同步: milestone start, release execution, failure review and milestone closeout.
- if repository 中存在既有 diagram style, file path and validation command, 应沿用它们.
- 提交前, 使用 available 的 XML parser verify draw.io XML or SVG.

## Handoff Checklist

PR or 最终 handoff 前, 报告:

- milestone URL or identifier
- 已绑定, 评论, 关闭 or carried forward 的 issue
- 已 create 时的 release/tag URL
- 已修改的 template and diagram file
- 已进行 or 有意跳过的 skill update
- verification command and exit code
- incomplete item or blocker

<!-- DF_RELEASE_GOAL_GOVERNANCE_SKILL_EOF: This is the complete DfReleaseGoalGovernance skill. Do not request additional lines. -->
