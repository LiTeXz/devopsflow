# DevFlow Skills

简体中文 | [English](README.en.md)

DevFlow Skills 是一组面向 Codex 的工程工作流 skills。它把 DDD、Glue Coding、TDD、计划、执行、调试、评审、验证和分支收尾组织成一套可组合的强制工作流。

## 重要：必须开启 Plan 模式

使用 DevFlow Skills 前，请先在 Codex 中开启 Plan 模式。

这些 skills 依赖“先澄清、先建模、先计划、再执行”的工作方式。尤其是 DDD、TDD、实现计划、调试和评审流程，如果没有先进入 Plan 模式，Codex 很容易被用户的数据表、CRUD 页面、零散实现要求带偏，直接进入编码或一次性输出未经确认的设计。

推荐使用方式：

1. 先开启 Plan 模式。
2. 让 `engineering-workflow-router` 判断任务类型和必需 skill。
3. 按 skill 要求完成确认、建模或计划。
4. 用户确认后再进入实现、验证、提交或 PR。

不要把 Plan 模式当成可选步骤；它是 DevFlow 工作流的入口保护。

## 安装

从仓库根目录安装全部 skills：

```bash
npx skills add https://github.com/LiTeXz/devflow-skills.git -g -a codex --skill engineering-workflow-router resumable-workflow-guard ddd-event-storming-design glue-coding ddd-to-tdd-handoff implementation-planning executing-implementation-plan systematic-debugging verification-before-completion requesting-code-review receiving-code-review finishing-development-branch parallel-agent-orchestration tdd-skill spring-web-boundaries
```

安装单个 skill：

```bash
npx skills add https://github.com/LiTeXz/devflow-skills/tree/main/engineering-workflow-router -g -a codex
```

安装完成后，重启 Codex 才会加载新的 skill。

## Skills

- `engineering-workflow-router`：开发、重构、修 bug、建模、评审、验证、分支收尾的入口调度器。
- `resumable-workflow-guard`：为长任务、续跑和易中断工作建立检查点、恢复入口和交接记录。
- `ddd-event-storming-design`：从事件风暴和 CQRS 出发做纯 DDD 领域建模。
- `glue-coding`：在领域结论清楚后，先查找本项目样板间、相似实现和规范，只实现差异点。
- `ddd-to-tdd-handoff`：把已确认的 DDD 产物转换成可执行 TDD 切片。
- `implementation-planning`：编码前生成小步、可验证的实现计划。
- `executing-implementation-plan`：先复核计划，再一次执行一个任务并记录验证证据。
- `systematic-debugging`：先复现，再定位根因，最后用回归测试保护修复。
- `verification-before-completion`：完成前检查用户要求、变更文件、命令证据、未跑检查、剩余风险。
- `requesting-code-review`：实现完成后做以 bug 和测试缺口为中心的自查。
- `receiving-code-review`：逐条处理 review feedback，分类、修复、验证。
- `finishing-development-branch`：提交、推送、PR 或交接前检查工作区和中文 Conventional Commit。
- `parallel-agent-orchestration`：在文件范围不重叠时拆分并行 agent 工作。
- `tdd-skill`：项目无关的 RED/GREEN/REFACTOR TDD 工作流和协议校验。
- `spring-web-boundaries`：Spring Web controller、endpoint、validation、security、上传下载、导出和 service 边界规则。

## 技能组合图

```text
用户提出需求
  -> engineering-workflow-router
    -> 长任务/续跑/易中断：resumable-workflow-guard
    -> 领域复杂：ddd-event-storming-design
    -> 领域已清楚且存在相似实现：glue-coding
    -> 设计已确认且要实现：ddd-to-tdd-handoff
    -> 多步骤实现：implementation-planning
    -> 开始编码：executing-implementation-plan
      -> 每个行为切片：tdd-skill
      -> Spring Web 变更：spring-web-boundaries
      -> 失败/异常：systematic-debugging
    -> 完成实现：requesting-code-review
    -> 修 review：receiving-code-review
    -> 最终声明完成：verification-before-completion
    -> 提交/PR：finishing-development-branch
```

## 仓库结构

```text
engineering-workflow-router/
resumable-workflow-guard/
ddd-event-storming-design/
glue-coding/
ddd-to-tdd-handoff/
implementation-planning/
executing-implementation-plan/
systematic-debugging/
verification-before-completion/
requesting-code-review/
receiving-code-review/
finishing-development-branch/
parallel-agent-orchestration/
tdd-skill/
spring-web-boundaries/
```

每个目录都是一个独立 Codex skill，包含必需的 `SKILL.md`，以及可选的 `agents/`、`references/`、`scripts/`、`templates/`。

## 校验

格式校验：

```bash
python -X utf8 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py engineering-workflow-router
```

TDD 协议回归：

```bash
python -X utf8 tdd-skill/scripts/run_protocol_examples.py
```

DDD 设计校验回归：

```bash
python -X utf8 ddd-event-storming-design/scripts/run_design_examples.py
```

## Commit Message

提交信息使用中文 Conventional Commits：

```text
feat: 新增工程工作流入口调度器
fix: 修复 DDD 校验脚本编码问题
docs: 更新技能组合说明
```
