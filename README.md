# DevOpsFlow

DevOpsFlow 是一组面向 Codex 的工程工作流 skills，并提供 OpenCode 兼容适配。它把 DDD、Glue Coding、TDD、计划、执行、调试、评审、验证和分支收尾组织成一套可组合的强制工作流。

插件还包含一个保护分支 hook：在 `main`、`dev`、`develop`、`devlop`
等常见集成分支上启动会话时提醒切换新分支；在这些分支上拦截写文件、
修改索引、提交、重置、依赖安装和直接 push 等污染操作，并提示改用新分支
和 PR 流程。Codex hook 配置位于 `hooks/hooks.codex.json`，并由
`.codex-plugin/plugin.json` 声明为插件 companion；OpenCode 本地插件入口位于 `.opencode/plugin/devopsflow.ts`。
另有 main Codex session 禁写 hook：所有分支上 main Codex session 只能协调、审查和验证，代码写入必须交给 Codex worker session 或兼容适配器识别的写入会话。

## 重要：必须开启 Plan 模式

使用 DevOpsFlow 前，请先在 Codex 中开启 Plan 模式。

这些 skills 依赖“先澄清、先建模、先计划、再执行”的工作方式。尤其是 DDD、TDD、实现计划、调试和评审流程，如果没有先进入 Plan 模式，Codex 很容易被用户的数据表、CRUD 页面、零散实现要求带偏，直接进入编码或一次性输出未经确认的设计。

推荐使用方式：

1. 先开启 Plan 模式。
2. 让 `df-engineering-workflow-router` 判断任务类型和必需 skill。
3. 按 skill 要求完成确认、建模或计划。
4. 用户确认后再进入实现、验证、提交或 PR。

不要把 Plan 模式当成可选步骤；它是 DevOpsFlow 工作流的入口保护。

## 安装为 Codex Plugin

本仓库只支持 Codex Plugin 安装方式，避免独立 skill 安装命令与插件目录结构漂移。
Marketplace 安装包入口就是仓库根目录。Codex 安装时从根目录读取完整插件包文件，
因此 `.codex-plugin/plugin.json`、`skills/`、`hooks/` 和 `assets/` 是唯一包来源。

关键文件位于：

```text
Codex marketplace manifests
.codex-plugin/plugin.json
skills/
hooks/
assets/
```

Codex CLI 0.132.0 识别 agents marketplace manifest；
codex-plugin marketplace manifest 保留为兼容副本。两个 marketplace manifest 必须保持同步，
并都使用 `local` source 指向仓库根目录 `.`。
插件安装入口是 `.codex-plugin/plugin.json`；
根目录 `skills/`、`hooks/` 和 `assets/` 是唯一需要维护的插件包内容。

从远程仓库添加 marketplace、刷新缓存并安装插件：

```bash
codex plugin marketplace add LiTeXz/devflow-skills
codex plugin marketplace upgrade devopsflow
codex plugin add devopsflow@devopsflow
```

安装完成后，重开 Codex 线程以加载新的 plugin skills 和 hook。

<details>
<summary>本地开发安装</summary>

> [!NOTE]
> 只有在开发或调试当前 checkout 时，才需要从仓库根目录添加本地 marketplace。

```bash
codex plugin marketplace add .
codex plugin list --marketplace devopsflow
codex plugin add devopsflow@devopsflow
```

</details>

## 本地安装为 OpenCode Plugin

OpenCode 当前按本地 checkout 使用。仓库已提供 `.opencode/plugin/devopsflow.ts`，从仓库根目录启动 OpenCode 时会自动发现该插件；在其他项目中使用时，可在目标项目的 `opencode.json` 中引用本仓库插件并加载 skills：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["/absolute/path/to/devopsflow/.opencode/plugin/devopsflow.ts"],
  "skills": {
    "paths": ["/absolute/path/to/devopsflow/skills"]
  }
}
```

OpenCode 插件会复用同一套保护规则：main Codex session 禁写、兼容适配器识别的写入会话可在非保护分支写入、保护分支写入拦截、所有 agent 的 `git push` 全局拦截。修改 `opencode.json`、插件或 skills 后，需要退出并重启 OpenCode 才会重新加载。

## 技能组合图

```text
用户提出需求
  -> df-engineering-workflow-router
  -> 长任务/续跑/易中断：df-resumable-workflow-guard
  -> 领域复杂：df-ddd-event-storming-design
  -> 领域已清楚且存在相似实现：df-glue-coding
  -> 设计已确认且要实现：df-ddd-to-tdd-handoff
  -> 多步骤实现：df-implementation-planning
  -> 开始编码：df-executing-implementation-plan
    -> 每个行为切片：df-tdd-skill
    -> Spring Web 变更：df-spring-web-boundaries
    -> 失败/异常：df-systematic-debugging
  -> 完成实现：df-requesting-code-review
  -> 修 review：df-receiving-code-review
  -> 最终声明完成：df-verification-before-completion
  -> 提交/PR：df-finishing-development-branch
```

## 仓库结构

```text
.codex-plugin/plugin.json
.codex-plugin/assets/
.opencode/plugin/devopsflow.ts
assets/
hooks/
scripts/
skills/
src/shared/          # 共享工具库
package.json
tsconfig.json
bunfig.toml
```

本仓库使用 TypeScript + Bun 运行时，通过 pnpm 管理依赖。

`skills/` 下的每个目录都是一个独立 Codex skill，包含必需的 `SKILL.md`，
以及可选的 `agents/`、`references/`、`scripts/`、`templates/`。

## Project-Owned Style Packs

DevOpsFlow can use project-owned style packs after the business design is clear. A style pack is not a shared DevOpsFlow template; it is repository-owned material that helps agents preserve local implementation style through rules, golden examples, anti-patterns, and review checklists.

Project-owned style packs have one default discovery location:

```text
.devopsflow/style-pack/
```

Recommended shape:

```text
.devopsflow/style-pack/
  <style-pack-name>/
    .pack.toml
    rules.md
    examples/
    anti-patterns.md
    review-checklist.md
```

`.pack.toml` describes metadata such as scope, applicable task types, primary examples, verification commands, review checks, and known exclusions.

Use style packs with `df-glue-coding` after DDD, CQRS, API, security, validation, and persistence constraints are already respected. Keep project-specific examples in the project repository, not in this public DevOpsFlow repository.

## 开发

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
pnpm test
```

### 类型检查

```bash
pnpm typecheck
```

### 校验

TDD 协议回归：

```bash
bun test skills/df-tdd-skill/scripts/
```

DDD 设计校验回归：

```bash
bun test skills/df-ddd-event-storming-design/scripts/
```

IAM 授权标识符校验回归：

```bash
bun test skills/df-iam-access-control-design/scripts/
```

Hook 回归：

```bash
bun test scripts/
```

## Commit Message

提交信息使用中文 Conventional Commits：

```text
feat: 新增工程工作流入口调度器
fix: 修复 DDD 校验脚本编码问题
docs: 更新技能组合说明
```
