# 参与贡献

感谢你参与 DevOpsFlow。提交改动前，请先阅读本说明。

## 环境要求

- [Bun](https://bun.sh/)
- [pnpm](https://pnpm.io/)
- TypeScript

安装依赖：

```bash
pnpm install
```

## 开始开发

1. 从最新的目标分支创建功能分支。
2. 保持改动范围单一，不混入无关调整。
3. 修改 skill 时，同步检查其 `SKILL.md`、`agents/`、`references/`、`scripts/` 和 `templates/`。
4. 新增或改变行为时，补充对应测试。
5. 提交前完成相关验证。

请勿直接在 `main`、`dev`、`develop` 或 `devlop` 等集成分支上开发。

## 项目结构

```text
.codex-plugin/   Codex 插件清单
.opencode/       OpenCode 适配
agents/          Agent 配置
assets/          图片与插件资源
hooks/           Codex hooks
scripts/         校验脚本与测试
skills/          DevOpsFlow skills
src/shared/      共享实现
```

## 验证

```bash
pnpm test
pnpm typecheck
pnpm lint
```

也可以按改动范围运行专项验证：

```bash
pnpm test:hooks
pnpm test:validators
pnpm check:skill-metadata
```

提交 PR 时，请说明已运行的命令及结果。未运行的检查也应注明原因。

## 提交信息

使用中文 Conventional Commits：

```text
feat: 新增工程工作流入口调度器
fix: 修复 DDD 校验脚本编码问题
docs: 更新技能组合说明
test: 补充 TDD 协议回归用例
chore: 调整 skill 元数据
```

常用类型包括 `feat`、`fix`、`docs`、`test`、`refactor` 和 `chore`。

## Pull Request

提交 PR 前，请确认：

- 改动目的和范围清晰
- 没有包含无关文件
- 新行为有相应测试或验证证据
- 文档与插件元数据已按需同步
- 所有必要检查已通过
- PR 描述说明了风险、限制或未完成事项

建议每个 PR 只解决一个明确问题，以便审查和回退。

## 许可证

提交贡献即表示你同意贡献内容按照本项目的 [GNU General Public License v3.0](LICENSE) 发布。
