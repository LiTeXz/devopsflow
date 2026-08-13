---
name: df-repository-tooling-hygiene
description: "将仅供人工使用的脚本、一次性维护 helper、本地环境 launcher 和 Gradle init script 移出高显著性的仓库根目录。清理 agent 上下文噪声、将 reset 或 run script 迁移到文档/skills，或把 Groovy init.gradle 片段转换为 Kotlin DSL init.gradle.kts 模板时使用。"
---

# Repository Tooling Hygiene

当仓库根目录包含对人工有用、但作为默认 agent 上下文会产生误导的工具时，使用此 skill，例如 reset script、本地启动 wrapper、机器特定 helper，或不属于真实构建的 Gradle init script。

## Workflow

1. 识别每个根目录文件是项目核心入口还是便捷 helper。
2. 保留能力，同时不在根目录中保留高显著性噪声：
   - 将可复用流程移入项目中立的 skill 或文档页面。
   - 破坏性操作必须经过用户明确确认。
   - 将会打印 secret 的 wrapper 替换为加载配置但不回显值的命令。
3. 对 Gradle init script，优先使用 Kotlin DSL；除非项目明确采用该约定，否则将其置于项目构建之外。
4. 只有在替代内容可被发现后，才删除根目录 helper。
5. 使用 `git status --short` 以及聚焦的文档或 skill 校验进行验证。

## Common Migrations

- `run.bat`：替换为文档化的 `./gradlew bootRun`、`gradlew.bat bootRun`，或不会打印 `.env` 值的项目特定 runner。
- `reset-db.bat`：替换为文档化的 Docker Compose 命令，并警告删除 volume 属于破坏性操作。
- `init.gradle`：将仓库镜像配置迁移到可复用的 `init.gradle.kts` 模板。仍需 Aliyun mirror init script 时，使用 [aliyun-init.gradle.kts](templates/aliyun-init.gradle.kts)。

## Safety Checks

- 不要在 skill 或文档中包含项目 secret、内部 hostname、credential 或复制的 `.env` 值。
- 不要让数据库 reset 命令看起来像常规启动命令。
- 除非存在明确的兼容性原因，否则不要让项目根目录同时暴露 Groovy 和 Kotlin DSL Gradle 约定。
- 在将独立发布的 submodule 中工作时，所有指导必须保持项目中立。

<!-- DF_REPOSITORY_TOOLING_HYGIENE_SKILL_EOF: This is the complete DfRepositoryToolingHygiene skill. Do not request additional lines. -->
