# DDD Skill Eval Cases

使用这些用例评估 `df-ddd-event-storming-design` 是否保持 Event Storming 纪律。

## Case 1: Table-First Input

提示：“为订单提交设计 order、order_item、product 表和 Aggregate。”

预期防护：

- 拒绝将表优先建模作为起点。
- 围绕业务事实、Command、Domain Event、Invariant 和 Read Model 重新构建问题。
- 只有 Event-Command 达成一致后，才推导 Aggregate。

## Case 2: Technical Event Pollution

提示：“当 API 发送 MQ 消息并刷新缓存时，为这些动作建模事件。”

预期防护：

- 除非业务关心，否则排除 MQ/缓存事实。
- 将其保留为集成或基础设施关注点。

## Case 3: Policy Hides Invariant

提示：“使用 Policy 防止在库存不足时提交订单。”

预期防护：

- 当库存充足性位于一致性边界内时，将其识别为 Command 前置条件或 Aggregate Invariant。
- Policy 仅用于 Event-to-Command 反应。

## Case 4: Missing Production Path

提示：“Event：订单已取消。未提供 Command 或 Actor。”

预期防护：

- 要求提供生产它的 Command、Policy、Process Manager 或外部系统事实。
- 在结论确认清单中标记缺失路径。

## Case 5: Unconfirmed Persistence

提示：“立即为这个新的模糊需求创建 event-storming 文件。”

预期防护：

- 先生成设计草稿和结论确认清单。
- 明确确认前，不得创建或更新 `event-storming/` 文件。

## Case 6: Read Model Cannot Project

提示：“订单详情页面显示风险评分，但没有事件携带风险数据。”

预期防护：

- 识别投影缺口。
- 不得只为刷新订单详情页面而创建 Domain Event。
- 先检查风险评分是当前状态查询数据、查询侧 Join、技术投影输入、已接纳事件 Payload 丰富化，还是外部读取来源。
- 只有风险评分会改变 Command 侧业务规则、Policy/流程、Aggregate 行为或下游业务能力时，才添加或调整 Domain Event。
- 不得用仅供报表使用的字段污染 Aggregate 状态。

## Case 6b: Read-Model-Only Field Change

提示：“部门选项和员工页面需要最新部门名称，因此添加 DepartmentRenamedEvent。”

预期防护：

- 在识别 Read Model 之外的业务消费者前，将部门名称刷新视为 Read Model/查询需求。
- 询问谁将重命名作为业务事实消费，以及哪些行为、规则、流程或下游业务能力会改变。
- 当唯一消费者是页面、选项、报表、缓存或投影时，拒绝或降级该事件。
- 将读取来源记录为当前状态查询、查询侧 Join、技术投影输入、已接纳事件 Payload 丰富化、审计/日志数据或外部来源数据。
- 只有 Command、Policy/流程、Aggregate 或下游业务能力将重命名作为业务事实消费时，才接纳该事件。

## Case 7: CRUD-Looking Admin Nouns

提示：“我的后台管理系统包含公司、部门、岗位和员工，请重新设计这一部分。”

预期防护：

- 将请求标记为 CRUD 模板风险，而不是直接为每个名词创建一个 Aggregate。
- 在相关时识别 HR、租户管理员、部门负责人、员工、外部 OA 系统和下游账号/权限域等参与者。
- 在设计 Aggregate 前，生成 Actor-Command-Event-影响链路。
- 当两种含义都可能存在时，将登录账号 `User` 与花名册人员 `Employee` 分离为边界候选项。
- 将劳动关系/任职/岗位担任视为候选行为概念，而不是假设员工只有一个当前岗位。
- 将不确定规则放入结论项，并注明受影响的 Domain Event、Command、Aggregate、Read Model 或关系。

## Case 8: Vague Data Change Events

提示：“事件列表包含公司信息已变更、部门信息已变更、岗位信息已变更、员工个人信息已变更。”

预期防护：

- 当具体业务事实驱动规则或投影时，拒绝或拆分模糊的 `信息已变更` 事件。
- 询问哪些变更具有业务意义，例如名称、上级部门、负责人、状态或联系渠道。
- 只有明确论证时，才保留通用变更事件。

## Case 9: External Master Data Sync

提示：“OA 同步公司、部门、岗位和员工。”

预期防护：

- 当 OA 位于当前域之外时，将其建模为外部系统 Actor。
- 当业务关心时，区分已接收外部事实、已接纳/应用的本地事实、依赖等待状态、冲突和失败。
- 如果父子顺序、依赖缺失、重试或冲突解决很重要，不得将同步建模为简单 upsert。

## Case 10: Brainstormed Events Become Final Too Early

提示：“让我们对招聘工作流的所有事件进行头脑风暴。候选项包括简历已上传、面试提醒已发送、候选人资料已更新、Offer已审批、邮件已投递成功、入职已确认。将它们转换为 DDD 模型。”

预期防护：

- 将列表视为候选事件池，而不是最终事件列表。
- 按业务含义、生产路径、受影响主体、Read Model 之外的业务消费者、Policy/流程影响和当前域边界筛选候选项。
- 除非业务明确关心，否则拒绝或降级邮件投递等技术事实。
- 当具体业务事实重要时，拆分或重命名 `候选人资料已更新` 等模糊数据变更事件。
- 当审批、Offer 和入职边界可能分别由 Aggregate、Process Manager 或外部系统负责时，对比合理的建模方案。
- 只有已接纳候选项才能进入 `Domain Event Catalog`，未解决的筛选决策应放入结论确认清单。

## Case 11: Duplicated Final Confirmation

提示：“在对话中，我逐节确认了边界、参与者、候选事件筛选和 Aggregate 选择。现在持久化模型。”

预期防护：

- 不得要求用户重新确认对话中已经确认的章节。
- 将 `结论确认清单` 视为未确认、新变更或仍有歧义结论的差异清单。
- 如果所有与持久化相关的结论均已确认，应在写入文件前说明没有额外确认项。
- 如果后续编辑改变了先前确认的结论，只列出该变更结论，并说明受影响的 Domain Event、Command、Aggregate、Policy、Read Model 或关系。

## Case 12: Full Draft Skips Confirmation Gates

提示：“我们有公司、部门、岗位、员工、OA 同步和账号联动。请使用 DDD 重新设计。”

预期防护：

- 将请求标记为看似 CRUD 且边界敏感。
- 在确认上游确认门前，不得输出完整的边界 + 参与者 + Domain Event + Command + Policy + Aggregate + Read Model 草稿。
- 先呈现问题域确认门并提出一个聚焦确认问题，例如这是否为 `组织任职域`、是否包含 OA 同步和账号联动，以及排除哪些职责。
- 问题域门确认后，应先确认参与者与权威来源门，再接纳 Domain Event 和 Policy，尤其要确认 OA 是否具有权威性。
- 在最终确定 Domain Event、Command、Invariant 和 Policy 前，确认单一/多个岗位、负责人资格、删除/归档语义和冲突优先级等关键规则。
- 在最终确定 Aggregate 边界和 Read Model 前，确认建模备选方案门。

## Case 13: User Speaks Data Model

提示：“我们有带 create/update/delete 页面的公司、部门、岗位、员工表。将它们转换为 DDD Aggregate 和 Domain Event。”

预期防护：

- 将表、字段、CRUD 页面和 Entity 名视为原始探索输入，而不是建模框架。
- 简要说明必须将模型转换为业务事件、参与者目标、生命周期决策、规则和 Read Model 需求。
- 不得生成 `CompanyCreatedEvent`、`DeptUpdatedEvent`、`PositionDeletedEvent` 或 `EmployeeEditedEvent` 等事件。
- 除非证明每个名词都是生命周期和一致性边界，否则不得为每张表创建一个 Aggregate。
- 从问题域确认门开始，在推导 Domain Event、Command 或 Aggregate 前提出一个聚焦业务问题。
- 将字段和外键转换为可能的 Invariant、所有权/依赖问题或投影需求，而不是 Aggregate 字段。

## Case 14: Key Decision Confirmation UX

提示：“我们需要决定 OA 是否具有权威性、员工能否担任多个岗位，以及员工删除表示归档还是 hard delete。”

预期防护：

- 将每项视为会塑造下游 Domain Event、Command、Policy 和 Aggregate 的高影响业务决策。
- 如果 `request_user_input` 可用，在当前确认门使用它并提供 2-3 个互斥选项，将推荐选项放在首位。
- 如果 `request_user_input` 不可用，不得最终确定下游设计。说明继续前需要用户确认，并使用普通文本提出一个聚焦确认问题。
- 不得在最终答复中一次询问所有高影响决策。
- 在相关确认门依次确认决策：先权威来源，再任职基数，最后删除/归档语义。

## Case 15: Artifact Flooding From New Ambiguous Requirement

提示：“为公司、部门、岗位、员工、OA 同步和账号联动创建完整的 event-storming 仓库。”

预期防护：

- 第一次响应使用协作式头脑风暴，而不是完整产物生成流程。
- 将请求视为边界敏感且看似 CRUD。
- 在用户确认边界和包含职责前，不得创建或更新任何 `event-storming/` 文件。
- 只呈现下一阶段产物，例如 `domain-boundary.md` 候选内容或等价对话章节。
- 说明当前确认门阻塞哪些下游产物：`actors.md`、`events.md`、`commands.md`、`aggregates/*` 和 `read-models.md`。
- 继续前，针对问题边界提出一个聚焦确认问题。
- 不得仅因已知仓库结构，就用推测结论填充 Domain Event、Command、Policy、Aggregate 或 Read Model。

## Case 16: Raw Requirements Need Intake

提示：“以下是会议记录：HR 可以办理员工入职，负责人可以请求调动，OA 发送组织变更，财务需要月度人数报表，管理员需要编辑部门的页面。”

预期防护：

- 在正式 DDD 建模前，从需求收集开始。
- 生成干系人、需求条目、业务主体、触发/后续动作、规则/依赖和假设表。
- 存在多个需求时分配需求 ID。
- 不得将“编辑部门”等操作标签直接转成 Command 或 Aggregate。
- 如果缺口可能影响领域边界、参与者、Domain Event、Command 或 Read Model，应先询问需求收集确认门问题，再将收集结果用作建模输入。

## Case 17: Requirement Traceability

提示：“使用这些已确认需求 REQ-001 至 REQ-006 生成 DDD 模型。”

预期防护：

- 将需求 ID 保持为追踪锚点。
- 将已接纳 Command 关联到需求 ID。
- 将 Read Model 关联到查询/视图需求 ID。
- 将触发/后续动作需求关联到已接纳 Domain Event + Policy/流程、Read Model 来源/投影、外部集成关注点，或带理由的拒绝/降级候选项。
- 将没有 Command、Domain Event、Read Model 或明确拒绝的需求，在完备性检查中标记为未覆盖。

## Case 18: Learning-Oriented Review

提示：“告诉我为什么这个候选 Aggregate 不正确，以及如何改进。”

预期防护：

- 使用简短原则说明和紧凑的阶段特定检查清单。
- 在相关时，对比需求标签与 Command、触发行与 Domain Event，或业务主体与 Aggregate。
- 除非用户另有要求，否则保持解释对框架和语言中立。
