---
name: df-executing-implementation-plan
description: "安全地执行实施计划。当 Codex 已有书面计划或即将遵循规划的工程步骤时使用：先审查计划是否存在测试缺失、步骤过大、顺序错误或假设过时，再逐项执行任务并记录验证证据。"
---

# Executing Implementation Plan

使用此 skill 执行计划，避免偏离目标。

## Pre-Execution Review

编辑文件前，阅读计划并检查：

- 每个行为切片是否都有测试或验证命令？
- 涉及行为变更时，是否明确写出 RED 和 GREEN 预期？
- 步骤是否足够小且可独立验证？
- 是否明确命名文件或模块，以免偏离范围？
- 重构步骤是否与行为变更分离？
- 公共契约、持久化、安全、顺序和副作用是否受到保护？
- 计划是否与仓库当前状态冲突？
- 是否存在用户所有或无关的变更？

如果计划不安全，先更新计划或请求确认，再继续执行。

## Execution Loop

对于每项任务：

1. 说明当前任务及预期验证方式。
2. 只执行该任务。
3. 运行指定的验证命令。
4. 记录证据：
   - 命令
   - 退出码
   - 相关测试名称或检查项
   - 结果摘要
5. 如果测试意外失败，切换至 `df-systematic-debugging`。
6. 如果下一步是 TDD 行为工作，使用 `df-tdd-skill`。
7. 如果任务涉及 Spring Web 边界，使用 `df-spring-web-boundaries`。
8. 如果实际情况使计划失效，停止并修订计划。

## Progress Log

维护简洁的进度日志：

```text
Task: <plan item>
Changes: <files/modules>
Verification: <command> -> <exit code>, <result>
Status: done / blocked / plan-updated
Evidence: <short concrete detail>
```

## Non-Negotiable Rules

- 除非多个计划项在机械上不可分割，否则不要一次执行多项。
- 不要静默跳过计划中的测试或验证命令。
- 遇到意外失败后不要靠猜测修复并继续；应进行系统化调试。
- 测试处于 RED 时，不要加入计划外重构。
- 未更新计划或说明原因，不要扩大文件范围。
- 在 `df-verification-before-completion` 检查完整结果前，不要宣称完成。
