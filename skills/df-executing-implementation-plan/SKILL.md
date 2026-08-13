---
name: df-executing-implementation-plan
description: "安全地 execution 实施计划. 当 Codex 已有书面计划 or 即将遵循规划的工程步骤时使用: 先审查计划是否存在 tests 缺失, 步骤过大, 顺序错误 or 假设过时, 再逐项 execution task 并记录验证证据."
---

# Executing Implementation Plan

使用此 skill execution 计划, 避免偏离 target.

## Pre-Execution Review

edit file 前, 阅读计划并 check:

- 每个行为切片是否都有 tests or 验证命令?
- 涉及行为 change 时, 是否明确 write 出 RED and GREEN 预期?
- 步骤是否足够小且可独立验证?
- 是否明确命名 file or module, 以免偏离范围?
- refactor 步骤是否 and 行为 change 分离?
- 公共契约, 持久化, 安全, 顺序 and 副作用是否受到保护?
- 计划是否 and repository 当前状态冲突?
- 是否存在 user 所有 or 无关的 change?

if 计划不安全, 先 update 计划 or 请求确认, 再继续 execution.

## Execution Loop

对于每项 task:

1. 说明当前 task 及预期验证方式.
2. 只 execution 该 task.
3. run 指定的验证命令.
4. 记录证据:
   - 命令
   - exit code
   - 相关 tests name or check 项
   - result 摘要
5. if tests 意外失败, 切换至 `df-systematic-debugging`.
6. if 后续步骤是 TDD 行为 work, 使用 `df-tdd-skill`.
7. if task 涉及 Spring Web 边界, 使用 `df-spring-web-boundaries`.
8. if 实际情况使计划失效, 停止并修订计划.

## Progress Log

维护简洁的进度日志:

```text
Task: <plan item>
Changes: <files/modules>
Verification: <command> -> <exit code>, <result>
Status: done / blocked / plan-updated
Evidence: <short concrete detail>
```

## Non-Negotiable Rules

- 除非多个计划项在机械上不可分割, 否则不要同时 execution 多项.
- 不要静默跳过计划中的 tests or 验证命令.
- 遇到意外失败后不要靠猜测 fix 并继续; 应进行 system 化 debugging.
- tests 处于 RED 时, 不要加入计划外 refactor.
- 未 update 计划 or 说明原因, 不要扩大 file 范围.
- 在 `df-verification-before-completion` check 完整 result 前, 不要宣称完成.

<!-- DF_EXECUTING_IMPLEMENTATION_PLAN_SKILL_EOF: This is the complete DfExecutingImplementationPlan skill. Do not request additional lines. -->
