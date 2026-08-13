<!-- BEGIN:skills/AGENTS.md -->

# skills/AGENTS.md

本文件补充根 [AGENTS.md](../AGENTS.md)，适用于 `skills/` 子树。

## Distribution Context

`skills/` 中的内容是可安装、可分发的通用工作流，不是只服务于 DevopsFlow 源码仓库的项目提示词。编写、审查或测试 skill 时，必须假定 Codex 当前已经位于用户要求处理的目标项目中；该目标项目可能与本仓库完全不同。

- 不得把 DevopsFlow 源码仓库、目录结构、模块名、构建命令或文件路径当作运行时默认上下文。
- 不得假定目标项目存在 `skills/`、`agents/`、`.devopsflow/` 或任何 DevopsFlow 专属目录；使用这些路径前必须说明它们是可选项目产物，并检查是否存在。
- Skill 自带脚本、模板和参考资料的路径必须区分维护期源码路径与安装后的 plugin 路径；面向用户的命令不得无条件要求在 DevopsFlow 源码根目录执行。
- `DevopsFlow` 可以作为插件、产品、skill 提供方或资产发布来源出现，但不能成为普通 skill 的默认角色态位、目标仓库或业务领域。
- 描述、默认 prompt、正文、示例和验证脚本都必须保持上述可移植上下文；任何发现当前项目假设的修改都要覆盖所有同类入口。

## Portability Review

修改或审查 skill 时，至少检查 `SKILL.md`、`agents/openai.yaml`、脚本帮助文本、模板和示例中的目标项目、`cwd`、相对路径、命令和角色自称。优先使用目标项目可发现的构建/测试入口；若命令只适用于 skill 安装包或维护仓库，必须显式标注其来源和适用阶段。

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
<!-- END:skills/AGENTS.md -->
