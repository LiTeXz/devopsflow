---
name: release-goal-governance
description: "Use when creating, updating, executing, or closing GitHub milestones, release plans, release checklists, tagged releases, goal/roadmap issue sets, deployment-proof workflows, failure reviews, or process feedback loops that must keep issue scope, milestone descriptions, Mermaid diagrams, draw.io diagrams, templates, and workflow skills aligned."
---

# Release Goal Governance

Use this skill when work moves beyond a single code change into release, milestone, or goal governance.

## Core Rule

Milestones, releases, diagrams, templates, and skills must describe the same workflow. If reality changes one of them, update the others or record why they intentionally differ.

## When Starting A Milestone

1. Inspect existing labels, milestones, open issues, and release/tag conventions.
2. Create or update a milestone with:
   - goal and non-goals
   - planned issues
   - success criteria
   - verification gates
   - closeout and failure-review links or placeholders
3. Bind the relevant issues to the milestone.
4. Make sure the issue labels distinguish release work, milestone planning, goals, roadmap items, docs, and automation/process work.
5. Update the milestone plan template if the current process needs fields that the template does not capture.
6. Update Mermaid and draw.io diagrams when the milestone workflow changes.

## When Executing A Release

1. Confirm the version/tag format from repository policy before creating tags or releases.
2. Verify the milestone scope and required issues are current.
3. Run the repository's release gates and record commands with exit codes.
4. Create the tag only after the release gate evidence is available.
5. Create or update the GitHub release with:
   - tag
   - linked milestone
   - linked PRs/issues
   - verification summary
   - deployment proof or a clear reason it is pending
6. Update the release checklist template when a repeated release step is missing or obsolete.

## When Reviewing Failure

Create a failure review when a gate fails, a release is rolled back, deployment proof is missing, or a process mistake causes rework.

Failure reviews must include:

- expected vs actual behavior
- evidence, including command exit codes or external proof links
- root cause
- corrective action
- regression gate or checklist update
- whether Mermaid, draw.io, templates, or skills need changes

Do not close the loop with only a chat summary. Put durable follow-up work into an issue, template, diagram, or skill.

## When Closing A Milestone

1. Collect closed issues, merged PRs, release/tag links, deployment proof, and verification commands.
2. Identify carried-forward issues and assign them to the next milestone or a backlog state.
3. Record lightweight metrics:
   - planned issues
   - closed issues
   - carried issues
   - verification commands
   - failure reviews
   - release proof links
4. Update closeout notes with residual risks and next actions.
5. Update Mermaid and draw.io diagrams if the real workflow differed from the documented workflow.
6. Update workflow skills when the closeout reveals repeated agent mistakes or missing SOP.

## Diagram Requirements

- Mermaid blocks are for lightweight, reviewable process flow in Markdown.
- Draw.io or `.drawio.svg` is for the durable editable source diagram.
- Keep both in sync at process boundaries: milestone start, release execution, failure review, and milestone closeout.
- Use the repository's existing diagram style, file path, and validation commands when present.
- Validate draw.io XML or SVG with an available XML parser before committing.

## Handoff Checklist

Before PR or final handoff, report:

- milestone URL or identifier
- issues bound, commented, closed, or carried forward
- release/tag URL if created
- changed template and diagram files
- skill updates made or deliberately skipped
- verification commands with exit codes
- incomplete items or blockers
