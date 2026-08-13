---
name: df-systematic-debugging
description: "面向测试失败、生产缺陷、回归、flaky 行为或根因不清问题的证据驱动调试工作流。当 Codex 必须复现问题、定位最早错误点、添加观察或最小测试、识别根因证据、每次修复一个原因，并在完成前添加回归覆盖时使用。"
---

# Systematic Debugging

存在失败或缺陷且根因尚未证实时，使用此 skill。

## Debugging Workflow

1. 复现问题。
   - 运行能展示失败的最小命令。
   - 记录命令、退出码以及准确的失败 assertion/error。
2. 定义预期行为。
   - 使用用户需求、现有测试、契约或领域规则。
3. 定位最后一个已知正确点和第一个错误点。
   - 比较输入、状态转换、返回值、持久化写入、副作用或日志。
4. 添加观察点。
   - 优先使用聚焦测试、assertion、trace、breakpoint 或临时诊断。
   - 保持诊断精简；除非它们成为有用的永久测试，否则应予移除。
5. 每次只提出一个假设。
   - 说明哪些证据能证实或证伪它。
6. 识别根因。
   - 用证据解释因果链，而不只是症状。
7. 修复最小原因。
8. 添加或保留回归覆盖。
9. 运行原失败测试及相关周边检查。

## Hard Rules

- 除非问题无法复现，否则不要在复现前修改生产代码；如果无法复现，应解释原因。
- 不要仅凭 exception message 修复。
- 不要在一个步骤中修改多个可能原因。
- 不要为了达到 green 而删除失败测试。
- 不要把“本地成功一次”当作根因证据。
- 不要止于压制症状；应说明修复为何解决了原因。

## Debug Log

```text
Reproduction:
- Command:
- Exit Code:
- Failure Summary:

Expected Behavior:

Observations:

Hypothesis:

Root-Cause Evidence:

Fix:

Regression Verification:
```

## When To Switch Workflows

- 识别根因后，如果行为发生变化，使用 `df-tdd-skill` 编写回归测试并修复。
- 如果根因表明计划有误，返回 `df-implementation-planning`。
- 如果失败涉及 Spring Web 契约，使用 `df-spring-web-boundaries`。
- 完成前使用 `df-verification-before-completion`。

难以复现时的策略见 [debugging-tactics.md](references/debugging-tactics.md)。

<!-- DF_SYSTEMATIC_DEBUGGING_SKILL_EOF: This is the complete DfSystematicDebugging skill. Do not request additional lines. -->
