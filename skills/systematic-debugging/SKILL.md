---
name: systematic-debugging
description: "Evidence-based debugging workflow for failing tests, production bugs, regressions, flaky behavior, or unclear root causes. Use when Codex must reproduce a problem, locate the earliest wrong point, add observations or minimal tests, identify root-cause evidence, fix one cause at a time, and add regression coverage before completion."
---

# Systematic Debugging

Use this skill when a failure or bug exists and the root cause is not proven.

## Debugging Workflow

1. Reproduce the problem.
   - Run the smallest command that shows the failure.
   - Record command, exit code, and exact failing assertion/error.
2. Define expected behavior.
   - Use user requirements, existing tests, contracts, or domain rules.
3. Locate the last known correct point and first wrong point.
   - Compare inputs, state transitions, return values, persistence writes, side effects, or logs.
4. Add observation points.
   - Prefer a focused test, assertion, trace, breakpoint, or temporary diagnostic.
   - Keep diagnostics small and remove them unless they become useful permanent tests.
5. Form one hypothesis at a time.
   - State what evidence would prove or disprove it.
6. Identify root cause.
   - Explain the causal chain with evidence, not only the symptom.
7. Fix the smallest cause.
8. Add or keep regression coverage.
9. Run the failing test and relevant surrounding checks.

## Hard Rules

- Do not change production code before reproducing the problem unless reproduction is impossible; if so, explain why.
- Do not fix solely from an exception message.
- Do not change multiple possible causes in one step.
- Do not delete failing tests to reach green.
- Do not treat "works locally once" as root-cause evidence.
- Do not stop at symptom suppression; show why the fix addresses the cause.

## Debug Log

```text
复现：
- 命令：
- 退出码：
- 失败摘要：

期望行为：

观察点：

假设：

根因证据：

修复：

回归验证：
```

## When To Switch Workflows

- After root cause is identified, use `tdd-skill` for the regression test and fix if behavior changes.
- If the root cause shows a bad plan, return to `implementation-planning`.
- If the failure touches Spring Web contracts, use `spring-web-boundaries`.
- Before completion, use `verification-before-completion`.

See `references/debugging-tactics.md` for tactics when reproduction is difficult.
