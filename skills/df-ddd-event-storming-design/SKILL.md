---
name: df-ddd-event-storming-design
description: 使用 Event Storming、CQRS 和需求追踪进行通用 DDD 领域建模。当 Codex 需要澄清原始业务需求、将干系人诉求拆分为需求条目、持续演进领域模型、识别参与者和多角色协作、Domain Event、Command、Policy、Aggregate、Domain Service 与 Read Model，生成结构化 Markdown 或可选的 Mermaid/PlantUML 图表，以及审查由 CRUD、数据库、包结构或 DDD 术语驱动而非由问题域驱动的设计时，使用此技能。尤其适用于公司、部门、岗位、员工、账号、角色或权限管理等看似 CRUD 的后台需求，此类需求应采用行为优先建模，而不是建立扁平的名词 Aggregate。
---

# DDD Event Storming Design

## Core Rule

将 Event Storming 作为 DDD 建模的核心入口。当用户输入仍需在需求层面梳理时，可以先进行需求收集。

当输入是原始需求、会议记录、功能列表、User Story 集合，或混合了 CRUD、页面与 API 的描述时，应先进行轻量级需求收集，再开展领域建模。需求收集属于建模前探索：识别干系人、需求条目、业务主体、触发条件、约束、输入/输出、假设和缺口。不得直接把收集结果转换成 Aggregate、Command、Domain Event、API、包或代码。

把 Event Storming 视为先协作发散、再有纪律收敛的过程。首先从业务语言、参与者目标、生命周期变化、失败、外部事实和查询需求中建立广泛的候选事件池。只有当候选事件具有业务含义、存在生产路径，并且至少有一个业务消费者会据此改变参与者选项、Command 侧规则、Policy/流程、Aggregate 或下游业务能力时，才将其接纳为 Domain Event。仅凭 Read Model 投影、页面展示、缓存刷新或查询完整性，不足以接纳 Domain Event。

不得把第一次头脑风暴得到的事件列表当作最终模型。候选事件是工作材料，已接纳的 Domain Event 才是设计结论。

从当前问题域、业务事实、Domain Event、Command、规则、状态变化和 Read Model 开始，之后再推导 Aggregate。

不得从数据库表、CRUD 页面、HTTP API、包结构、Entity、Aggregate Root、Repository 或战术 DDD 术语开始。

假定很多用户不熟悉 DDD。他们可能用表、字段、CRUD 页面、模块、Controller、DTO，或“管理公司/部门/岗位/员工”来描述问题。应把这些语言视为原始探索输入，而不是建模框架。

始终将数据驱动或 CRUD 驱动的请求转换为业务事件探索：

- 表名或 Entity 名 -> 可能受影响的业务主体、参考数据、Read Model 或生命周期候选项
- 字段 -> 可能的业务事实、决策、Invariant 或投影需求
- create/update/delete 操作 -> 解释变更为何重要的业务 Command
- 状态字段 -> 生命周期事件与规则转换
- 外键 -> 业务关系、所有权、依赖或一致性问题
- sync/upsert 表述 -> 外部事实、接纳/拒绝/冲突/延期事件，以及权威来源问题
- 后台页面 -> 参与者目标、职责、审批、所有权变化和审计关注点

不得将用户的数据模型原样复述成 DDD 模型。如果用户使用 CRUD 术语提出请求，应先简要说明转换边界，再使用业务语言通过各确认门。

在最终确定 Command 和 Domain Event 之前，始终识别业务参与者、外部系统、定时器和受影响主体。Command 由参与者发起；已接纳的 Domain Event 会改变一个或多个参与者或业务能力所关心的事项。应把 Read Model 视为投影消费者和探索线索，而不是 Domain Event 存在的独立证据。

除非用户明确要求实现，否则只生成领域设计产物。不得生成代码、测试、框架结构、持久化映射或 TDD 计划。

## Operating Mode

当用户持续演进同一业务领域时，优先采用持久化领域建模。

使用混合工作流：通过协作式头脑风暴进行探索，通过产物引导进行持久化收敛。

- 头脑风暴用于发散探索：通过短小章节和聚焦的确认问题，澄清业务边界、参与者、权威来源、候选事件、备选方案和未解决规则。
- 产物引导用于收敛：某章节稳定或得到明确确认后，将其记录到对应模型产物中，并让后续章节依赖它。
- 对新的 DDD 需求，不得采用 OpenSpec 风格的“一次生成所有产物”流程。不能因为已知完整仓库结构，就让 Event Storming 跳过上游确认门。
- 即使用户希望快速获得草稿，也必须停在第一个尚未确认且可能改变下游 Domain Event、Command、Aggregate 或 Read Model 的确认门。
- 当用户需要文件时，应将每个 `event-storming/` 文件视为阶段产物。只创建或更新结论已确认的阶段，不得用推测内容填充下游文件。

需求驱动建模采用三个阶段：

1. 必要时进行需求收集：把原始需求拆分为需求层面的表格，不将 DDD 战术术语作为结论。当输入包含多个用户可见需求或之后会实现时，分配稳定的需求 ID。
2. 设计草稿：分析请求，读取相关现有模型文件（如有），对候选事件和建模备选方案进行头脑风暴，推断下一个有用的设计章节，并且只呈现当前确认门可安全验证的结论。只有在影响完整候选模型的上游确认门已确认，或用户已明确给出答案后，才能呈现完整候选模型。
3. 章节确认与持久化：在草稿形成过程中与用户逐节确认。只有用户明确确认候选模型、变更章节或一组具体变更后，才能创建或更新 `event-storming/` 文件。

新需求或变更需求在确认前，不得创建或更新持久化模型文件。用户需求通常不完整，请求者也可能不知道哪些缺失事实会影响 DDD 建模。

不要用无关的澄清问题打断初始设计草稿。但是，当确认门控制下游建模时，必须先询问确认门问题，再展开依赖章节。如果缺失信息不阻塞当前确认门，应作出最小合理假设，将其标记为推断结论，并纳入确认清单。

例外：当请求是类似 CRUD 的名词列表（例如“公司、部门、岗位、员工”或“用户、角色、菜单、权限”）时，即使现有代码包含足以构建完整草稿的行为，也不得在第一次响应中臆造或输出完整管理模型。应先标记 CRUD 模板风险，然后停在问题域确认门，提出行为优先的边界建议和一个聚焦确认问题。只有该门得到确认或纠正后，才能继续处理参与者、Domain Event、Command、Aggregate 和 Read Model。

如果工作区包含 `event-storming/` 模型仓库，应先读取相关文件，但在获得确认之前只将其作为只读输入。

如果不存在：

- 用户需要文件时，先呈现最小可用的候选模型仓库内容与结论确认清单。
- 用户只需要讨论时，在对话中输出相同结构，不创建文件。

不要求用户预先提供完整需求。接受小步增量，基于已有信息进行设计，并将假设、备选方案和缺失业务事实作为待确认结论公开，然后再持久化。

## Requirements Intake

当输入宽泛、杂乱、呈现为实现形式，或之后可能转为实现工作时，使用需求收集。保持语言和框架中立。

此阶段只输出需求层面的事实：

- `干系人表`：角色、目标/痛点、权限或限制、备注。
- `需求条目表`：需求 ID、场景、干系人/受影响主体、业务主体、操作类型（如 view/create/modify/close/async/timer）、前置条件、约束、输入/输出、缺口。
- `业务主体视图`：业务主体、覆盖的需求 ID、职责/规则、关键输入/输出。
- `触发/后续动作表`：触发条件、后续动作或影响、相关干系人、受影响业务主体、假设。
- `业务规则与依赖`：规则/约束、相关主体、依赖的外部系统或先前事实、备注。
- `假设与待确认清单`：条目、说明、已知负责人、必要时的优先级。

规则：

- 需求 ID 是追踪锚点，不是架构名称。
- `业务主体视图` 可以提出待探索主体，但在没有 Event-Command-Rule 证据时，不得将其转为 Aggregate。
- create/update/delete 等操作类型仅是收集标签。在形成 Command 前，必须将其转换为业务意图。
- 触发/后续动作行是 Domain Event、Policy、流程或 Read Model 更新的候选材料；未经筛选不得接纳为 Domain Event。
- 如果用户只需要需求分析，应停在此处并在建模前请求确认。

## Brainstorming Adaptation

采用协作式头脑风暴中有用的部分，同时不削弱 DDD 纪律：

1. 先探索上下文：提出变更前，检查现有需求、模型文件、文档和近期领域决策。
2. 有意识地发散：从每个合理的参与者视角、下游消费者、生命周期转换、审批/拒绝、同步结果、异常和查询需求中收集候选事件。
3. 保持候选项低成本：将推测项标记为候选事件，而非最终 Domain Event。
4. 当边界或生命周期存在争议时，对比 2-3 种建模方案，例如单个 Aggregate 与 Process Manager、本地事件与外部系统事实、当前域事件与仅用于 Read Model 的投影。
5. 推荐一种方案，并用领域术语说明取舍：一致性边界、参与者职责、事件生产路径、投影完整性、Policy 复杂度和未来歧义。
6. 呈现设计章节供确认。在推进过远之前，请用户确认或纠正每个有意义的章节；需要追问时，每次只问一个聚焦问题。

为每个候选事件记录足够支持收敛的信息：

- 来源：用户陈述、现有模型、推断的参与者目标、Read Model 需求、Policy 反应或外部事实
- 使用已完成业务时态的可能事件名称
- 已知的发起参与者或外部系统
- 受影响主体和下游消费者
- Read Model 之外的业务消费者，以及它会改变的行为、规则、Policy、流程或能力
- 是否仅因查询/展示/投影而需要该候选项，因而应降级
- 可能的生产者：Command、Aggregate、Policy、流程或外部事实
- 保留它的业务理由
- 拒绝、拆分、重命名、降级为 Read Model 数据或标记为未解决的理由

只有已接纳事件才能进入正式的 `Domain Event Catalog`。被拒绝或未解决的候选项可以作为筛选备注或确认项出现在草稿中，但除非得到确认，否则不得作为最终事件持久化。

## Confirmation Protocol

优先逐节增量确认，而不是最后进行一次大规模确认。

在设计对话期间：

- 主要章节稳定后随即确认：问题边界、参与者、候选事件筛选、建模备选方案、已接纳事件、Command、Policy、Aggregate、Read Model 和持久化变更。
- 呈现章节后，如果答案可能改变后续章节，应询问其是否已足够正确，可以继续。
- 如果用户在对话中确认、记录或纠正某章节，应将其视为已确认或已纠正。结尾不得要求用户再次确认同一结论。
- 如果用户拒绝或改变某章节，应先修订下游 Domain Event、Command、Aggregate、Read Model 和确认项，再继续。
- 当缺失事实阻塞下一章节时，每次只问一个聚焦问题。

关键业务决策需要用户确认时：

- 如果当前环境提供 `request_user_input`，应使用它并提供 2-3 个互斥选项。将推荐选项放在首位，并说明每个选项的建模后果。
- 如果 `request_user_input` 不可用，不得将下游设计呈现为最终结论。使用普通文本明确说明继续前必须确认该决策，然后提出一个聚焦确认问题。
- 不得把多个高影响决策合并到一个最终答复或一个批量确认清单中。应在相关确认门依次询问。

对决定下游建模的章节使用确认门。除非用户已明确提供答案，否则不得越过这些确认门完整展开后续章节：

1. 需求收集门：当输入包含很多场景或干系人时，先确认需求条目、干系人、业务主体、触发条件和主要缺口，再将其作为建模输入。
2. 问题域门：确认领域名称、包含职责、排除职责，以及请求是否存在 CRUD 模板风险。应在最终确定参与者角色、事件筛选、Command、Aggregate 或 Read Model 之前完成。
3. 参与者与权威来源门：确认 Command 发起者、受影响主体、外部系统、下游系统，以及 OA 等外部来源是否具有权威性。应在推导已接纳事件和 Policy 之前完成。
4. 关键规则门：确认会塑造 Domain Event 和 Aggregate 边界的业务规则，例如单一或多个任职、负责人资格、删除或归档、冲突优先级，以及自动或手动后续动作。应在最终确定 Domain Event、Command、Invariant 和 Policy 之前完成。
5. 建模备选方案门：当存在 2-3 种合理方案时，应先确认推荐方案或用户选择的备选方案，再最终确定 Aggregate 边界和 Read Model。
6. 持久化门：写入文件前，只确认尚未确认或已变更且对持久化敏感的结论。

当请求看似 CRUD 或包含有争议的边界时，优先采用分阶段响应：

1. 只呈现下一个确认门章节，并简要说明其重要性。
2. 提出一个聚焦确认问题。
3. 只有该门得到确认或纠正后，才继续筛选候选事件。

如果早期确认门尚未确认且很可能改变下游模型，应避免在一次响应中生成完整的“边界 + 参与者 + Domain Event + Command + Policy + Aggregate + Read Model”草稿。

将最终 `结论确认清单` 用作差异清单，而不是重复审批表。它只能包含：

- 逐节对话中尚未确认的结论
- 用户上次确认后发生变化的结论
- 未解决的备选方案、假设、歧义术语或缺失业务规则
- 对持久化敏感的变更，例如重命名、拆分、合并、删除或移动模型概念

如果所有与持久化相关的结论都已在对话中确认，应说明没有额外确认项，并按用户要求执行持久化操作。

## Model Repository

持久化模型时使用以下结构：

```text
event-storming/
  README.md
  requirements.md
  actors.md
  domain-boundary.md
  glossary.md
  events.md
  commands.md
  policies.md
  read-models.md
  relationships.md
  completeness-check.md
  aggregates/
  <aggregate-name>.md
```

将这些文件视为有顺序的设计产物，而不是需要立即完成的检查清单：

1. `requirements.md` 可选，但对大型或原始输入很有用。它在 DDD 建模前记录需求层面事实和追踪锚点。
2. 在最终确定参与者、Domain Event、Command、Aggregate 或 Read Model 之前，`domain-boundary.md` 必须稳定。
3. 接纳 Domain Event 和 Command 之前，`actors.md` 必须稳定，因为 Command 发起者和受影响主体决定事件含义。
4. `events.md` 必须区分候选事件筛选备注与已接纳 Domain Event。已接纳事件必须具有业务含义、生产路径和下游后果。
5. `commands.md`、`policies.md` 和 `relationships.md` 依赖已接纳事件与参与者权限。
6. `aggregates/<aggregate-name>.md` 依赖一致的 Command-Event-Rule 模型。不得仅因存在名词或表就创建 Aggregate 文件。
7. `read-models.md` 依赖已接纳事件、投影需求和明确的非事件查询来源。如果 Read Model 无法从已接纳 Domain Event 投影，不得为了投影臆造事件；应先检查当前状态查询、查询侧 Join、技术投影输入、已接纳事件的丰富化 Payload，或外部集成来源。
8. `completeness-check.md` 是最终确认门，应记录仍未解决的问题，而不是将其隐藏在下游产物中。

文件职责：

- `README.md`：仅作为入口索引；记录当前模型状态和文件导航。
- `requirements.md`：干系人表、需求条目、业务主体视图、触发/后续动作表、约束、假设和需求 ID。
- `actors.md`：业务参与者、受影响主体、外部系统、定时器，以及它们发起或关心的 Command/Domain Event。
- `domain-boundary.md`：当前问题域、包含职责、排除事实、假设和演进备注。
- `glossary.md`：Ubiquitous Language 和业务术语。
- `events.md`：全局 Domain Event 索引。
- `commands.md`：全局 Command 索引。
- `policies.md`：Event-to-Command 自动化规则和 Process Manager 候选项。
- `read-models.md`：查询需求、Read Model 字段和投影事件。
- `relationships.md`：全局依赖与订阅关系。
- `completeness-check.md`：完备性与设计质量检查。
- `aggregates/<aggregate-name>.md`：单个 Aggregate 的 Command、Domain Event、状态、规则和局部关系。

## Incremental Update Rules

针对每个用户请求：

1. 将请求分类为新能力、能力变更、问题域扩展或设计审查。
2. 推导草稿前，只读取相关模型文件。
3. 当缺少原始需求、干系人列表、触发表或需求 ID，且补充它们能改善追踪时，先创建或更新需求收集。
4. 选择最终事件前，先建立候选事件池。
5. 当候选事件、参与者职责或 Aggregate 边界存在多种合理解释时，对比建模方案。
6. 上游确认门未解决时，只生成下一个安全的设计产物。只有边界、参与者/权威来源、关键规则和建模备选方案已确认或已明确提供时，才生成完整候选设计。
7. 将假设、歧义术语、备选解释和缺失业务规则明确标为推断设计结论，而不是建模前问题。
8. 当设计章节的结论影响后续建模选择时，逐步确认这些章节。
9. 确认后，只针对已确认阶段及其直接受影响的依赖项，同时更新受影响索引和 Aggregate 文件。
10. 重命名、拆分、合并或移动概念时，保留语义演进备注。
11. 如果新需求暴露旧模型不完整，应修复模型，而不是用 Policy、Service 或 Handler 隐藏缺口。
12. 最后简要总结变更文件、变更领域概念、新解锁的下一产物和剩余问题。

除非用户要求，或现有模型不一致到无法安全更新，否则不得重新生成整个模型。

## Modeling Principles

- 建模当前问题域。不得预先拆分 Bounded Context。
- 保护建模框架。用户表述可以由数据驱动，但设计响应必须由行为和事件驱动。
- 为 Aggregate 命名前，先将名词、字段、状态和 CRUD 操作转换为参与者目标、生命周期事件、规则和 Read Model 需求。
- 将参与者视为一等建模输入。区分 Command 发起者、受影响主体、审批者、审计者、下游消费者、定时器和外部系统。
- 只有能力明确位于当前系统/问题域之外时，才标记外部系统。
- 使用领域专家能够理解的业务语言。
- 先建模行为，再建模结构。
- 对后台系统需求，将“管理”页面视为探索线索，而不是领域模型。把名词列表重构为生命周期事件、任职、审批、所有权变化、同步事实和跨角色后果。
- 将 CQRS 视为一种建模视角：Command 通过领域模型改变业务状态；查询由 Read Model 满足。
- Read Model 应记录信息来源，但查询需求本身不得创建 Domain Event。仅供 Read Model 使用的字段可以来自当前状态查询、查询侧 Join、技术投影输入、外部来源或已接纳事件 Payload。
- 当 Command、Domain Event、Aggregate 或 Read Model 不能相互解释时，继续迭代。
- 将 Command、Domain Event、Aggregate 状态、Aggregate 方法和 Read Model 字段视为需要证据的设计主张。如果唯一证据只是“表/API/页面有这个字段”，应将其降级为探索材料，直到业务规则或消费者证明它应当存在。

## Design Proof Gates

在最终确定 Command、Domain Event、Aggregate、Aggregate 方法或 Read Model 之前使用这些门。审查或持久化模型时必须执行。

### Event Admission Gate

对每个已接纳 Domain Event，证明：

- 业务事实：用过去时说明发生了什么
- 生产者：参与者/外部系统 -> Command/事实输入 -> Aggregate/流程 -> Domain Event
- 非查询消费者：该事实影响的参与者选项、Command 侧规则、Policy/流程、Aggregate 关系、生命周期或下游业务能力
- Read Model 影响（如有）：哪些投影和字段发生变化

头脑风暴后被拒绝的事件只能保留在 `Candidate Event Pool and Screening` 中，不得进入正式 `Domain Event Catalog` 或 Aggregate 事件列表。如果某项只修复投影、展示、报表、缓存、操作日志或故障排查视图，应拒绝其作为 Domain Event，并记录替代来源。

### Command Granularity Gate

根据参与者意图或外部事实输入边界设计 Command，而不是根据可能事件的排列组合设计。

- 当多个结果属于同一参与者意图和一致性边界时，一个 Command 可以产生多个 Domain Event。
- 不得仅因存在不同事件组合就创建独立 Command。
- 除非发起参与者或外部系统确实提交一个权威事实包，并且 Aggregate 能够一致地作出决策，否则不得创建单一“全部应用/同步/更新”Command。
- 当 Command 可以产生多个 Domain Event 时，应解释这些事件为何是一个业务决策的结果，而不是独立动作。

### Aggregate State Necessity Gate

对每个 Aggregate 状态项或属性，至少证明一种直接用途：

- Command/业务方法读取它，以决定是否允许某动作
- Invariant 或唯一性规则依赖它
- 它影响事件生产、拒绝、拆分或 Payload 丰富化
- 它表示身份、生命周期、所有权、父子关系，或执行一致性所需的其他状态

如果当前或已确认的未来业务方法均不使用该状态项，应将其从 Aggregate 设计中移除，并重新分类为 Read Model 数据、持久化元数据、审计/日志材料、同步元数据或未解决的探索材料。

### Identity And Uniqueness Gate

按参与者/来源建模身份与唯一性，不得归并为一个通用的“名称/编码必须唯一”规则。

对每条唯一性规则，记录：

- 依赖者：人类参与者、导入操作员、外部主系统、下游系统或 Policy
- 身份字段与范围：租户、公司、父级、外部 ID、编码、名称、生效日期或其他边界
- 执行时机：Command 侧强一致性、外部接纳检查、延迟对账或仅查询检测
- 冲突结果：拒绝、纠正、合并、覆盖、忽略或仅记录日志

如果不同参与者使用不同身份规则，即使规则涉及同一主体，也要保持为独立规则。

### Lifecycle Removal Gate

对 delete、unregister、close、archive、disable 或 decommission 行为，证明：

- 移除的确切业务含义
- 真正阻塞移除的业务事实，而不只是间接结构子项
- 历史引用是否仍然有效
- 恢复是否是实际业务能力；如果不是，不得添加恢复 Command 或 Domain Event
- 移除后哪些下游参与者、Policy、规则或 Read Model 会变化

### Read Model Source Gate

对每个 Read Model 字段，记录其来源：

- 已接纳 Domain Event 的 Payload 或投影
- 从 Command 侧持久化进行当前状态查询
- 查询侧 Join
- 技术投影输入
- 审计/日志/故障排查来源
- 外部读取来源

不得只为填充 Read Model 字段而添加 Domain Event。Read Model 缺失字段首先是来源问题，只有存在非查询业务消费者时，才可能是 Domain Event 缺口。

## Traceability Rules

存在 `requirements.md` 或需求 ID 时，维护从需求到领域模型的轻量追踪：

- 每个已接纳 Command 应列出其满足的需求 ID 或场景。
- 每个 Read Model 应列出其服务的查询/视图需求 ID。
- 每个已接纳 Domain Event 应列出生产它的 Command、Policy、流程、外部事实或触发行。
- 每个触发/后续动作需求应归结为已接纳 Domain Event + Policy/流程、Read Model 投影、外部集成关注点，或带理由的拒绝/降级候选项。
- 如果某需求没有 Command、Domain Event、Read Model 或明确拒绝，应在 `完备性检查` 中标记为未覆盖。
- 不得让可追踪性强行制造虚假 Domain Event 或 Aggregate。可追踪性用于暴露缺口，不能凌驾于领域建模纪律之上。

## Learning And Review Adaptation

当用户正在学习 DDD、比较方案或审查模型时，添加简短教学辅助，但不要把响应变成长篇讲授：

- 用一句话说明建议背后的原则。
- 使用小型对比，例如需求标签与 Command、触发行与 Domain Event、业务主体与 Aggregate。
- 只为当前阶段添加紧凑检查清单，例如 Aggregate 边界、事件生产路径或 Read Model 投影。
- 除非用户要求，否则避免特定框架或特定语言的建议。

## Workflow

遵循以下阶段顺序。如果某确认门问题可能改变后续模型，则后续阶段被阻塞。

```text
requirements intake when needed
  -> problem boundary
  -> actors and authority
  -> candidate event pool
  -> event screening
  -> accepted events
  -> commands and policies
  -> aggregates
  -> read models
  -> relationships and completeness check
```

### 0. Requirements Intake

只有输入在建模前需要需求层面结构时，才使用此阶段。

记录干系人、需求条目、业务主体、触发/后续动作、约束、输入/输出、假设和缺口。当需求超过一个或之后可能实现时，分配 `REQ-001` 等稳定 ID。

将此输出与 DDD 结论明确分离：

- 需求条目不是 Command。
- 业务主体不会自动成为 Aggregate。
- 触发行不会自动成为 Domain Event。
- 操作类型不是业务意图。

如果收集结果可能改变领域边界、参与者、Domain Event、Command、Read Model 或后续实现切片，应先确认收集结果。

### 1. Define Scope

重新表述当前问题或增量。

记录：

- 包含的业务职责
- 排除的背景事实
- 参与者群体和受影响主体
- 假设
- 歧义术语
- 备选解释
- 阻塞性未知项

除非无法生成任何有用模型，否则不要在第一份草稿前提出针对性问题。优先先设计，将不确定点标记为推断结论，并在设计结论可见后请求确认。

### 1.5 Identify Actors And Collaboration

列出 Domain Event 前，识别：

- Command 发起者：可以请求状态变更的人员、角色、定时器或外部系统
- 受影响主体：业务状态发生变化的人员、组织、资产或记录
- 决策者：负责批准、拒绝、转移或覆盖的角色
- 下游消费者：依赖结果事实或 Read Model 的角色或系统
- 边界候选项：语言或所有权不同的概念，例如作为登录账号的 `User` 与作为花名册人员的 `Employee`

为每个主要场景生成紧凑链路：

```text
Actor -> Command -> Event(s) -> Affected subject/read model -> Follow-up policy or open question
```

如果不同参与者可以发起相似 Command，且差异会改变必填字段、权限假设、Domain Event、Policy 或审计含义，则应对该差异建模。

### 1.6 Brainstorm Candidate Events

选择正式 Domain Event 前，先生成候选事件池。

寻找：

- 参与者可感知的结果
- 生命周期转换
- 批准、拒绝、转移、覆盖、取消和过期
- 已接收、接纳、拒绝、延期、冲突或失败的外部事实
- Policy 触发点
- Read Model 投影需求
- 具有业务含义的异常
- 可能隐藏具体业务事实的模糊数据变更词语

不得仅因不确定就过早丢弃候选项。保留为候选项并附上不确定性，之后通过筛选和确认收敛。

使用以下问题筛选每个候选项：

- 业务是否关心该事实已经发生？
- 参与者、定时器、Policy、Process Manager、Aggregate 或外部系统能否生产它？
- 它是否会改变参与者选项、受影响主体的生命周期、Command 侧规则决策、Policy 反应、流程、另一个 Aggregate 或下游业务能力？
- 唯一消费者是否为 Read Model、页面、报表、缓存或投影？如果是，应拒绝其作为 Domain Event，并将需求记录为查询侧数据、技术投影、当前状态查询或审计/日志材料。
- 它是否足够具体，还是应拆分或重命名？
- 它是否位于当前问题域内，还是仅为集成/技术细节？
- 保留它是否改善 Event-Command-Read Model 的解释，还是只映射 CRUD 数据变更？

### 2. Identify Domain Events

将已经发生的业务事实提取为候选事件。

只保留当前问题域为业务规则、状态决策、工作流推进、Policy/流程反应、Aggregate 协作或下游业务能力所需的事实。不得仅因 Read Model 需要刷新或展示字段，就将某事实保留为 Domain Event。

规则：

- 使用已完成的业务时态命名事件，例如 `订单已提交`、`书已归还`、`月度考勤已结算`。
- 优先使用具体业务事实，而不是通用数据变更事实。避免使用 `信息已变更`、`资料已更新`、`状态已修改` 或 `记录已删除` 等模糊事件，除非被改变的具体属性没有业务特定含义；使用通用事件时，应解释其可接受的原因。
- 如果不同 Policy、Read Model 或参与者后果可能适用，应将 `已停用或解散` 等组合事实拆分为独立事件。
- 除非业务明确关心，否则排除日志、消息、缓存刷新、接口调用和通知等技术事实。
- 排除当前问题域之外的事实。
- 只有失败本身具有业务含义时，才对失败事件建模。
- 每个当前域事件都必须有生产路径：参与者、Command、Aggregate/流程，以及有意义的结果。

### 3. Derive Commands

为每个 Domain Event 识别导致它发生的业务 Command。

Command 是发送给领域模型、用于完成有价值业务动作的指令。

规则：

- 将 Command 命名为业务动作，例如 `提交订单`、`签到`、`结算月度考勤`、`归还图书`。
- 为每个 Command 包含发起参与者。如果同一业务动作可由不同参与者或系统发起，应解释它是带参与者特定规则的单一 Command，还是多个独立 Command。
- 当存在更精确的业务意图时，避免使用 `新增`、`修改`、`删除`、`维护`、`管理`、`变更信息` 或 `同步数据` 等 CRUD 模板名称。使用能揭示变更为何重要的名称，例如 `任命部门负责人`、`登记员工入职`、`确认OA员工同步结果` 或 `撤销岗位任职`。
- Command 不是 HTTP API、UI 动作、Controller 方法或 Use Case。
- 一个 Command 可以产生多个 Domain Event。
- 定时器触发的行为仍使用 Command；定时器是 Actor。
- Command 字段只包含参与者必须提供的信息，以及 Aggregate 无法从当前状态或历史事件推导的信息。
- 如果执行 Command 所需信息既不能来自 Command 字段，也不能来自 Aggregate 状态/历史，则 Event-Command 模型不完整。
- 存在需求 ID 时，应包含 Command 所满足的需求 ID。

### 4. Model Policies And Processes

使用 Policy 表示自动业务反应。

Policy 的含义是：当事件发生时，执行 Command。

规则：

- 使用 Policy 表示无状态的 Event-to-Command 业务规则。
- 当反应需要持久状态、等待、恢复或跨多个本地事务协调时，标记 Process Manager/SAGA 候选项。
- 不得使用 Policy 隐藏 Aggregate Invariant。
- 只有行为无法自然归属单个 Aggregate，且仍是真正的领域协作或计算时，才使用 Domain Service。

### 5. Derive Or Update Aggregates

Event-Command 模型一致后，再推导 Aggregate。

Aggregate 由一组内聚且长期存在的业务能力定义，而不是由字段或表定义。

为每个 Aggregate 指定：

- 名称与身份
- 其行为所需状态
- 当参与者特定规则重要时，可以发起其 Command 的参与者
- 它处理的 Command
- 它发布的 Domain Event
- 它保护的规则和 Invariant
- Command/Domain Event 归属于此处的原因

规则：

- 当前域中改变状态的 Domain Event 通常应由 Aggregate 发布。
- Process Manager 可以触发 Command，但不应取代 Aggregate 成为核心状态变更事件的来源。
- 使用 Event Sourcing 视角时，Aggregate 状态必须能从历史事件重建。
- 如果建议的 Aggregate 名称与用户提示或 CRUD 页面中的名词相同，应证明它是一致性/生命周期边界。如果无法证明，应将其标记为候选 Read Model、参考数据或未解决概念，而不是最终确定为 Aggregate。
- 不得因为字段看似相似就合并 Aggregate。
- 不得将 Aggregate 拆分得过细，以致耦合泄漏到 Service 或 Handler。
- 不得让 Aggregate 过大，以致性能、并发或加载边界不合理。

### 6. Design Read Models

将查询需求与 Command 行为分离。

为每个 Read Model 指定：

- 用户或查询需求
- 可用时的需求 ID
- 身份
- 字段
- 创建或更新它的已接纳 Domain Event（如有）
- 非事件来源，例如当前状态查询、查询侧 Join、技术投影输入、已接纳事件的丰富化 Payload 或外部读取来源
- 缺失字段是否揭示真实的 Domain Event 缺口，还是仅表示查询侧来源决策

如果无法从已接纳 Domain Event 构建 Read Model，不得为了投影臆造事件。应先判断字段能否来自当前状态查询、查询侧 Join、已接纳事件的 Payload 丰富化、技术投影、审计/日志数据或外部读取来源。只有存在 Read Model 之外的业务消费者，且事件具有生产路径时，才能添加或更改 Domain Event。

## Relationship Rules

维护三种关系视图：

- 依赖：Command 检查或依赖先前事实、Aggregate 状态或上游状态。
- 订阅：Domain Event 触发 Policy，Policy 执行 Command。
- 参与者影响：Domain Event 改变参与者、受影响主体、外部系统或 Read Model 接下来能够看到或执行的事项。

以文本作为事实来源，图表仅作辅助。

示例：

```text
依赖：岗位已创建事件 -> 员工入职命令，用于校验岗位存在。
订阅：测试工单已开始事件 -> 测试步骤创建策略 -> 创建测试步骤命令。
影响：员工已离职事件 -> 部门负责人候选人读模型移除该员工，并触发负责人任命有效性复核。
```

## Output Order

在对话中响应或更新模型文件时，使用以下顺序：

1. 必要时使用 `需求拆解`
2. `Problem Domain Boundary`
3. `Actors and Collaboration Scenarios`
4. `候选事件池与筛选`
5. `建模方案对比`
6. `Domain Event Catalog`
7. `Command Catalog`
8. `Policy/流程规则`
9. `Aggregate Design`
10. `领域服务`
11. `Read Model Design`
12. `Requirement Traceability`
13. `关系总览`
14. `完备性检查`
15. `结论确认清单`

只列出真正需要的 Domain Service。

使用 `候选事件池与筛选` 展示重要的头脑风暴候选项，尤其是被拒绝、拆分、重命名、降级或仍未解决的候选项。保持紧凑；它是推理辅助，而不是第二份事件目录。

只有存在有意义的备选方案时，才使用 `建模方案对比`。包含 2-3 个选项、取舍和推荐选项。

只有存在需求 ID 或需求表时，才使用 `Requirement Traceability`。保持紧凑：需求 ID -> Command/Read Model/Domain Event/Policy 或未覆盖/拒绝理由。

持久化前，`结论确认清单` 只能列出需要用户确认或纠正的未确认或新变更设计结论。如果此前尚未确认，应包含边界选择、参与者和受影响主体、事件名称与含义、Command 职责、Policy、Aggregate 边界、Invariant、Read Model、关系、假设、歧义业务术语和可能改变模型的备选解释。

对每个确认项，说明它影响的 Domain Event、Command、Aggregate、Policy、Read Model 或关系。除非确认后发生变化，否则不得重复之前章节已确认的项目。确认并持久化后，最终摘要只包含仍未解决的项目。

## Diagram Rules

默认优先使用结构化 Markdown。

只有以下情况才使用 Mermaid 或 PlantUML：

- 用户要求图表
- 仓库已使用该图表样式
- 图表能显著改善理解

使用 Mermaid 时，采用以下标签：

- `[Actor: 用户]`
- `[Timer: 月末定时器]`
- `[System: 外部系统]`
- `[Command: 签到]`
- `[Event: 员工已签到]`
- `[Policy: 满勤奖励策略]`
- `[Aggregate: 月度考勤]`
- `[Service: 借书服务]`
- `[ReadModel: 考勤记录]`

如果已有 PlantUML Event Storming 样式，应继续沿用。每个 Aggregate 优先使用一个局部文件，并使用一个全局文件表示跨 Aggregate 关系。

## Completeness Check

最终确定前，检查：

- 当前响应没有越过未确认门生成下游产物。
- 持久化文件只针对已确认阶段或直接受影响的依赖项更新。
- 使用需求收集时，内容保持在需求层面，没有声明 Aggregate、Command、Domain Event、API、包或代码。
- 存在需求 ID 时，已追踪到 Command、Read Model、已接纳 Domain Event/Policy，或明确的未覆盖/拒绝备注。
- 需求存在重大歧义时，在选择最终事件前已对候选事件进行头脑风暴。
- 对设计重要的被拒绝、拆分、重命名、降级或未解决候选事件均说明理由。
- 在选择有争议的 Domain Event、Policy、流程、Aggregate 或 Read Model 边界前，已对比有意义的建模备选方案。
- 每个 Command 都有发起参与者或外部系统。
- 每个 Domain Event 都有参与者 -> Command -> Aggregate/流程 -> Domain Event 的生产路径。
- 每个已接纳 Domain Event 至少有一个不是 Read Model、页面、报表、缓存或投影完整性的业务消费者。
- 没有已接纳 Domain Event 仅凭 Read Model 刷新、页面展示、缓存更新、报表字段或投影完整性得到论证。
- 每个重要事件都有受影响的参与者、主体、Command 侧规则、Policy/流程、Aggregate 或下游业务关系。
- 除非记录明确例外，当前域改变状态的 Domain Event 均由 Aggregate 发布。
- 每个 Command 都能从 Command 字段加 Aggregate 状态/历史获得所需信息。
- 每个 Command 均由参与者意图或外部事实输入边界论证，而不是任意事件组合排列。
- 如果一个 Command 可以发布多个 Domain Event，应将它们解释为一个一致性边界内单一业务决策的结果。
- 有意义的 Command 结果均表示为 Domain Event。
- `信息已变更` 等通用事件已替换为具体事实，或得到明确论证。
- 被拒绝候选事件没有保留在已接纳事件目录、Aggregate 事件列表或实现对齐列表中。
- 每个 Read Model 都记录各字段来自已接纳事件、当前状态查询、查询侧 Join、技术投影输入、丰富化 Payload 还是外部读取来源。
- 每个仅供 Read Model 使用的字段均标记为查询侧数据、技术投影输入、当前状态查询、审计/日志材料或外部来源数据，而不是提升为 Domain Event。
- Policy 没有隐藏 Aggregate Invariant。
- Domain Service 没有变成过程式 Service 层。
- Aggregate 根据行为、规则、身份、生命周期和 Invariant 推导，而不是根据表、CRUD 资源或名词列表推导。
- 每个 Aggregate 属性至少被一个 Command/业务方法、Invariant、唯一性规则、事件生产决策、生命周期决策或一致性关系直接使用。
- 当人工维护身份规则与外部系统身份规则使用不同范围或 Key 时，二者保持分离。
- 移除/decommission 规则识别真实阻塞业务事实、历史引用行为和下游后果。
- Aggregate 既不过大，也不过度碎片化。
- 查询需求没有污染 Aggregate 状态。

## Reject These Anti-Patterns

拒绝或纠正以下模式：

- 一开始就创建 `application/domain/infrastructure` 包。
- 将 controller-service-dao 重命名为 DDD 分层。
- 未经 Event-Command-Rule 筛选，就将需求表、User Story、操作标签或业务主体视图视为领域模型。
- 丢失从已确认需求条目到 Command、Domain Event、Read Model、Policy 或明确未覆盖/拒绝备注的追踪。
- 根据数据库表、CRUD 页面或 REST 资源设计 Aggregate。
- 未证明生命周期和一致性边界，就为看似 CRUD 的提示中的每个名词设计一个 Aggregate。
- 对新的模糊需求，在边界、参与者权限、关键规则和事件筛选得到确认前，一次填满每个 `event-storming/` 文件。
- 将多角色工作流扁平化为单一管理员参与者或单一“管理数据”场景。
- 存在具体业务事实时，仍使用 `信息已变更` 等模糊数据变更事件。
- 当顺序、依赖、失败或冲突解决具有业务含义时，仍将外部主数据同步视为简单 upsert。
- 为业务不关心的技术动作创建 Domain Event。
- 仅因 Read Model、页面、报表、缓存或投影需要刷新字段而创建 Domain Event。
- 将被拒绝候选事件保留在最终事件列表、Aggregate 文件或实现检查清单中。
- 根据可能事件组合创建 Command 排列，而不是根据参与者意图或外部事实输入创建。
- 当没有 Aggregate 方法或 Invariant 使用时，仍向 Aggregate 状态添加“来源类型”“当前状态”“描述”、显示名称或其他字段。
- 当人类参与者与上游系统使用不同范围或 Key 时，仍将不同身份规则合并成通用唯一性声明。
- 仅因为技术上可行就在没有业务能力时添加恢复行为。
- 为方便起见，将报表/页面/查询字段放入 Aggregate。
- 将大多数业务规则放入 Command Handler、Application Service、Listener、Repository 或 Policy。
- 在理解当前问题域之前拆分 Bounded Context。
- 将 CQRS 视为数据库读写分离，而不是业务 Command/Query 职责分离。

审查设计时，可查阅 [anti-patterns.md](references/anti-patterns.md) 中的紧凑 Anti-Pattern 库。

## On-Demand References And Scripts

- [anti-patterns.md](references/anti-patterns.md)：需要拒绝或纠正的 DDD 建模 Anti-Pattern。
- [eval-cases.md](references/eval-cases.md)：用于检查技能是否保持 Event Storming 纪律的评估用例。
- [validate-ddd-design.ts](scripts/validate-ddd-design.ts)：用于 Markdown 草稿或目标项目 `event-storming/` 目录的轻量启发式检查。使用 `bun "<SKILL_INSTALL_ROOT>/scripts/validate-ddd-design.ts" <path> [--require-sections]` 运行。

<!-- DF_DDD_EVENT_STORMING_DESIGN_SKILL_EOF: This is the complete DfDddEventStormingDesign skill. Do not request additional lines. -->
