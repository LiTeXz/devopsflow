---
name: df-ddd-event-storming-design
description: 使用事件风暴、CQRS 和需求追踪进行通用 DDD 领域建模。Use this skill when Codex needs to clarify raw business requirements, split stakeholder needs into requirement items, evolve a persistent domain model, identify actors and multi-role collaboration, domain events, commands, policies, aggregates, domain services, read models, produce structured Markdown or optional Mermaid/PlantUML diagrams, and review designs that may be CRUD, database, package-structure, or DDD-terminology driven instead of problem-domain driven. Especially use for CRUD-looking admin requirements such as company, department, position, employee, account, role, or permission management that need behavior-first modeling instead of flat noun aggregates.
---

# DDD Event Storming Design

## Core Rule

Use event storming as the core entry point for DDD modeling. Requirements intake may precede it when the user's input still needs requirement-level structure.

When the input is a raw requirement, meeting note, feature list, user story dump, or mixed CRUD/page/API description, first run a lightweight requirements intake before domain modeling. Requirements intake is pre-modeling discovery: identify stakeholders, requirement items, business subjects, triggers, constraints, inputs/outputs, assumptions, and gaps. Do not turn this intake directly into aggregates, commands, events, APIs, packages, or code.

Treat event storming as collaborative brainstorming followed by disciplined convergence. First create a broad candidate event pool from business language, actor goals, lifecycle changes, failures, external facts, and query needs. Then filter candidates into accepted domain events only when they have business meaning, a production path, and at least one business consumer that changes actor options, command-side rules, policies/processes, aggregates, or downstream business capabilities. Read-model projection, page display, cache refresh, or query completeness alone is not a sufficient reason to accept a domain event.

Do not treat the first brainstormed event list as the final model. Candidate events are working material; accepted domain events are design conclusions.

Start from the current problem domain, business facts, domain events, commands, rules, state changes, and read models. Derive aggregates afterward.

Do not start from database tables, CRUD pages, HTTP APIs, package structure, entities, aggregate roots, repositories, or tactical DDD terminology.

Assume many users do not speak DDD. They may describe the problem as tables, fields, CRUD pages, modules, controllers, DTOs, or "manage company/department/position/employee". Treat that language as raw discovery input, not as the modeling frame.

Always translate data-driven or CRUD-driven requests into business-event exploration:

- table or entity names -> possible affected business subjects, reference data, read models, or lifecycle candidates
- fields -> possible business facts, decisions, invariants, or projection needs
- create/update/delete operations -> business commands that explain why the change matters
- status fields -> lifecycle events and rule transitions
- foreign keys -> business relationships, ownership, dependency, or consistency questions
- sync/upsert wording -> external facts, acceptance/rejection/conflict/deferment events, and authority questions
- admin pages -> actor goals, responsibilities, approvals, ownership changes, and audit concerns

Do not echo the user's data model back as a DDD model. If the user asks in CRUD terms, first explain the translation boundary briefly, then proceed through the confirmation gates in business language.

Always identify the business actors, external systems, timers, and affected subjects before finalizing commands and events. Commands are issued by an actor; accepted events change something that matters to one or more actors or business capabilities. Treat read models as projection consumers and discovery clues, not as standalone proof that a domain event exists.

Unless the user explicitly asks for implementation, produce only domain design artifacts. Do not generate code, tests, framework structure, persistence mapping, or TDD plans.

## Operating Mode

Prefer persistent domain modeling when the user is evolving the same business domain.

Use a hybrid workflow: collaborative brainstorming for discovery, artifact-guided convergence for persistence.

- Brainstorming is for divergent discovery: clarify business boundary, actors, authority, candidate events, alternatives, and unresolved rules through short sections and focused confirmation questions.
- Artifact guidance is for convergence: once a section is stable or explicitly confirmed, capture it in the matching model artifact and make later sections depend on it.
- Do not use an OpenSpec-style "generate all artifacts in one pass" flow for new DDD requirements. Event storming must not skip upstream confirmation gates just because a complete repository structure is known.
- When the user wants a fast draft, still stop at the first unconfirmed gate that can change downstream events, commands, aggregates, or read models.
- When the user wants files, treat each `event-storming/` file as a stage artifact. Create or update only the stage whose conclusions are confirmed; do not fill downstream files with speculative content.

Use a three-stage workflow for requirements-driven modeling:

1. Requirements intake when needed: split raw requirements into requirement-level tables without using DDD tactical terms as conclusions. Assign stable requirement IDs when the input contains multiple user-visible needs or will later be implemented.
2. Design draft: analyze the request, read relevant existing model files if any, brainstorm candidate events and modeling alternatives, infer the next useful design section, and present only the conclusions that are safe to validate at the current confirmation gate. Present a complete candidate model only after upstream gates that affect it are already confirmed or explicitly supplied by the user.
3. Section confirmation and persistence: confirm design sections with the user while the draft is being shaped. Create or update `event-storming/` files only after the user explicitly confirms the candidate model, the changed sections, or a specific set of changes.

Do not create or update persistent model files from a new or changed requirement before confirmation. User requirements are often incomplete, and the requester may not know which missing facts matter for DDD modeling.

Do not interrupt the initial design draft with unrelated clarification questions. However, when a confirmation gate controls downstream modeling, ask the gate question before expanding dependent sections. If information is missing but does not block the current gate, make the smallest reasonable assumption, mark it as an inferred conclusion, and include it in the confirmation list.

Exception: when the request is a CRUD-like noun list (for example "company, department, position, employee" or "user, role, menu, permission"), do not invent or output a complete management model in the first response, even if existing code contains behaviors that make a full draft possible. First mark the request as a CRUD-template risk, then stop at the problem-domain gate with a behavior-first boundary proposal and one focused confirmation question. Continue to actors, events, commands, aggregates, and read models only after the gate is confirmed or corrected.

If the workspace contains an `event-storming/` model repository, read the relevant files first, but treat this as read-only input until confirmation is received.

If it does not exist:

- If the user wants files, first present the smallest useful candidate model repository contents and conclusion confirmation list.
- If the user only wants discussion, output the same structure in chat without creating files.

Do not require the user to provide complete requirements upfront. Accept small increments, design from what is available, and expose assumptions, alternatives, and missing business facts as conclusions to confirm before persisting them.

## Requirements Intake

Use requirements intake when the input is broad, messy, implementation-shaped, or likely to become implementation work later. Keep it language- and framework-neutral.

Output only requirement-level facts in this stage:

- `干系人表`: role, goal/pain, authority or limitation, notes.
- `需求条目表`: requirement ID, scenario, stakeholder/affected subject, business subject, operation type such as view/create/modify/close/async/timer, preconditions, constraints, input/output, gaps.
- `业务主体视图`: business subject, covered requirement IDs, responsibilities/rules, key inputs/outputs.
- `触发/后续动作表`: trigger condition, follow-up action or impact, related stakeholders, affected business subject, assumptions.
- `业务规则与依赖`: rule/constraint, related subject, dependent external system or prior fact, notes.
- `假设与待确认清单`: item, description, owner if known, priority if useful.

Rules:

- Requirement IDs are traceability anchors, not architecture names.
- `业务主体视图` can propose subjects for exploration, but it must not become aggregates without event-command-rule proof.
- Operation types such as create/update/delete are only intake labels. Translate them into business intent before commands.
- Trigger/follow-up rows are candidate material for events, policies, processes, or read-model updates; do not accept them as domain events without screening.
- If the user only needs requirements analysis, stop here and ask for confirmation before modeling.

## Brainstorming Adaptation

Use the useful parts of collaborative brainstorming without weakening DDD discipline:

1. Explore context first: inspect existing requirements, model files, docs, and recent domain decisions before proposing changes.
2. Diverge deliberately: collect candidate events from every plausible actor perspective, downstream consumer, lifecycle transition, approval/rejection, synchronization result, exception, and query need.
3. Keep candidates cheap: label speculative items as candidate events, not final domain events.
4. Compare 2-3 modeling approaches when boundaries or lifecycles are contested, such as one aggregate versus a process manager, local event versus external-system fact, or current-domain event versus read-model-only projection.
5. Recommend one approach and explain the trade-off in domain terms: consistency boundary, actor responsibility, event production path, projection completeness, policy complexity, and future ambiguity.
6. Present design sections for confirmation. Ask the user to confirm or correct each meaningful section before moving too far ahead; when follow-up questions are needed, ask focused questions one at a time.

For each candidate event, capture enough information to support convergence:

- source: user statement, existing model, inferred actor goal, read-model need, policy reaction, or external fact
- possible event name in completed business tense
- initiating actor or external system if known
- affected subject and downstream consumer
- non-read-model business consumer and the behavior, rule, policy, process, or capability it changes
- whether the candidate is only needed for query/display/projection and should be downgraded
- possible producing command, aggregate, policy, process, or external fact
- business reason to keep it
- reason to reject, split, rename, downgrade to read-model data, or mark unresolved

Only accepted events move into the formal `领域事件清单`. Rejected and unresolved candidates can appear in the draft as screening notes or confirmation items, but should not be persisted as final events unless confirmed.

## Confirmation Protocol

Prefer incremental section confirmation over one large final confirmation.

During a design conversation:

- Confirm major sections as they become stable: problem boundary, actors, candidate event screening, modeling alternatives, accepted events, commands, policies, aggregates, read models, and persistence changes.
- After presenting a section, ask whether it is correct enough to continue when the answer could change later sections.
- If the user confirms, records, or corrects a section in the conversation, treat that section as confirmed or corrected. Do not ask the user to confirm the same conclusion again at the end.
- If the user rejects or changes a section, revise downstream events, commands, aggregates, read models, and confirmation items before continuing.
- Ask one focused question at a time when a missing fact blocks the next section.

When a key business decision needs user confirmation:

- If `request_user_input` is available in the current environment, use it and provide 2-3 mutually exclusive options. Put the recommended option first and explain the modeling consequence of each option.
- If `request_user_input` is unavailable, do not present the downstream design as final. State plainly in normal text that the decision must be confirmed before continuing, then ask one focused confirmation question.
- Do not combine multiple high-impact decisions into one final answer or one bulk confirmation list. Ask them sequentially at the relevant confirmation gate.

Use confirmation gates for sections that determine downstream modeling. Do not fully expand later sections past these gates unless the user already supplied the answer explicitly:

1. Requirements-intake gate: when the input has many scenarios or stakeholders, confirm the requirement items, stakeholders, business subjects, triggers, and major gaps before using them as modeling input.
2. Problem-domain gate: confirm the domain name, included responsibilities, excluded responsibilities, and whether the request is a CRUD-template risk. Do this before finalizing actor roles, event screening, commands, aggregates, or read models.
3. Actor and authority gate: confirm command initiators, affected subjects, external systems, downstream systems, and whether any external source such as OA is authoritative. Do this before deriving accepted events and policies.
4. Key-rule gate: confirm business rules that shape events and aggregate boundaries, such as single versus multiple assignments, manager eligibility, deletion versus archive, conflict precedence, and automatic versus manual follow-up. Do this before finalizing events, commands, invariants, and policies.
5. Modeling-alternative gate: when 2-3 approaches are plausible, confirm the recommended approach or the user's chosen alternative before finalizing aggregate boundaries and read models.
6. Persistence gate: before writing files, confirm only unconfirmed or changed persistence-sensitive conclusions.

When a request is CRUD-looking or contains contested boundaries, prefer a staged response:

1. Present only the next gate section and a short reason why it matters.
2. Ask one focused confirmation question.
3. Continue to candidate event screening only after the gate is confirmed or corrected.

Avoid producing a full boundary + actors + events + commands + policies + aggregates + read models draft in one response when earlier gate decisions are still unconfirmed and likely to change the downstream model.

Use the final `结论确认清单` as a delta list, not a duplicate approval form. It should include only:

- conclusions that were not confirmed during the section-by-section conversation
- conclusions changed after the last user confirmation
- unresolved alternatives, assumptions, ambiguous terms, or missing business rules
- persistence-sensitive changes such as renaming, splitting, merging, deleting, or moving model concepts

If all persistence-relevant conclusions were already confirmed during the conversation, say that no additional confirmation items remain and proceed according to the user's requested persistence action.

## Model Repository

Use this structure when persisting the model:

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

Treat these files as ordered design artifacts, not as a checklist to complete immediately:

1. `requirements.md` is optional but useful for large or raw inputs. It records requirement-level facts and traceability anchors before DDD modeling.
2. `domain-boundary.md` must be stable before finalizing actors, events, commands, aggregates, or read models.
3. `actors.md` must be stable before accepting events and commands, because command initiators and affected subjects define event meaning.
4. `events.md` must distinguish candidate-event screening notes from accepted domain events. Accepted events require business meaning, production path, and downstream consequence.
5. `commands.md`, `policies.md`, and `relationships.md` depend on accepted events and actor authority.
6. `aggregates/<aggregate-name>.md` depends on a coherent command-event-rule model. Do not create aggregate files merely because nouns or tables exist.
7. `read-models.md` depends on accepted events, projection needs, and explicit non-event query sources. If a read model cannot be projected from accepted domain events, do not invent events for projection; first check current-state query, query-side joins, technical projection inputs, enriched payloads of already accepted events, or an external integration source.
8. `completeness-check.md` is the final gate and should record remaining unresolved questions instead of hiding them in downstream artifacts.

File responsibilities:

- `README.md`: entry index only; current model status and file navigation.
- `requirements.md`: stakeholder table, requirement items, business subject view, trigger/follow-up table, constraints, assumptions, and requirement IDs.
- `actors.md`: business actors, affected subjects, external systems, timers, and which commands/events they initiate or care about.
- `domain-boundary.md`: current problem domain, included responsibilities, excluded facts, assumptions, evolution notes.
- `glossary.md`: ubiquitous language and business terms.
- `events.md`: global domain event index.
- `commands.md`: global command index.
- `policies.md`: event-to-command automation rules and process manager candidates.
- `read-models.md`: query needs, read model fields, projection events.
- `relationships.md`: global dependency and subscription relationships.
- `completeness-check.md`: completeness and design-quality checks.
- `aggregates/<aggregate-name>.md`: commands, events, state, rules, and local relationships of one aggregate.

## Incremental Update Rules

For each user request:

1. Classify the request as new capability, changed capability, expanded problem domain, or design review.
2. Read only relevant model files before deriving the draft.
3. Create or update requirements intake first when raw requirements, stakeholder lists, trigger tables, or requirement IDs are missing and would improve traceability.
4. Build a candidate event pool before selecting final events.
5. Compare modeling approaches when a candidate event, actor responsibility, or aggregate boundary has multiple plausible interpretations.
6. Produce only the next safe design artifact when upstream gates are unresolved. Produce a complete candidate design only when boundary, actor/authority, key rules, and modeling alternatives are already confirmed or explicitly supplied.
7. Call out assumptions, ambiguous terms, alternative interpretations, and missing business rules as inferred design conclusions, not as pre-design questions.
8. Confirm design sections incrementally when their conclusions affect later modeling choices.
9. After confirmation, update affected indexes and aggregate files together only for the confirmed stage and its directly affected dependents.
10. Preserve semantic evolution notes when renaming, splitting, merging, or moving concepts.
11. If a new requirement exposes an incomplete old model, fix the model instead of hiding the gap behind a Policy, service, or handler.
12. End with a short summary of changed files, changed domain concepts, newly unlocked next artifact, and remaining questions.

Do not regenerate the whole model unless the user asks or the existing model is too inconsistent to update safely.

## Modeling Principles

- Model the current problem domain. Do not pre-split bounded contexts.
- Protect the modeling frame. User wording can be data-driven, but the design response must be behavior-driven and event-driven.
- Translate nouns, fields, statuses, and CRUD operations into actor goals, lifecycle events, rules, and read-model needs before naming aggregates.
- Treat actors as first-class modeling input. Distinguish command initiators, affected subjects, approvers, auditors, downstream consumers, timers, and external systems.
- Mark an external system only when a capability is clearly outside the current system/problem domain.
- Use business language that domain experts can understand.
- Model behavior before structure.
- For admin-system requirements, treat "management" pages as a discovery clue, not as the domain model. Reframe noun lists into lifecycle events, assignments, approvals, ownership changes, synchronization facts, and cross-role consequences.
- Treat CQRS as a modeling perspective: commands change business state through the domain model; queries are satisfied by read models.
- Read models should record their information sources, but query needs must not create domain events by themselves. A read-model-only field can come from current-state lookup, query-side joins, technical projection inputs, external sources, or accepted event payloads.
- Iterate when commands, events, aggregates, or read models do not explain each other.
- Treat commands, events, aggregate state, aggregate methods, and read-model fields as design claims that need proof. If the proof is only "the table/API/page has this field", downgrade the item to discovery material until a business rule or consumer proves it belongs.

## Design Proof Gates

Use these gates before finalizing commands, events, aggregates, aggregate methods, or read models. They are mandatory when reviewing or persisting a model.

### Event Admission Gate

For every accepted domain event, prove:

- business fact: what happened in past tense
- producer: actor/external system -> command/fact input -> aggregate/process -> event
- non-query consumer: actor option, command-side rule, policy/process, aggregate relationship, lifecycle, or downstream business capability affected by the fact
- read-model impact, if any: which projection changes and which fields change

Keep brainstormed but rejected events only in `候选事件池与筛选`, not in the formal `领域事件清单` or aggregate event list. If an item only repairs a projection, display, report, cache, operation log, or troubleshooting view, reject it as a domain event and record the alternative source.

### Command Granularity Gate

Design commands from actor intent or external fact input boundaries, not from permutations of possible events.

- One command may produce multiple events when those outcomes belong to the same actor intent and consistency boundary.
- Do not create separate commands merely because different event combinations are possible.
- Do not create one "apply/sync/update all" command unless the initiating actor or external system is actually submitting one authoritative fact package and the aggregate can make the decision coherently.
- When a command can produce multiple events, explain why the events are the result of one business decision instead of independent actions.

### Aggregate State Necessity Gate

For every aggregate state item or property, prove at least one direct use:

- a command/business method reads it to decide whether an action is allowed
- an invariant or uniqueness rule depends on it
- it affects event production, rejection, splitting, or payload enrichment
- it represents identity, lifecycle, ownership, parentage, or another state needed to enforce consistency

If no current or confirmed future business method uses the state item, remove it from the aggregate design. Reclassify it as read-model data, persistence metadata, audit/log material, synchronization metadata, or unresolved discovery material.

### Identity And Uniqueness Gate

Model identity and uniqueness by actor/source, not as one generic "name/code must be unique" rule.

For each uniqueness rule, record:

- who relies on it: human actor, import operator, external master system, downstream system, or policy
- identity fields and scope: tenant, company, parent, external ID, code, name, effective date, or other boundary
- enforcement timing: command-side strong consistency, external acceptance check, deferred reconciliation, or query-only detection
- conflict result: reject, correct, merge, override, ignore, or log-only

If different actors use different identity rules, keep them as separate rules even when they touch the same subject.

### Lifecycle Removal Gate

For delete, unregister, close, archive, disable, or decommission behavior, prove:

- the exact business meaning of removal
- the real blocking business fact, not just indirect structural children
- whether historical references remain valid
- whether restoration exists as a real business capability; if not, do not add restore commands or events
- which downstream actor, policy, rule, or read model changes after removal

### Read Model Source Gate

For every read-model field, record its source:

- accepted domain event payload or projection
- current-state lookup from command-side persistence
- query-side join
- technical projection input
- audit/log/troubleshooting source
- external read source

Do not add a domain event only to populate a read-model field. A missing read-model field is a sourcing question first and a domain-event gap only when a non-query business consumer exists.

## Traceability Rules

When `requirements.md` or requirement IDs exist, maintain a lightweight trace from requirements to the domain model:

- Each accepted command should list the requirement ID(s) or scenario(s) it satisfies.
- Each read model should list the query/view requirement ID(s) it serves.
- Each accepted event should list the command, policy, process, external fact, or trigger row that produces it.
- Each trigger/follow-up requirement should resolve to an accepted event + policy/process, a read-model projection, an external integration concern, or a rejected/downgraded candidate with a reason.
- If a requirement has no command, event, read model, or explicit rejection, mark it as uncovered in `完备性检查`.
- Do not let traceability force fake events or fake aggregates. Traceability exposes gaps; it does not override domain modeling discipline.

## Learning And Review Adaptation

When the user is learning DDD, comparing approaches, or reviewing a model, add short teaching aids without turning the response into a lecture:

- State the principle behind a recommendation in one sentence.
- Use small contrast pairs such as requirement label versus command, trigger row versus domain event, business subject versus aggregate.
- Add a compact checklist for the current stage only, such as aggregate boundary, event production path, or read-model projection.
- Avoid framework-specific or language-specific advice unless the user asks for it.

## Workflow

Follow this stage order. A later stage is blocked when its gate question could change the later model.

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

Use this stage only when the input needs requirement-level structure before modeling.

Record stakeholders, requirement items, business subjects, triggers/follow-up actions, constraints, inputs/outputs, assumptions, and gaps. Assign stable IDs such as `REQ-001` when there is more than one requirement or when later implementation is likely.

Keep this output explicitly separate from DDD conclusions:

- Requirement item is not a command.
- Business subject is not automatically an aggregate.
- Trigger row is not automatically a domain event.
- Operation type is not business intent.

Confirm the intake when it could change the domain boundary, actors, events, commands, read models, or later implementation slices.

### 1. Define Scope

Restate the current problem or increment.

Record:

- included business responsibilities
- excluded background facts
- actor groups and affected subjects
- assumptions
- ambiguous terms
- alternative interpretations
- blocking unknowns

Do not ask targeted questions before the first draft unless no useful model can be produced. Prefer to design first, mark uncertain points as inferred conclusions, and ask for confirmation after the design conclusions are visible.

### 1.5 Identify Actors And Collaboration

Before listing events, identify:

- command initiators: people, roles, timers, or external systems that can request a state change
- affected subjects: people, organizations, assets, or records whose business state changes
- decision makers: roles that approve, reject, transfer, or override
- downstream consumers: roles or systems that rely on the resulting facts or read models
- boundary candidates: concepts with different language or ownership, such as `User` as login account versus `Employee` as roster person

For each major scenario, produce a compact chain:

```text
Actor -> Command -> Event(s) -> Affected subject/read model -> Follow-up policy or open question
```

If different actors can issue similar commands, model the difference when it changes required fields, permission assumptions, events, policies, or audit meaning.

### 1.6 Brainstorm Candidate Events

Generate a candidate event pool before selecting formal domain events.

Look for:

- actor-visible outcomes
- lifecycle transitions
- approvals, rejections, transfers, overrides, cancellations, and expirations
- external facts received, accepted, rejected, deferred, conflicted, or failed
- policy trigger points
- read-model projection needs
- exceptions with business meaning
- vague data-change words that may hide specific business facts

Do not discard a candidate too early merely because it is uncertain. Keep it as a candidate, attach the uncertainty, and later converge through screening and confirmation.

Screen each candidate with these questions:

- Does the business care that this fact happened?
- Can an actor, timer, policy, process manager, aggregate, or external system produce it?
- Does it change an actor's options, an affected subject's lifecycle, a command-side rule decision, a policy reaction, a process, another aggregate, or a downstream business capability?
- Is the only consumer a read model, page, report, cache, or projection? If so, reject it as a domain event and capture the need as query-side data, technical projection, current-state lookup, or audit/log material.
- Is it specific enough, or should it be split or renamed?
- Is it inside the current problem domain, or only an integration/technical detail?
- Does keeping it improve the event-command-read-model explanation, or only mirror CRUD data changes?

### 2. Identify Domain Events

Extract already-happened business facts as candidate events.

Keep only facts that the current problem domain needs for business rules, state decisions, workflow progress, policy/process reactions, aggregate collaboration, or downstream business capabilities. Do not keep a fact as a domain event only because a read model needs to refresh or display a field.

Rules:

- Name events in completed business tense, such as `订单已提交`, `书已归还`, `月度考勤已结算`.
- Prefer specific business facts over generic data-change facts. Avoid vague events such as `信息已变更`, `资料已更新`, `状态已修改`, or `记录已删除` unless the exact changed attribute has no business-specific meaning; when using a generic event, explain why it is acceptable.
- Split combined facts such as `已停用或解散` into separate events when different policies, read models, or actor consequences may apply.
- Exclude technical facts such as logs, messages, cache refreshes, interface calls, and notifications unless the business explicitly cares about them.
- Exclude facts outside the current problem domain.
- Model failure events only when the failure itself has business meaning.
- Every current-domain event must have a production path: actor, command, aggregate/process, and meaningful outcome.

### 3. Derive Commands

For each domain event, identify the business command that caused it.

A command is an instruction sent to the domain model to complete a valuable business action.

Rules:

- Name commands as business actions, such as `提交订单`, `签到`, `结算月度考勤`, `归还图书`.
- Include the initiating actor for each command. If the same business action can be initiated by different actors or systems, explain whether it is one command with actor-specific rules or separate commands.
- Avoid CRUD-template names such as `新增`, `修改`, `删除`, `维护`, `管理`, `变更信息`, or `同步数据` when a more precise business intent exists. Use names that reveal why the change matters, such as `任命部门负责人`, `登记员工入职`, `确认OA员工同步结果`, or `撤销岗位任职`.
- Commands are not HTTP APIs, UI actions, controller methods, or use cases.
- One command may produce multiple events.
- Timer-triggered behavior still uses a command; the timer is an Actor.
- Command fields include only information the actor must provide and information the aggregate cannot derive from current state or historical events.
- If command execution needs information that cannot come from command fields or aggregate state/history, the event-command model is incomplete.
- When requirement IDs exist, include the requirement ID(s) the command satisfies.

### 4. Model Policies And Processes

Use Policy for automatic business reactions.

Policy means: when an event occurs, execute a command.

Rules:

- Use Policy for stateless event-to-command business rules.
- Mark a process manager/SAGA candidate when the reaction needs durable state, waiting, resumption, or coordination across multiple local transactions.
- Do not use Policy to hide aggregate invariants.
- Use a domain service only when behavior cannot naturally belong to one aggregate and is still true domain collaboration or calculation.

### 5. Derive Or Update Aggregates

Derive aggregates after the event-command model is coherent.

An aggregate is defined by a cohesive group of long-lived business capabilities, not by fields or tables.

For each aggregate, specify:

- name and identity
- state needed by its behavior
- actors allowed to issue its commands, when actor-specific rules matter
- commands it handles
- events it publishes
- rules and invariants it protects
- why commands/events belong here

Rules:

- Current-domain state-changing events should normally be published by aggregates.
- A process manager may trigger commands; it should not replace aggregates as the source of core state-change events.
- Aggregate state must be reconstructable from its historical events when using an event-sourcing view.
- If a proposed aggregate name is the same as a noun from the user prompt or a CRUD page, prove it is a consistency/lifecycle boundary. If you cannot prove that, mark it as a candidate read model, reference data, or unresolved concept instead of finalizing it as an aggregate.
- Do not merge aggregates because fields look similar.
- Do not split aggregates so finely that coupling leaks into services or handlers.
- Do not grow aggregates so large that performance, concurrency, or loading boundaries become unreasonable.

### 6. Design Read Models

Separate query needs from command behavior.

For each read model, specify:

- user or query need
- requirement ID(s) when available
- identity
- fields
- accepted domain events that create or update it, if any
- non-event sources such as current-state lookup, query-side joins, technical projection inputs, enriched accepted-event payloads, or external read sources
- whether any missing field reveals a real domain-event gap or only a query-side sourcing decision

If a read model cannot be built from accepted domain events, do not invent events for projection. First decide whether the field can come from current-state query, query-side joins, accepted event payload enrichment, technical projection, audit/log data, or external read sources. Add or change a domain event only when a non-read-model business consumer exists and the event has a production path.

## Relationship Rules

Maintain three relationship views:

- Dependency: a command checks or depends on prior facts, aggregate state, or upstream status.
- Subscription: an event triggers a Policy, which executes a command.
- Actor impact: an event changes what an actor, affected subject, external system, or read model can see or do next.

Use text as the source of truth. Diagrams are auxiliary.

Examples:

```text
依赖：岗位已创建事件 -> 员工入职命令，用于校验岗位存在。
订阅：测试工单已开始事件 -> 测试步骤创建策略 -> 创建测试步骤命令。
影响：员工已离职事件 -> 部门负责人候选人读模型移除该员工，并触发负责人任命有效性复核。
```

## Output Order

When responding in chat or updating model files, use this order:

1. `需求拆解` when requirements intake is needed
2. `问题域边界`
3. `主体与协作场景`
4. `候选事件池与筛选`
5. `建模方案对比`
6. `领域事件清单`
7. `命令清单`
8. `Policy/流程规则`
9. `聚合设计`
10. `领域服务`
11. `读模型设计`
12. `需求追踪`
13. `关系总览`
14. `完备性检查`
15. `结论确认清单`

Only list domain services that are truly needed.

Use `候选事件池与筛选` to show important brainstormed candidates, especially candidates that were rejected, split, renamed, downgraded, or left unresolved. Keep this compact; it is a reasoning aid, not a second event catalog.

Use `建模方案对比` only when there are meaningful alternatives. Include 2-3 options, trade-offs, and the recommended option.

Use `需求追踪` only when requirement IDs or requirement tables exist. Keep it compact: requirement ID -> command/read model/event/policy or uncovered/rejected reason.

Before persistence, `结论确认清单` must list only unconfirmed or newly changed design conclusions the user should confirm or correct. Include boundary choices, actors and affected subjects, event names and meanings, command responsibilities, policies, aggregate boundaries, invariants, read models, relationships, assumptions, ambiguous business terms, and alternative interpretations that could change the model when they were not already confirmed earlier.

For each confirmation item, explain which event, command, aggregate, policy, read model, or relationship it affects. Do not repeat items already confirmed in earlier sections unless they changed after confirmation. After confirmation and persistence, include only remaining unresolved items in the final summary.

## Diagram Rules

Prefer structured Markdown by default.

Use Mermaid or PlantUML only when:

- the user asks for a diagram
- the repository already uses that diagram style
- a diagram significantly improves understanding

If using Mermaid, use these labels:

- `[Actor: 用户]`
- `[Timer: 月末定时器]`
- `[System: 外部系统]`
- `[Command: 签到]`
- `[Event: 员工已签到]`
- `[Policy: 满勤奖励策略]`
- `[Aggregate: 月度考勤]`
- `[Service: 借书服务]`
- `[ReadModel: 考勤记录]`

If an existing PlantUML event-storming style exists, continue it. Prefer one local file per aggregate and a global file for cross-aggregate relationships.

## Completeness Check

Before finalizing, check:

- The current response did not generate downstream artifacts past an unconfirmed gate.
- Persisted files were updated only for confirmed stages or directly affected dependents.
- Requirements intake, when used, stayed at requirement level and did not declare aggregates, commands, events, APIs, packages, or code.
- Requirement IDs, when present, are traced to commands, read models, accepted events/policies, or explicit uncovered/rejected notes.
- Candidate events were brainstormed before final event selection when the requirement had non-trivial ambiguity.
- Rejected, split, renamed, downgraded, or unresolved candidate events have a stated reason when they matter to the design.
- Meaningful modeling alternatives were compared before choosing contested event, policy, process, aggregate, or read-model boundaries.
- Every command has an initiating actor or external system.
- Every domain event has a production path from actor -> command -> aggregate/process -> event.
- Every accepted domain event has at least one business consumer other than read models, pages, reports, caches, or projection completeness.
- No accepted domain event is justified only by read-model refresh, page display, cache update, report fields, or projection completeness.
- Every important event has an affected actor, subject, command-side rule, policy/process, aggregate, or downstream business relationship.
- Current-domain state-changing events are published by aggregates unless a clear exception is recorded.
- Every command has the information it needs from command fields plus aggregate state/history.
- Every command is justified by actor intent or an external fact input boundary, not by an arbitrary event-combination permutation.
- If one command may publish multiple events, those events are explained as outcomes of one business decision inside one consistency boundary.
- Meaningful command outcomes are represented as events.
- Generic events such as `信息已变更` have been replaced by specific facts or explicitly justified.
- Rejected candidate events are not retained in accepted event catalogs, aggregate event lists, or implementation-alignment lists.
- Every read model records whether each field comes from accepted events, current-state lookup, query-side joins, technical projection inputs, enriched payloads, or external read sources.
- Every read-model-only field is marked as query-side data, technical projection input, current-state lookup, audit/log material, or external-source data instead of being promoted to a domain event.
- Policies do not hide aggregate invariants.
- Domain services do not become procedural service layers.
- Aggregates are derived from behavior, rules, identity, lifecycle, and invariants, not tables, CRUD resources, or noun lists.
- Every aggregate property is directly used by at least one command/business method, invariant, uniqueness rule, event production decision, lifecycle decision, or consistency relationship.
- Human-maintained identity rules and external-system identity rules are separated when they use different scopes or keys.
- Removal/decommission rules identify the real blocking business fact, historical-reference behavior, and downstream consequence.
- Aggregates are neither too large nor too fragmented.
- Query needs do not pollute aggregate state.

## Reject These Anti-Patterns

Refuse or correct these patterns:

- Starting by creating `application/domain/infrastructure` packages.
- Renaming controller-service-dao into DDD layers.
- Treating requirement tables, user stories, operation labels, or business subject views as the domain model without event-command-rule screening.
- Losing traceability from confirmed requirement items to commands, events, read models, policies, or explicit uncovered/rejected notes.
- Designing aggregates from database tables, CRUD pages, or REST resources.
- Designing one aggregate per noun in a CRUD-looking prompt without proving lifecycle and consistency boundaries.
- Filling every `event-storming/` file in one pass for a new ambiguous requirement before boundary, actor authority, key rules, and event screening are confirmed.
- Flattening a multi-role workflow into a single administrator actor or a single "manage data" scenario.
- Using vague data-change events such as `信息已变更` when a concrete business fact is available.
- Treating external master-data sync as a simple upsert when ordering, dependency, failure, or conflict resolution has business meaning.
- Creating domain events for technical actions the business does not care about.
- Creating domain events only because a read model, page, report, cache, or projection needs a field refreshed.
- Keeping rejected candidate events in final event lists, aggregate files, or implementation checklists.
- Creating command permutations from possible event combinations instead of actor intent or external fact input.
- Adding "source type", "current status", "description", display names, or other fields to aggregate state when no aggregate method or invariant uses them.
- Collapsing different identity rules into one generic uniqueness statement when human actors and upstream systems use different scopes or keys.
- Adding restore behavior because it is technically possible when no business capability exists.
- Putting report/page/query fields into aggregates for convenience.
- Putting most business rules into command handlers, application services, listeners, repositories, or policies.
- Splitting bounded contexts before understanding the current problem domain.
- Treating CQRS as database read-write splitting instead of business command/query responsibility separation.

See `references/anti-patterns.md` for a compact anti-pattern library when reviewing designs.

## On-Demand References And Scripts

- `references/anti-patterns.md`: DDD modeling anti-patterns to reject or correct.
- `references/eval-cases.md`: evaluation cases for checking whether the skill preserves event-storming discipline.
- `scripts/validate-ddd-design.ts`: lightweight heuristic checks for Markdown drafts or `event-storming/` repositories. Run with `bun skills/df-ddd-event-storming-design/scripts/validate-ddd-design.ts <path> [--require-sections]`.
