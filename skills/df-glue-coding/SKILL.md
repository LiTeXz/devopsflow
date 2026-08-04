---
name: df-glue-coding
description: "面向 AI 实现的 Glue Coding 工作流，应复用本地项目材料，同时避免盲目复制旧结构。在领域歧义已解决或被声明为很薄后、实施规划或编码前使用，适用于与现有 CRUD 页面、列表/表单/详情界面、导入/导出、端点、adapter、command handler、projection、测试、配置、重构、迁移、现代化或其他可重复项目 pattern 相似的任务。此 skill 会发现本地 style pack、参考代码、示例、文档、AGENTS.md 规则和附近的生产实现，将其归类为 target pattern、legacy pattern、anti-pattern 或 behavior evidence，保留正确约定，并将新代码限制在预期差异内。"
---

# Glue Coding

当实现应由现有项目材料组装时，使用此 skill。

目标不是让 Codex 更具创造性，而是通过复制正确的 target pattern 并只修改必要差异，使 Codex 保留正确的本地约定。

## Core Boundary

DDD 负责业务事实，Glue Coding 负责工程复用。

如果请求包含不清晰的领域语言、隐藏业务规则、状态转换、多角色协作、权威性问题、policy、aggregate 或 read model 歧义，先使用 `df-ddd-event-storming-design`。可以提前读取代码 pattern 作为发现输入，但在 DDD gate 确认前，它们不得成为最终设计。

在以下条件满足后使用 Glue Coding：

- 领域已经清晰或被有意视为很薄
- 请求主要是对现有功能形态的扩展
- 已确认的 DDD 结论已准备映射到实现

## Material Types

按以下顺序查找项目所有的材料：

1. 规则：`AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`、本地文档、package script、framework config。
2. Style pack 和 reference pattern：用户明确提供的 style pack 路径、`.devopsflow/style-pack/`、`reference/`、`references/`、`examples/`、`docs/patterns/`、`.ai/patterns/`、template、scaffold。
3. 附近的生产代码：相似页面、endpoint、handler、adapter、projection、测试、fixture、migration、export、import、job 或 config。对于重构，判断每个候选是 target pattern、legacy pattern、anti-pattern 还是 behavior evidence。
4. 历史上下文：`.ai/tracks/`、之前的 spec、计划、ADR、issue note、PR 描述或实现说明。

不要在此 skill 中存放项目特定示例代码。具体示例属于项目仓库；此 skill 只定义如何查找和使用它们。

## Workflow

1. 对任务分类：
   - `glue_fit`：现有本地 pattern 可能覆盖大部分结构
   - `glue_partial`：pattern 已存在，但重要差异需要设计或测试
   - `not_glue`：没有可信的本地 pattern，或工作具有新颖性
   - `domain_blocked`：任务看似适合 Glue，但业务含义不清
   - `refactor_glue`：当前代码正从旧 pattern 迁移到 target pattern
2. 如果是 `domain_blocked`，返回 `df-ddd-event-storming-design`。发现的代码只能作为提问和候选语言的证据。
3. 规划实现前搜索本地材料。优先使用 `rg --files` 和定向 `rg` 搜索。
4. 如果 style pack 可用且适用，在选择源示例前先选定它。发现位置、推荐结构和使用规则见 [style-packs.md](references/style-packs.md)。
5. 选择最接近的 pattern，并记录其适用原因：
   - 相同的用户工作流或业务能力
   - 相同的 framework 或 layer
   - 相同的文件组织
   - 相同的 dependency、request、validation、error、transaction、auth 或 test style
   - 相同的 lifecycle、command、event、projection 或 read model 形态
6. 识别必须保留的内容：
   - 文件和 module 结构
   - naming 和 import
   - component 或 API composition
   - request/response mapping
   - validation 和 error semantic
   - persistence、ordering、pagination、transaction、concurrency 或 side effect 行为
   - test style 和 fixture 形态
7. 识别差异：
   - 与 pattern 不同的 field、label、column、filter、route、endpoint、DTO、event、command、policy、invariant、read model field、adapter mapping 或业务规则
8. 将选定的 style pack、pattern、需保留约定和差异传递给 `df-implementation-planning` 或 `df-ddd-to-tdd-handoff`。

## Refactor Mode

当用户要求重构、迁移、清理、现代化、标准化或替换旧 pattern 时，不要假定附近的相似代码就是 target pattern。

将发现的代码分类为：

- `target_pattern`：应保留、复制或作为迁移目标的约定
- `legacy_pattern`：可解释行为但不应复制其结构的当前实现风格
- `anti_pattern`：任务明确要移除的代码形态、dependency 或约定
- `behavior_evidence`：characterization test、兼容性约束、输入、输出、错误、顺序、持久化、事务和副作用的证据来源
- `unknown`：使用前需要更多证据的候选

对于重构工作：

1. 阅读 legacy code，理解行为、公共契约、副作用和兼容性风险。
2. 变更行为保持型代码前，使用 `df-tdd-skill` characterization test。
3. 在仓库其他位置或明确的参考材料中搜索 target pattern。
4. 如果 target pattern 不存在，将目标设计任务传给 `df-implementation-planning`，而不是复制 legacy 形态。
5. 保留 behavior evidence，而不是偶然结构。
6. 将重构步骤与行为变更分开。

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

保持简洁。不要在回复中粘贴很长的源文件；引用文件路径和相关 symbol。

## Non-Negotiable Rules

- 当看似 CRUD 的请求隐藏业务含义时，不要跳过 DDD。
- 说明选定 pattern 和差异前，不要复制代码。
- 存在良好本地 pattern 时，不要发明新的项目结构。
- 业务设计确认后，不要忽略适用且归项目所有的 style pack。
- 重构期间不要把 legacy code 或 anti-pattern 当作 target pattern。
- 除非用户明确接受风险，否则不要在缺少 characterization 覆盖时重构行为保持型代码。
- 不要把过时或无关示例视为权威；参考材料与仓库冲突时，优先采用当前生产代码。
- 如果 pattern 违反已确认的领域规则、安全、验证、持久化或公共契约，不要盲目保留。
- 不要让 Glue Coding 成为逃避测试的方式。除非任务只涉及文档或被明确规定为不可执行，否则行为变更仍需要 `df-tdd-skill`。
- 不要向此 skill 添加项目特定示例。将可复用示例放入项目仓库，并从 `AGENTS.md` 或本地文档提及。
- 不要把 style pack 当作业务事实。它只在 DDD、API、安全、验证和持久化约束已得到遵守后保留实现风格。

## Material Flywheel

交接或完成前，判断任务是否揭示了可复用材料：

- 值得添加到 `reference/`、`examples/`、`docs/patterns/` 或 `.ai/patterns/` 的新 code pattern 或改进 pattern
- 值得添加到 `.devopsflow/style-pack/` 的 style pack rule、golden example、anti-pattern 或 review checklist entry
- 应归入 `AGENTS.md` 或项目文档的规则
- 应归入本地知识笔记的领域知识或陷阱
- 应归入 `.ai/tracks/` 的持久 spec 或决策

建议更新材料，但除非用户要求该范围，否则不要创建大范围 pattern 仓库。
