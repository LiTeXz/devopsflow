# Portable Agent And Skill Context

## Task

- 名称：修正分发后 agent 与 skill 的目标项目上下文
- 目标：确保 `agents/` 与 `skills/` 中的分发内容在其他项目运行时，以目标项目而非 DevopsFlow 源码仓库为工作上下文。
- 状态：completed
- Owner：Codex
- 创建时间：2026-08-14
- 更新时间：2026-08-14

## Resume Cursor

- 当前阶段：完成验证与交接
- 下一步操作：无；按最终变更与验证证据交接。
- 从此处继续：若后续新增 agent/skill，先运行 instruction 与 metadata 门禁。
- 不要重做：上下文规则、角色描述、路径入口和回归门禁均已完成。

## Workflow Chain

```text
df-engineering-workflow-router
  -> df-resumable-workflow-guard
  -> df-agent-instruction-authoring
  -> df-implementation-planning
  -> df-executing-implementation-plan
  -> df-requesting-code-review
  -> df-verification-before-completion
```

## Scope

- 范围内：`skills/AGENTS.md`、`agents/AGENTS.md`、全部 agent TOML、全部 `SKILL.md`、skill 的 `agents/openai.yaml`，以及为防回归所需的校验脚本和测试。
- 范围外：与提示词分发上下文无关的实现重构、references/templates/examples 的一般文案润色。
- 用户所有的变更：任务开始时 `git status --short` 为空。

## Checklist

- [x] R1 - 盘点局部规则、分发文件和高风险关键字。
- [x] R2 - 固化目标项目视角与路径规则。
- [x] R3 - 修正 agent 描述及正文上下文。
- [x] R4 - 修正 skill 描述、默认提示及正文上下文。
- [x] R5 - 增加或更新自动校验，防止同类回归。
- [x] R6 - 运行验证并完成差异审查。

## Touched Files

| 文件 | Owner | 原因 | 状态 |
| --- | --- | --- | --- |
| `.devopsflow/checkpoints/portable-agent-skill-context.md` | Codex | 长任务续跑记录 | active |
| `AGENTS.md`, `skills/AGENTS.md` | Codex | 分发上下文与 wrapper | completed |
| `agents/*.toml` | Codex | 修正角色调度语境 | completed |
| `skills/**` | Codex | 修正安装路径、目标项目与 metadata | completed |

## Decisions And Assumptions

- 决策：把“DevopsFlow 产品或插件资产”与“DevopsFlow 源码仓库作为运行目标”严格区分；前者可保留，后者禁止。
- 决策：分发后的普通命令必须以目标项目为 `cwd`；访问 skill 自带脚本时必须使用安装后可解析的 skill/plugin 路径或明确说明路径来源。
- 假设：`skills/` 中脚本源码路径可用于维护期验证，但不能无条件作为安装后运行命令暴露给使用者。

## Verification Evidence

| 命令 | 退出码 | 范围 | 结果 |
| --- | --- | --- | --- |
| `git status --short` | 0 | 初始工作区 | 无输出 |
| `rg --files skills agents` | 0 | 分发文件盘点 | 已生成完整清单 |
| `bun run check:agent-instructions` | 0 | 全部 AGENTS、agent、skill 指令 | portable context 与 wrapper 检查通过 |
| `bun run check:skill-metadata` | 0 | 全部 skill metadata | metadata 检查通过 |
| `bun test skills/df-ai-agentinstruction-authoring/scripts/validate-agent-instructions.test.ts` | 0 | portable context 回归 | 10 tests passed |
| `bun run format:check` | 0 | 全仓库格式 | 无需修改 |
| `bun run lint` | 0 | 全仓库静态检查 | 无错误 |
| `bun run typecheck` | 0 | TypeScript | 通过 |
| `git diff --check` | 0 | 变更差异 | 无空白错误 |

## Risks And Blockers

- 风险：过度替换可能破坏 `df-codex-assets` 对 DevopsFlow 插件本身的合法产品语义。
- 风险：安装后的 plugin 根路径由宿主提供，文档使用 `<SKILL_INSTALL_ROOT>` 占位符，具体命令解析依赖宿主安装布局。
- Blocker：无。

## Progress Log

```text
2026-08-14
任务：初始化审查与 checkpoint。
变更：新增 checkpoint。
验证：完成规则、状态、文件和关键字盘点。
状态：done
证据：8 个 agent description 已改为目标项目语境；skill 命令已改为安装根占位符；新增 portable context validator。
下一步：交接。
```

## Handoff

```text
从此处继续：无
当前阶段：completed
下一步操作：无
不要重做：已完成的上下文审查与验证
下次验证：新增或修改分发文件后运行 `bun run check:agent-instructions` 与 `bun run check:skill-metadata`
未决风险：具体 plugin 安装根路径由宿主提供
```
