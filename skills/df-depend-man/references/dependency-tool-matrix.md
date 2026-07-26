# Dependency Tool Matrix

| Ecosystem | Primary evidence | Secondary evidence | Verification |
| --- | --- | --- | --- |
| npm/pnpm/Bun | Knip unused, unlisted, exports | package manager list/why and lockfile | install, typecheck, tests |
| Gradle | `dependencies`, `dependencyInsight` | project dependency-analysis task | wrapper build/test |
| Maven | `dependency:analyze`, `dependency:tree` | versions plugin and effective-pom | Maven verify/test |
| GitHub | Dependabot YAML and Actions pins | container/script references | workflow syntax and policy review |

Prefer wrapper commands and repository-owned plugins. Treat reflection, generated sources, annotation processors, service loaders, plugin DSLs, and packaging metadata as false-positive sources. Missing tools produce a finding and exit `2`; they are not permission to infer a clean graph.
