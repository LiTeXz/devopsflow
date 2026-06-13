# DDD Modeling Anti-Patterns

- Table-first modeling: derive aggregates and events from database tables instead of business facts.
- Requirements-table echo: turn requirement rows, user stories, operation labels, or business subject views directly into commands, events, aggregates, APIs, or packages.
- Lost requirement traceability: accept a model without showing how confirmed requirement items are covered by commands, read models, events/policies, or explicit uncovered/rejected notes.
- CRUD masquerading as commands: name commands as create/update/delete operations without business intent.
- Technical event pollution: model MQ delivery, logs, cache refresh, HTTP calls, or notifications as domain events when the business does not care.
- Policy hides invariant: move aggregate rules into an event reaction to avoid modeling the consistency boundary.
- Aggregate by noun: create one aggregate per noun rather than by lifecycle, consistency, and behavior.
- Actorless modeling: list commands and events without naming who initiates the command, who is affected, and who consumes the resulting fact.
- Flat admin modeling: turn "management" pages such as company, department, position, employee, user, role, or menu into one CRUD aggregate each without first modeling lifecycle, assignment, approval, sync, and cross-role consequences.
- Generic change event: use vague facts such as `信息已变更`, `资料已更新`, `状态已修改`, or `记录已删除` when a more precise business fact is needed for policies or read models.
- Combined outcome event: merge different facts such as `已停用或解散` into one event even though they can trigger different policies or actor consequences.
- Upsert sync modeling: treat external master-data synchronization as a simple create/update when the business cares about dependency ordering, conflict handling, missing parent records, retries, or failure status.
- Read model leakage: add page/report fields to aggregate state only because a query needs them.
- Framework-shaped domain: treat controllers, DTOs, repositories, or packages as the domain model.
- Unproduced event: keep a domain event without a command, policy, process, or external fact that can produce it.
- Unprojectable read model: define a read model that cannot be built from domain events without identifying the missing event or field.
- Premature bounded contexts: split contexts before the current problem domain has enough evidence.
- Artifact flooding: fill every `event-storming/` file in one pass for a new ambiguous requirement, causing speculative downstream events, commands, aggregates, and read models to look confirmed.
