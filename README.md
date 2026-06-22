# DevFlow Skills

DevFlow Skills 是一组面向 Codex 的工程工作流 skills。它把 DDD、Glue Coding、TDD、计划、执行、调试、评审、验证和分支收尾组织成一套可组合的强制工作流。

插件还包含一个保护分支 hook：在 `main`、`dev`、`develop`、`devlop`
等常见集成分支上启动会话时提醒切换新分支；在这些分支上拦截写文件、
修改索引、提交、重置、依赖安装和直接 push 等污染操作，并提示改用新分支
和 PR 流程。hook 配置位于 `hooks/hooks.codex.json`，并由
`.codex-plugin/plugin.json` 声明为插件 companion。
另有主 Agent 禁写 hook：所有分支上主 Agent 只能协调、审查和验证，代码写入必须交给 worker/subagent。

## 重要：必须开启 Plan 模式

使用 DevFlow Skills 前，请先在 Codex 中开启 Plan 模式。

这些 skills 依赖“先澄清、先建模、先计划、再执行”的工作方式。尤其是 DDD、TDD、实现计划、调试和评审流程，如果没有先进入 Plan 模式，Codex 很容易被用户的数据表、CRUD 页面、零散实现要求带偏，直接进入编码或一次性输出未经确认的设计。

推荐使用方式：

1. 先开启 Plan 模式。
2. 让 `engineering-workflow-router` 判断任务类型和必需 skill。
3. 按 skill 要求完成确认、建模或计划。
4. 用户确认后再进入实现、验证、提交或 PR。

不要把 Plan 模式当成可选步骤；它是 DevFlow 工作流的入口保护。

## 安装为 Codex Plugin

本仓库只支持 Codex Plugin 安装方式，避免独立 skill 安装命令与插件目录结构漂移。
Marketplace 和插件 manifest 位于：

```text
.codex-plugin/marketplace.json
.codex-plugin/plugin.json
skills/
```

从远程仓库添加 marketplace：

```bash
codex plugin marketplace add LiTeXz/devflow-skills
```

<details>
<summary>本地开发安装</summary>

> [!NOTE]
> 只有在开发或调试当前 checkout 时，才需要从仓库根目录添加本地 marketplace。

```bash
codex plugin marketplace add .
```

</details>

更新 marketplace 缓存：

```bash
codex plugin marketplace upgrade devflow-skills
```

然后在 Codex App 的 Plugins 页面安装 `devflow-skills`。安装完成后，开启新线程以加载新的 plugin skills 和 hook。

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
.codex-plugin/plugin.json
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
bun test skills/tdd-skill/scripts/
```

DDD 设计校验回归：

```bash
bun test skills/ddd-event-storming-design/scripts/
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
