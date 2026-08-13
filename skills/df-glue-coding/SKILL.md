---
name: df-glue-coding
description: "面向 AI implementation 的 Glue Coding workflow, 应复用 local project 材料, 同时避免盲目复制旧结构. 在 domain 歧义已解决 or 被声明为很薄后, 实施规划 or code 前使用, 适用于 and 现有 CRUD 页面, 列表/表单/详情界面, import/导出, 端点, adapter, command handler, projection, tests, 配置, refactor, 迁移, 现代化 or other 可重复 project pattern 相似的 task. 此 skill 会发现 local style pack, 参考 code, example, 文档, AGENTS.md rule and 附近的生产 implementation, 将其归类为 target pattern, legacy pattern, anti-pattern or behavior evidence, 保留正确约定, 并将新 code 限制在预期差异内."
---

# Glue Coding

当 implementation 应由现有 project 材料组装时, 使用此 skill.

target 不是让 Codex 更具创造性, 而是 by reusing 正确的 target pattern 并只修改必要差异, 使 Codex 保留正确的 local 约定.

## Core Boundary

DDD 负责业务事实, Glue Coding 负责工程复用.

if 请求 include 不清晰的 domain language, 隐藏业务 rule, 状态转换, 多角色协作, 权威性问题, policy, aggregate or read model 歧义, 先使用 `df-ddd-event-storming-design`. 可以提前读取 code pattern 作为发现 input, 但在 DDD gate 确认前, 它们不得成为最终设计.

在以下条件满足后使用 Glue Coding:

- domain 已经清晰 or 被有意视为很薄
- 请求主要是对现有 feature 形态的扩展
- 已确认的 DDD 结论 ready mapping 到 implementation

## Material Types

按以下顺序查找 project 所有的材料:

1. rule:`AGENTS.md`,`CLAUDE.md`,`.github/copilot-instructions.md`, local 文档, package script, framework config.
2. Style pack and reference pattern: user 明确提供的 style pack 路径,`.devopsflow/style-pack/`,`reference/`,`references/`,`examples/`,`docs/patterns/`,`.ai/patterns/`, template, scaffold.
3. 附近的生产 code: 相似页面, endpoint, handler, adapter, projection, tests, fixture, migration, export, import, job or config. 对于 refactor, 判断每个候选是 target pattern, legacy pattern, anti-pattern 还是 behavior evidence.
4. history context:`.ai/tracks/`, 之前的 spec, 计划, ADR, issue note, PR description or implementation 说明.

不要在此 skill 中存放 project 特定 example code. 具体 example 属于 project repository; 此 skill 只 definition 如何查找 and 使用它们.

## Workflow

1. 对 task category:
   - `glue_fit`: 现有 local pattern 可能覆盖大部分结构
   - `glue_partial`: pattern 已存在, 但重要差异需要设计 or tests
   - `not_glue`: 没有可信的 local pattern, or work 具有新颖性
   - `domain_blocked`: task 看似适合 Glue, 但业务含义不清
   - `refactor_glue`: 当前 code 正从旧 pattern 迁移到 target pattern
2. if 是 `domain_blocked`, return `df-ddd-event-storming-design`. 发现的 code 只能作为提问 and 候选 language 的证据.
3. 规划 implementation 前搜索 local 材料. 优先使用 `rg --files` and 定向 `rg` 搜索.
4. if style pack available 且适用, 在选择源 example 前先选定它. 发现位置, 推荐结构 and 使用 rule 见 [style-packs.md](references/style-packs.md).
5. 选择最接近的 pattern, 并记录其适用原因:
   - 相同的 user workflow or 业务能力
   - 相同的 framework or layer
   - 相同的 file 组织
   - 相同的 dependency, request, validation, error, transaction, auth or test style
   - 相同的 lifecycle, command, event, projection or read model 形态
6. 识别必须保留的内容:
   - file and module 结构
   - naming and import
   - component or API composition
   - request/response mapping
   - validation and error semantic
   - persistence, ordering, pagination, transaction, concurrency or side effect 行为
   - test style and fixture 形态
7. 识别差异:
   - and pattern 不同的 field, label, column, filter, route, endpoint, DTO, event, command, policy, invariant, read model field, adapter mapping or 业务 rule
8. 将选定的 style pack, pattern, 需保留约定 and 差异传递给 `df-implementation-planning` or `df-ddd-to-tdd-handoff`.

## Refactor Mode

当 user 要求 refactor, 迁移, 清理, 现代化, 标准化 or 替换旧 pattern 时, 不要假定附近的相似 code 就是 target pattern.

将发现的 code category 为:

- `target_pattern`: 应保留, 复制 or 作为迁移 target 的约定
- `legacy_pattern`: 可解释行为但不应复制其结构的当前 implementation 风格
- `anti_pattern`: task 明确要移除的 code 形态, dependency or 约定
- `behavior_evidence`: characterization test, 兼容性约束, input, output, 错误, 顺序, 持久化, 事务 and 副作用的证据来源
- `unknown`: 使用前需要更多证据的候选

对于 refactor work:

1. 阅读 legacy code, 理解行为, 公共契约, 副作用 and 兼容性风险.
2. change 行为保持型 code 前, 使用 `df-tdd-skill` characterization test.
3. 在 repository other 位置 or 明确的参考材料中搜索 target pattern.
4. if target pattern 不存在, 将 target 设计 task 传给 `df-implementation-planning`, 而不是复制 legacy 形态.
5. 保留 behavior evidence, 而不是偶然结构.
6. 将 refactor 步骤 and 行为 change 分开.

## Output Format

```markdown
## Glue Coding Assessment

- Classification: glue_fit / glue_partial / not_glue / domain_blocked / refactor_glue
- DDD Prerequisite: confirmed / thin domain / DDD required first
- Selected Target Pattern Or Similar Implementation:
- Legacy Patterns, Anti-Patterns, And Behavior Evidence:
- Selection Rationale:
- Must Preserve:
- Current Delta:
- Rejected Candidates:
- Next Step:
```

保持简洁. 不要在回复中粘贴很长的源 file; 引用 file 路径 and 相关 symbol.

## Non-Negotiable Rules

- 当看似 CRUD 的请求隐藏业务含义时, 不要跳过 DDD.
- 说明选定 pattern and 差异前, 不要复制 code.
- 存在良好 local pattern 时, 不要发明新的 project 结构.
- 业务设计确认后, 不要忽略适用且归 project 所有的 style pack.
- refactor 期间不要把 legacy code or anti-pattern 当作 target pattern.
- 除非 user 明确接受风险, 否则不要在缺少 characterization 覆盖时 refactor 行为保持型 code.
- 不要把过时 or 无关 example 视为权威; 参考材料 and repository 冲突时, 优先采用当前生产 code.
- if pattern 违反已确认的 domain rule, 安全, 验证, 持久化 or 公共契约, 不要盲目保留.
- 不要让 Glue Coding 成为逃避 tests 的方式. 除非 task 只涉及文档 or 被明确规定为不可 execution, 否则行为 change 仍需要 `df-tdd-skill`.
- 不要向此 skill 添加 project 特定 example. 将可复用 example 放入 project repository, 并从 `AGENTS.md` or local 文档提及.
- 不要把 style pack 当作业务事实. 它只在 DDD, API, 安全, 验证 and 持久化约束已得到遵守后保留 implementation 风格.

## Material Flywheel

交接 or 完成前, 判断 task 是否揭示了可复用材料:

- value 得添加到 `reference/`,`examples/`,`docs/patterns/` or `.ai/patterns/` 的新 code pattern or 改进 pattern
- value 得添加到 `.devopsflow/style-pack/` 的 style pack rule, golden example, anti-pattern or review check list entry
- 应归入 `AGENTS.md` or project 文档的 rule
- 应归入 local 知识笔记的 domain 知识 or 陷阱
- 应归入 `.ai/tracks/` 的持久 spec or 决策

建议 update 材料, 但除非 user 要求该范围, 否则不要 create 大范围 pattern repository.

<!-- DF_GLUE_CODING_SKILL_EOF: This is the complete DfGlueCoding skill. Do not request additional lines. -->
