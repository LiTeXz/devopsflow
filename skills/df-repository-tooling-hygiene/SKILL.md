---
name: df-repository-tooling-hygiene
description: "将仅供人工使用的 script, 1 次完成维护 helper, local 环境 launcher and Gradle init script 移出高显著性的 repository 根 directory. 清理 agent context 噪声, 将 reset or run script 迁移到文档/skills, or 把 Groovy init. gradle 片段转换为 Kotlin DSL init. gradle. kts 模板时使用."
version: "0.2.28"
license: "GPL-3.0-only"
metadata:
  version: "0.2.28"
---

# Repository Tooling Hygiene

当 repository 根 directory include 对人工有用, 但作为 default agent context 会产生误导的工具时, 使用此 skill, 例如 reset script, local 启动 wrapper, 机器特定 helper, or 不属于真实构建的 Gradle init script.

## Workflow

1. 识别每个根 directory file 是 project 核心入口还是便捷 helper.
2. 保留能力, 同时不在根 directory 中保留高显著性噪声:
   - 将可复用流程移入 project 中立的 skill or 文档页面.
   - 破坏性操作必须经过 user 明确确认.
   - 将会打印 secret 的 wrapper 替换为加载配置但不回显 value 的命令.
3. 对 Gradle init script, 优先使用 Kotlin DSL; 除非 project 明确采用该约定, 否则将其置于 project 构建之外.
4. 只有在替代内容可被发现后, 才删除根 directory helper.
5. 使用 `git status --short` 以及聚焦的文档 or skill verify 进行验证.

## Common Migrations

- `run.bat`: 替换为文档化的 `./gradlew bootRun`,`gradlew.bat bootRun`, or 不会打印 `.env` value 的 project 特定 runner.
- `reset-db.bat`: 替换为文档化的 Docker Compose 命令, 并警告删除 volume 属于破坏性操作.
- `init.gradle`: 将 repository 镜像配置迁移到可复用的 `init.gradle.kts` 模板. 仍需 Aliyun mirror init script 时, 使用 [aliyun-init.gradle.kts](templates/aliyun-init.gradle.kts).

## Safety Checks

- 不要在 skill or 文档中 include project secret, 内部 hostname, credential or 复制的 `.env` value.
- 不要让数据库 reset 命令看起来像常规启动命令.
- 除非存在明确的兼容性原因, 否则不要让 project root directory 同时暴露 Groovy and Kotlin DSL Gradle 约定.
- 在将独立发布的 submodule 中 work 时, 所有指导必须保持 project 中立.

<!-- DF_REPOSITORY_TOOLING_HYGIENE_SKILL_EOF: This is the complete DfRepositoryToolingHygiene skill. Do not request additional lines. -->
