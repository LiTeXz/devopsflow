---
name: df-systematic-debugging
description: "面向 tests 失败, 生产缺陷, 回归, flaky 行为 or 根因不清问题的证据 driven debugging workflow. 当 Codex 必须复现问题, 定位最早错误点, 添加观察 or 最小 tests, 识别根因证据, 每次 fix 1 个原因, 并在完成前添加回归覆盖时使用."
version: "0.2.29"
license: "GPL-3.0-only"
metadata:
  version: "0.2.29"
---

# Systematic Debugging

存在失败 or 缺陷且根因尚未证实时, 使用此 skill.

## Debugging Workflow

1. 复现问题.
   - run 能展示失败的最小命令.
   - 记录命令, exit code 以及准确的失败 assertion/error.
2. definition 预期行为.
   - 使用 user 需求, 现有 tests, 契约 or domain rule.
3. 定位最后 1 个已知正确点 and 首个错误点.
   - 比较 input, 状态转换, return value, 持久化 write, 副作用 or 日志.
4. 添加观察点.
   - 优先使用聚焦 tests, assertion, trace, breakpoint or 临时诊断.
   - 保持诊断精简; 除非它们成为有用的永久 tests, 否则应予移除.
5. 每次只提出 1 个假设.
   - 说明哪些证据能证实 or 证伪它.
6. 识别根因.
   - 用证据解释因果链, 而不只是症状.
7. fix 最小原因.
8. 添加 or 保留回归覆盖.
9. run 原失败 tests 及相关周边 check.

## Hard Rules

- 除非问题无法复现, 否则不要在复现前修改生产 code; if 无法复现, 应解释原因.
- 不要仅凭 exception message fix.
- 不要在 1 个步骤中修改多个可能原因.
- 不要为了达到 green 而删除失败 tests.
- 不要把"local 单次成功"当作根因证据.
- 不要止于压制症状; 应说明 fix 为何解决了原因.

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

- 识别根因后, if 行为发生变化, 使用 `df-dev-tdd` write 回归 tests 并 fix.
- if 根因表明计划有误, return `df-implementation-planning`.
- if 失败涉及 Spring Web 契约, 使用 `df-spring-web-boundaries`.
- 完成前使用 `df-verification-before-completion`.

难以复现时的策略见 [debugging-tactics.md](references/debugging-tactics.md).

<!-- DF_SYSTEMATIC_DEBUGGING_SKILL_EOF: This is the complete DfSystematicDebugging skill. Do not request additional lines. -->
