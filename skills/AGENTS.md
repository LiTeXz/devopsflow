# skills/ 子树命名治理

本目录下新增或重命名的 skill 目录名必须以 `df-` 开头。

每个 skill 的 `SKILL.md` front matter 中的 `name` 字段也必须以 `df-` 开头。

原因：DevOpsFlow skills 会作为插件或外部 skills 混入使用，统一 `df-` 前缀可以避免和其他来源的 skills 发生名称冲突。

迁移或新增 skill 时，目录名和 `name` 字段必须保持一致。同步更新所有引用、README、测试和脚本里的 skill 名称。

提交信息继续遵守根 `AGENTS.md` 中的中文 Conventional Commits 规范。
