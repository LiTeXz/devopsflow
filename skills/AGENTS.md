<!-- BEGIN skills/AGENTS.md -->

# skills/AGENTS.md

本文件补充根 [AGENTS.md](../AGENTS.md)，适用于 `skills/` 子树。

## Metadata

- skill 目录名必须以 `df-` 开头。
- `SKILL.md` front matter 必须包含 `name` 和 `description`，且 `name` 必须与目录名完全一致。
- 每个 skill 必须包含 `agents/openai.yaml`。
- `interface.display_name` 必须等于目录名移除 `df-` 后按单词首字母大写得到的名称。
- `interface.short_description` 必须与 `SKILL.md` front matter 的 `description` 完全一致。
- 元数据判定以 [check-skill-metadata.ts](../scripts/check-skill-metadata.ts) 为准。

## Changes

修改、迁移、新增或删除 skill 时，按需同步 `SKILL.md`、`agents/`、`references/`、`scripts/`、`templates/`、示例、README、router、插件元数据、测试、引用以及托管资产哈希。

## Verification

运行与改动直接相关的测试，并至少运行：

```bash
bun run check:skill-metadata
```
<!-- END skills/AGENTS.md -->
