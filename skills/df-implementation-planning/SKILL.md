---
name: df-implementation-planning
description: "编码前编写具体的小步实施计划。适用于多步功能、缺陷修复、重构、DDD-to-TDD 交接、风险行为变更，或任何需要在实现前明确文件、命令、预期 RED/GREEN 结果、验证步骤和完成标准的工程任务。"
---

# Implementation Planning

使用此 skill，将需求、已确认的 DDD 交接、Glue Coding pattern 选择、选定的 style pack、缺陷调查结果或重构目标，转化为其他执行者可执行的计划。

使用此 skill 时不要编辑生产代码。

## Planning Workflow

1. 重述目标和范围。
2. 列出约束：
   - 不得改变的行为
   - 公共契约
   - 数据、持久化、顺序、分页、安全或副作用风险
   - 必须保留的选定 style pack、golden example、特定风格 anti-pattern 和审查清单项
   - 选定的 Glue 目标 pattern、本地约定、遗留行为证据、要移除的 anti-pattern，以及必须保留的项目材料
   - 必须避开的用户所有 worktree 变更
3. 识别行为切片。
4. 对每项任务说明：
   - 目标
   - 可能涉及的文件或模块
   - 测试或验证命令
   - 预期 RED、GREEN 或不变结果
   - 完成标准
5. 每项任务应足够小，可独立完成并验证。
6. 标记需要 `df-tdd-skill`、`df-spring-web-boundaries` 或 `df-systematic-debugging` 的步骤。
7. 对 Glue 风格工作，如果存在选定的 style pack，应包含它，并写明选定的目标 pattern 及每项任务允许变更的精确差异。
8. 对重构类 Glue 工作，分开 characterization、目标 pattern 迁移和清理步骤。除非遗留结构被明确归类为目标 pattern，否则不要计划复制它。
9. 说明执行前是否需要用户确认。

## Step Size

优先采用 2 至 5 分钟的执行步骤。如果一个步骤组合了以下内容，则应拆分：

- 创建测试与实现生产代码
- 无关的行为切片
- 风险各自独立的多个模块
- 重构与行为变更
- 调试与修复
- 代码变更与 commit/PR 工作

## Output Format

需要文件产物时使用 [implementation-plan.md](templates/implementation-plan.md)。在对话中使用相同结构：

```markdown
# <Name> Implementation Plan

## Goal

## Constraints

## Behavior Slices

## Task List

1. Write Failing Test: <behavior>
   - Files:
   - Command:
   - Expected RED:
   - Completion Standard:

2. Minimal Implementation: <behavior>
   - Files:
   - Command:
   - Expected GREEN:
   - Completion Standard:

3. Refactor: <design cleanup>
   - Files:
   - Command:
   - Must Preserve:
   - Completion Standard:

## Verification Matrix

## User Confirmation Required
```

## Non-Negotiable Rules

- 此阶段不要编写生产代码。
- 不要生成“实现功能”或“运行测试”等模糊步骤。
- 项目中能发现测试命令时，不要省略命令。
- 对根因不清的缺陷，在获得可复现失败和根因证据前，不要规划修复。
- 不要在同一步骤中混合行为变更与大范围清理。
- 必须保留选定的 style pack 或本地目标 pattern 时，不要为 Glue 风格工作发明新结构。
- 没有明确理由时，不要规划把遗留代码或 anti-pattern 当作目标 pattern 的重构。
- 不要假定风险性范围扩张已获批准；应明确指出。
