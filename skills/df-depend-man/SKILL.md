---
name: df-depend-man
description: "审计并安全清理 JavaScript、Gradle、Maven 和 GitHub 依赖，识别无效、传递、重复、作用域错误、漂移或滥用的声明，并审查 Dependabot 规则。"
---

# Depend Man

当仓库新增、删除、升级、审计或整合依赖，或者 agent 必须审查依赖卫生时使用此 skill。它组合 Knip、Gradle/Maven 依赖分析、GitHub 配置检查和有证据支持的清理流程，不猜测架构意图。

## Workflow

1. 变更前检查仓库边界：包管理器与 lockfile、Gradle/Maven modules、source sets、生成代码、CI 文件和现有依赖政策。
2. 将每项发现分类为直接或传递、runtime 或 development、production 或 test、optional/peer/workspace，或者平台专用。仅通过未声明传递路径使用依赖属于边界违规，不能作为新增便利依赖的理由。
3. 以 scan 模式运行 `scripts/` 中匹配的脚本。优先使用仓库 wrapper（`pnpm`、`bun`、`gradlew.bat`、`mvnw.cmd`）和既有验证任务。
4. 区分确定发现与建议。当生成代码、反射、plugins、annotation processing、service loading、framework conventions 或平台 packaging 可能在没有文本 import 的情况下使用依赖时，不要删除该依赖。
5. 只有得到用户明确授权时才使用 `--fix`。编辑前记录 diff 并创建临时备份；编辑后运行最小且有意义的 build/test/lockfile 验证。验证失败时恢复备份。
6. 记录新依赖的理由：用途、调用位置、拒绝的替代方案、scope、license/security 影响和移除证据。行为变更搭配 `df-tdd-skill`；通过 `df-glue-coding` 复用本地约定；最后使用 `df-verification-before-completion`。

## Script Contract

每个 checker 接受 `--path`、`--fix`、`--dry-run` 和 `--format text|json`。JSON findings 包含 `ecosystem`、`file`、`dependency`、`type`、`evidence`、`risk`、`action` 和 `autoFixable`。退出码 `0` 表示没有阻断发现，`1` 表示存在阻断发现，`2` 表示所需工具或 build 入口不可用，`3` 表示修复或验证失败。

### JavaScript

运行 `bun scripts/check-js-dependencies.ts --path .`。根据 lockfiles 检测 npm/pnpm/Bun，并在已安装或可通过包管理器使用时调用 Knip。`--fix` 仅限 Knip 确认的直接 unused/unlisted dependencies，并保留 peer、optional、workspace 和 runtime entry 声明。

### Gradle and Maven

在仓库根目录运行匹配的 checker。检查 dependency trees、`dependencyInsight` 或 `dependency:analyze`、直接声明、source sets、profiles 和 multi-module boundaries。只有候选项明确、存在本地声明且编辑后验证成功时才允许 JVM `--fix`；否则输出 patch 建议。

### GitHub

运行 `bun scripts/check-github-dependencies.ts --path .` 检查 Dependabot、Actions、container images 和固定的工具版本。默认政策为每周更新、区分 production/development groups、设置 `open-pull-requests-limit: 5` 并保留 security updates。不要虚构 labels、assignees 或 ignore rules。

## References and Assets

选择 ecosystem 工具时加载 [dependency-tool-matrix.md](references/dependency-tool-matrix.md)，审查架构或新依赖时加载 [dependency-policy.md](references/dependency-policy.md)，生成 GitHub 更新配置时加载 [dependabot-policy.md](references/dependabot-policy.md)。只有调整命令和可用 ecosystems 后，才能将 [dependency-governance.yml](assets/dependency-governance.yml) 复制到宿主仓库。
