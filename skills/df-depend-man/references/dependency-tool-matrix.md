# Dependency Tool Matrix

| Ecosystem | Primary evidence | Secondary evidence | Verification |
| --- | --- | --- | --- |
| npm/pnpm/Bun | Knip 的 unused、unlisted、exports 结果 | package manager list/why 与 lockfile | install、typecheck、tests |
| Gradle | `dependencies`、`dependencyInsight` | 项目的 dependency-analysis task | wrapper build/test |
| Maven | `dependency:analyze`、`dependency:tree` | versions plugin 与 effective-pom | Maven verify/test |
| GitHub | Dependabot YAML 与 Actions pins | container/script 引用 | workflow syntax 与 policy review |

优先使用 wrapper 命令和仓库自有 plugins。将 reflection、generated sources、annotation processors、service loaders、plugin DSLs 和 packaging metadata 视为 false-positive 来源。缺少工具时生成 finding 并以 `2` 退出，不能据此推断依赖图干净。
