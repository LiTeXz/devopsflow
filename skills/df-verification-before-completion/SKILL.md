---
name: df-verification-before-completion
description: "工程工作的强制完成门禁。在宣称开发、重构、缺陷修复、建模、审查、文档、配置、commit 或 PR 任务完成前使用，用于核验用户需求、变更文件、已运行命令及退出码、跳过的检查、手动验证、残余风险以及无关变更。"
---

# Verification Before Completion

在宣称完成前使用此 skill。它是完成门禁，本身不是测试策略。

## Verification Checklist

回答每一项：

1. 最终结果是否满足用户的每一项要求？
2. 哪些文件发生了变更？
3. 运行了哪些命令，它们的退出码是什么？
4. 哪些相关测试或检查未运行，原因是什么？
5. 是否进行了手动验证？具体观察到了什么？
6. 是否仍有风险、假设或未完成区域？
7. worktree 中是否有无关变更或用户所有的变更？
8. 如果要求 TDD，是否有 RED/GREEN/REFACTOR 证据？
9. 如果要求 DDD 建模，结论是否在持久化前得到确认？
10. 如果 Spring Web 边界发生变化，是否覆盖了端点契约和服务边界扫描？
11. 如果要求 Glue Coding，使用了哪个 style pack 或本地目标模式，实现了哪些差异；是否应持久化任何新规则、知识、模式、style pack 材料或 track？对于重构，避开了哪些遗留模式或 anti-pattern，又有哪些 characterization 证据保护行为？

## Evidence Standard

使用具体证据：

- 命令行及退出码
- 测试名称或测试套件名称
- 文件路径
- 观察到的行为
- 跳过的命令及原因

不要只写“测试通过”之类的模糊表述，而不提供命令和范围。

## Output Format

内部笔记或交接文件使用 [verification-report.md](templates/verification-report.md)。在最终回复中，简要汇总相同的证据：

```markdown
Completion Status:
- Satisfied:
- Changed Files:
- Verification:
- Not Run:
- Remaining Risks:
```

## Non-Negotiable Rules

- 在满足此清单前，不要宣称“已完成”或使用同等表述。
- 不要隐瞒跳过的测试。
- 不要暗示验证范围比实际运行的更广。
- 不要忽略 dirty worktree 中的变更。应将自己的编辑与无关变更分开。
- 如果缺少必要证据，不要提交，除非用户明确接受该风险。

<!-- DF_VERIFICATION_BEFORE_COMPLETION_SKILL_EOF: This is the complete DfVerificationBeforeCompletion skill. Do not request additional lines. -->
