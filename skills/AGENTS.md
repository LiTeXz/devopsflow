<!-- BEGIN:skills/AGENTS.md -->

# skills/AGENTS.md

this file 补充根 [AGENTS.md](../AGENTS.md), 适用于 `skills/` 子树.

## Distribution Context

`skills/` 中的内容是可 install, 可分发的通用 workflow, 不是只 service 于 DevopsFlow 源 code repository 的 project prompt. write, 审查 or tests skill 时, 必须假定 Codex 当前已经位于 user 要求处理的 target project 中; 该 target project 可能 and this repository 完全不同.

- 不得把 DevopsFlow 源 code repository, directory 结构, module 名, 构建命令 or file 路径当作 runtime default context.
- 不得假定 target project 存在 `skills/`,`agents/`,`.devopsflow/` or 任何 DevopsFlow 专属 directory; 使用这些路径前必须说明它们是可选 project 产物, 并 check 是否存在.
- Skill 自带 script, 模板 and 参考资料的路径必须区分维护期源 code 路径 and install 后的 plugin 路径; 面向 user 的命令不得无条件要求在 DevopsFlow 源 code 根 directory execution.
- `DevopsFlow` 可以作为 plugin, 产品, skill 提供方 or 资产发布来源出现, 但不能成为普通 skill 的 default 角色态位, target repository or 业务 domain.
- description, default prompt, 正文, example and 验证 script 都必须保持上述可移植 context; 任何发现当前 project 假设的修改都要覆盖所有同类入口.

## Portability Review

修改 or 审查 skill 时, 至少 check `SKILL.md`,`agents/openai.yaml`, script 帮助文本, 模板 and example 中的 target project,`cwd`, 相对路径, 命令 and 角色自称. 优先使用 target project 可发现的构建/tests 入口; 若命令只适用于 skill install package or 维护 repository, 必须显式标注其来源 and 适用阶段.

## Metadata

- skill directory 名必须以 `df-` 开头.
- `SKILL.md` front matter 必须 include `name` and `description`, 且 `name` 必须 and directory 名 exactly match.
- 每个 skill 必须 include `agents/openai.yaml`.
- `interface.display_name` 必须等于 directory 名移除 `df-` 后按单词首字母大 write 得到的 name.
- `interface.short_description` 必须 and `SKILL.md` front matter 的 `description` exactly match.
- 元数据判定以 `bun run check:skill-metadata` 的 result 为准.

## Changes

修改, 迁移, 新增 or 删除 skill 时, 按需同步 `SKILL.md`,`agents/`,`references/`,`scripts/`,`templates/`, example, README, router, plugin 元数据, tests, 引用以及托管资产哈希.

## Verification

run and 改动直接相关的 tests, 并至少 run:

```bash
bun run check:skill-metadata
```
<!-- END:skills/AGENTS.md -->
