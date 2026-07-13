> 本项目基于 [LiTeXz/devflow-skills](https://github.com/LiTeXz/devflow-skills) 二次开发并公开发布。感谢原作者 [LiTeXz](https://github.com/LiTeXz) 的贡献；本项目继续遵循 [GPL-3.0-only](LICENSE) 协议。

<h1 align="center">DevOpsFlow</h1>

<p align="center">
  <img src="assets/app-icon.png" alt="DevOpsFlow" width="160"/>
</p>

<p align="center">
  面向 Codex 的工程工作流插件，让 AI 先理解、再计划、后执行。
</p>

## 功能

- 根据任务自动选择合适的工作流
- 支持 DDD、TDD、调试、评审和验证
- 为长任务保留检查点，方便中断后继续
- 保护常见集成分支，避免直接写入或推送
- 兼容 Codex 与 OpenCode

## 安装

### Codex

```bash
codex plugin marketplace add TrueNine/devopsflow
codex plugin marketplace upgrade devopsflow
codex plugin add devopsflow@devopsflow
```

安装完成后，重新打开 Codex 任务。

### OpenCode

下载本仓库后，在项目的 `opencode.json` 中添加：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["/absolute/path/to/devopsflow/.opencode/plugin/devopsflow.ts"],
  "skills": {
    "paths": ["/absolute/path/to/devopsflow/skills"]
  }
}
```

将示例中的路径替换为本仓库的实际路径，然后重新启动 OpenCode。

## 使用

1. 在 Codex 中开启 Plan 模式。
2. 像平常一样描述需求。
3. DevOpsFlow 会选择所需工作流，并引导任务完成澄清、实现和验证。

## 说明

在 `main`、`dev`、`develop`、`devlop` 等集成分支上，DevOpsFlow 会提醒创建新分支，
并阻止直接写入、提交或推送。请通过功能分支和 PR 完成变更。

## 其他

- [参与贡献](CONTRIBUTING.md)
- [GNU General Public License v3.0](LICENSE)
