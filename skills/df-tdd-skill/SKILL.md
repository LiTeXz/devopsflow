---
name: df-tdd-skill
description: "适用于全新功能开发、缺陷修复、行为保持型重构、特征测试以及先刻画后修复工作的纯 TDD 工作流。当 Codex 需要以测试优先的纪律从零构建新行为，或在不引起行为漂移的前提下修改现有代码时使用。适用于各种语言和架构。不要用于技术栈专用分层规则、仅文档编辑、简单格式调整，或不期望产生可执行行为的纯探索性原型。"
---

# TDD Skill

使用与项目无关的 TDD 节奏构建或修改行为：先定义下一个可观察行为，使其失败，使其通过，并且仅在通过状态后重构。

```typescript
/**
 * Identifies the delivery shape so the workflow can select the correct test-first strategy.
 */
type TddTaskType =
  /** Introduces behavior that has no production implementation yet. */
  | 'greenfield_feature'
  /** Reproduces an incorrect behavior before applying the smallest correction. */
  | 'bug_fix'
  /** Preserves observable behavior while changing internal design. */
  | 'pure_refactor'
  /** Captures an existing contract before intentionally correcting it. */
  | 'characterize_then_fix'
```

```typescript
/**
 * Represents the evidence-backed lifecycle phase currently reached by the active behavior slice.
 */
type TddPhase =
  /** The protected behavior, stable boundary, and first test are explicitly recorded. */
  | 'scope_defined'
  /** The narrowest relevant test exists but has not yet produced accepted failure evidence. */
  | 'test_written'
  /** The test fails for the target risk rather than for setup or syntax errors. */
  | 'red_observed'
  /** The same test passes after the smallest production behavior change. */
  | 'green_reached'
  /** Internal cleanup is complete and the protected test remains passing. */
  | 'refactor_done'
  /** Required focused and broad checks have completed with recorded evidence. */
  | 'final_verified'
```

```typescript
/**
 * Mirrors the host todo tool statuses used to coordinate executable TDD work.
 */
type TodoStatus =
  /** The item is known but cannot start until the current behavior slice finishes. */
  | 'pending'
  /** The item is the single behavior slice currently receiving changes and evidence. */
  | 'in_progress'
  /** The item has satisfied its expected observation and verification gate. */
  | 'completed'
```

```typescript
/**
 * Connects one host todo entry to one observable behavior slice or verification gate.
 */
interface TddTodoItem {
  /** Stable identifier used when synchronizing phase transitions with the todo tool. */
  id: string
  /** Observable behavior or completion gate whose result can be verified. */
  behavior: string
  /** Current host todo status, with only one item allowed to be in progress. */
  status: TodoStatus
}
```

```typescript
/**
 * Defines the complete user-visible state required for one active TDD workflow.
 */
interface TddWorkflowState {
  /** Strategy category selected before editing production behavior. */
  taskType: TddTaskType
  /** Furthest evidence-backed lifecycle phase reached by the active slice. */
  phase: TddPhase
  /** Permanent JSONL audit path that receives every protocol event in append order. */
  checkpoint: `.devopsflow/.tdd_checkpoints/${string}.jsonl`
  /** Literal retention policy preventing completion cleanup from deleting the audit file. */
  checkpointRetention: 'retain'
  /** Exact test name or command currently driving the behavior change. */
  activeTest: string
  /** Snapshot that must match the host todo tool after every phase transition. */
  todos: readonly TddTodoItem[]
}
```

```typescript
/**
 * Shows the required reporting shape and requires every placeholder to use live task evidence.
 */
const currentTddState = {
  /** The current delivery strategy selected during scope definition. */
  taskType: 'bug_fix',
  /** The latest phase supported by commands and observable test output. */
  phase: 'red_observed',
  /** The permanent checkpoint path for the current task slug. */
  checkpoint: '.devopsflow/.tdd_checkpoints/<task-slug>.jsonl',
  /** The immutable policy requiring this checkpoint to remain after completion. */
  checkpointRetention: 'retain',
  /** The exact focused test or command currently producing phase evidence. */
  activeTest: '<exact test name or command>',
  /** The todo tool snapshot, including the single active behavior slice. */
  todos: [
    {
      /** Stable todo identifier referenced by state transitions. */
      id: 'behavior-1',
      /** Observable result protected by the focused test. */
      behavior: '<observable behavior>',
      /** Active status proving this is the only item currently being executed. */
      status: 'in_progress',
    },
  ],
} as const satisfies TddWorkflowState
```

## Protocol

编辑生产代码前，使用 [tdd_start.jsonl](templates/tdd_start.jsonl) 输出 `tdd_start` protocol block，使流程可检查。

每当观察到重要状态时，使用 [tdd_state.jsonl](templates/tdd_state.jsonl) 记录 `tdd_state` protocol block。

完成前，使用 [tdd_finish.jsonl](templates/tdd_finish.jsonl) 输出 `tdd_finish` protocol block。

这些块是半自动护栏所用的流程元数据。不要在其中放入项目结构或技术栈规则。完整协议参见 [hook-protocol.md](references/hook-protocol.md)。
证据字段必须记录具体命令、退出码、测试名称以及失败或通过摘要。不要使用“测试失败了”或“测试通过了”等含糊证据。

此 skill 无法注册平台级自动 hook。使用时，必须在固定阶段主动运行 `bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts`：

- 将当前任务的 protocol blocks 追加到 `.devopsflow/.tdd_checkpoints/<task-slug>.jsonl`。该文件是永久审计记录，完成任务后仍必须保留，不得删除、清空或移动到临时目录。
- 编辑生产代码前：输出 `tdd_start`，然后运行 `--stage before_edit`。`validation failed` 时，先补全声明再编辑生产代码。
- 观察到 RED/GREEN/REFACTOR 状态后：输出 `tdd_state`，然后运行 `--stage state`。`validation failed` 时，补充命令、退出码、测试名称、与风险相关的证据，或返回正确阶段。
- 最终响应前：输出 `tdd_finish`，然后运行 `--stage finish`。`validation failed` 时，继续补充证据、执行测试或纠正工作流。

## Todo List Coordination

在输出并验证 `tdd_start` 后，立即调用宿主提供的 todo list 工具，例如 Codex 的 `update_plan` 或 ChatGPT 的 `todolist`，明确列出行为切片、当前测试、最小实现和最终验证。不要只在对话中口述计划。

- 每个 todo 项对应一个可验证的行为切片或完成门禁，描述中包含预期观察结果。
- 开始写测试时将对应项设为 `in_progress`；观察 `red_observed`、达到 `green_reached`、完成 `refactor_done` 和进入 `final_verified` 时都调用工具同步状态。
- 任一时刻只有一个 `in_progress`。不要到最后一次性把所有项标为 `completed`。
- 新发现的行为、风险或验证工作立即加入 todo list；不再需要的项保留并在说明中标明原因，不要静默删除。
- 输出当前状态的 `typescript` code block 时，使 `todos` 与工具中的实际清单一致。
- 输出 `tdd_finish` 前逐项核对 todo list。未完成项必须继续执行，或作为 `residual_risk` 明确交接。

## Core Loop

1. 定义一个最小行为切片。
2. 说明稳定边界：公共契约、传输边界、编排逻辑、核心逻辑、持久化边界、外部副作用或其他可观察接口。
3. 将任务分类为 `greenfield_feature`、`bug_fix`、`pure_refactor` 或 `characterize_then_fix`。
4. 先写测试：全新功能使用期望行为测试，缺陷修复使用复现测试，纯重构使用特征测试。
5. 先观察 `red_observed`：记录失败命令、退出码、测试名称，以及失败与目标风险之间的关系，并同步 todo list。
   - 如果测试因目标风险而失败，继续。
   - 如果测试因测试本身有问题而报错，修复测试，直至它因目标风险而失败。
   - 如果测试立即通过，停止操作；在编辑生产代码前，先证明它能够因目标风险而失败。
6. 进行达到 `green_reached` 所需的最小生产代码修改。
7. 在 `green_reached` 后重构；处于 `red_observed` 时不要进行结构清理。
8. 每个有意义的步骤后运行最小相关测试。
9. 以小切片重复，直至目标行为和设计变更完成。

## Violation Recovery

违反流程时，在继续前恢复流程，不要为偏差辩解：

- 如果在有意义的失败测试前已经添加或修改生产代码，停止并移除或暂存该生产代码修改，然后先写失败测试。
- 如果测试在实现之后才添加，不要将其视为 TDD 证据。充分回退或禁用实现路径，重新产生 RED 信号，以证明测试能够保护目标风险。
- 如果因行为已经存在而无法观察 RED 状态，使用临时变异证明测试能够失败，然后在继续前恢复代码。
- 如果用户明确要求保留非 TDD 路径，在最终响应中报告偏差、补偿测试和剩余风险。

## Greenfield Feature Development

对于全新开发，在创建生产实现前定义第一个外部可观察行为：

- 用业务、用户或公共契约语言说明第一个行为。
- 选择第一个稳定边界：公共 API、CLI 命令、UI 交互、领域服务、纯函数、持久化契约或集成边界。
- 在创建实现前编写失败测试。
- RED 状态可以因符号、路由、类、命令或模块尚不存在而失败；只有当缺失元素恰好是行为切片所需边界时，这才有效。
- 只添加使当前测试通过所需的生产代码。
- 在 GREEN 测试产生真实压力前，延后大范围基础设施、抽象和清理。
- 使用下一个最小行为切片重复。

## Non-Negotiable Rules

- 没有支持期望可观察行为的失败测试时，不要添加或修改生产行为。
- 对于全新工作，除非项目没有最小设置就无法运行测试，否则不要在首个失败行为测试前创建大范围基础设施。
- 不要以“太小而不值得测试”“稍后补测试”“手工验证已足够”或“这只是胶水代码”为由跳过 RED。
- 不要把错误的当前契约命名为期望契约。当前行为错误时，明确选择“仅刻画兼容性”或“先刻画，再继续修复”。
- 对于纯重构，不要随意修改公共契约、默认值、错误语义、排序、分页、事务或一致性边界、安全规则、持久化结果或外部副作用。
- 断言可观察行为，不要只断言实现细节或“没有异常”。
- 选择真正保护风险的最窄测试层。当窄层测试无法覆盖边界风险时，扩大测试范围。
- 仅在 GREEN 后重构。重构后，同一组相关测试仍应通过。
- 不要把架构或技术栈规则伪装成 TDD 本身。框架边界相关时，使用对应的技术栈 skill。
- 将 `tdd_start`、`tdd_state` 和 `tdd_finish` 视为唯一稳定的验证接口。半自动脚本不应推断项目目录或框架类型。
- 永久保留 `.devopsflow/.tdd_checkpoints/<task-slug>.jsonl`，不得把任务完成视为删除审计记录的授权。
- 使用 todo list 工具明确列出并穿插更新 TDD 工作项，任一时刻只有一个 `in_progress`。
- 不要使用含糊证据满足协议。RED 证据必须表明目标测试因目标风险而失败；GREEN 证据必须表明最小生产修改后，同一风险已受到保护。

## Pre-Edit Check

第一次编辑生产代码前，写下：

- 正在保护什么行为？
- 稳定边界是什么？
- 任务类型是 `greenfield_feature`、`bug_fix`、`pure_refactor` 还是 `characterize_then_fix`？
- 哪个测试会先进入 RED？为什么这个 RED 有意义？
- 此变更触及哪类边界：公共契约、传输、编排、核心逻辑、持久化、外部系统还是副作用？
- 哪些行为不得改变？
- 对于全新工作，可以通过边界观察到的最小有用行为是什么？
- 如果当前行为错误，此任务是在保持兼容性还是继续修复？

如果答案不明确，在修改生产代码前继续阅读代码或添加测试。

## Choosing Test Layers

按风险选择测试层，而不是按文件名或技术偏好选择：

- 核心规则、计算、状态转换、纯函数、值对象：单元测试。
- 编排逻辑、协作者调用顺序、批处理、失败后继续或停止策略：组件或编排层测试。
- 公共传输边界、请求或响应契约、序列化、验证、认证和授权：边界或契约测试。
- 持久化查询、排序、分页、约束、事务敏感行为：持久化或集成测试。
- 风险本身是跨层协作：少量端到端或系统测试。
- 风险是依赖方向或分层规则：架构测试或静态检查。

将有环境支撑的验证视为同一 TDD 与验证连续体的一部分，而不是开发之外的工作：

- 当风险取决于真实服务、数据存储、协议、事务或工具链行为时，使用集成测试。
- 当不变量必须在生成的输入空间而非少数示例中成立时，使用属性测试。
- 当发布行为必须先在受控环境中观察再扩大范围时，使用 canary 测试。
- 修复缺陷前，使用脱敏输入、可观察证据和回归断言，将生产事故调查转化为复现测试。
- 通过相同的风险和行为可追踪关系，将单元测试、功能测试、集成测试、属性测试、canary 测试和事故复现测试连接起来。
- 记录所需服务、fixture、环境假设、命令和观察结果。如果环境不可用，报告未经验证的层和剩余风险，不要将其重新归类为不必要。

更多细节参见 [test-slices.md](references/test-slices.md)。

## Characterization Tests

修改保持行为的代码前，捕获当前行为：

- 覆盖调用方可能依赖的正常路径和棘手边界场景。
- 断言返回值、错误语义、重要参数、持久化变更和外部副作用。
- 对于分页、批处理、导入或导出、回调和重复查询，捕获完整序列，而不只是第一次调用。
- 断言异常类型以及有意义的消息或错误码。
- 保持测试数据小巧、可读，并按业务含义命名。

完整规则参见 [characterization-tests.md](references/characterization-tests.md)。

## When Testing Feels Hard

在扩大实现范围前，将难以编写的测试视为设计反馈：

- 如果准备工作庞大，查找公共契约上的不稳定边界、隐藏依赖或缺失的接缝。
- 如果 mock 复杂，重新考虑该行为是否应位于更窄的核心单元、组件测试或真实集成切片中。
- 如果断言含糊，先写期望断言，再围绕行为塑造测试数据。
- 如果首个测试需要大范围基础设施，选择更小的可观察行为或更稳定的边界。

## Completion Criteria

- 每个新增或修改的关键测试都在生产修改后经历了 RED 再到 GREEN。
- 对于全新工作，每个已实现行为切片都在生产实现前经历 RED，并在最小修改后达到 GREEN。
- 移动后的职责在新归属方仍有行为测试保护。
- 没有意外行为变更，尤其是契约、默认值、错误语义、排序、分页、一致性、安全性、持久化结果和副作用。
- 最小相关测试通过；更广泛的检查已运行，或明确说明未运行。
- TDD 流程的任何偏差都明确报告原因、补偿测试和剩余风险。
- 面向用户的最终报告必须使用中文，并包含受保护行为、测试层、设计变更、修改文件、命令结果和剩余风险。

## On-Demand References

- [test-slices.md](references/test-slices.md)：按风险选择测试层。
- [hook-protocol.md](references/hook-protocol.md)：半自动 TDD 护栏脚本的字段、状态和阻断规则。
- [characterization-tests.md](references/characterization-tests.md)：如何为复杂现有行为编写特征测试。
- [checklists.md](references/checklists.md)：编辑前、完成前、测试质量和边界异味检查。
- [eval-cases.md](references/eval-cases.md)：迭代此 skill 时使用的失败样例和预期护栏行为。
- [anti-patterns.md](references/anti-patterns.md)：迭代此 skill 时应拒绝或纠正的常见 TDD 失败模式。
- [tdd_start.jsonl](templates/tdd_start.jsonl)、[tdd_state.jsonl](templates/tdd_state.jsonl)、[tdd_finish.jsonl](templates/tdd_finish.jsonl)：按需加载的 protocol block templates。
- [validate-tdd-protocol.ts](scripts/validate-tdd-protocol.ts)：在固定阶段使用 `bun skills/df-tdd-skill/scripts/validate-tdd-protocol.ts` 运行的 protocol validation script。
- [run-protocol-examples.test.ts](scripts/run-protocol-examples.test.ts)：使用 `bun test skills/df-tdd-skill/scripts/run-protocol-examples.test.ts` 运行的轻量回归套件；它检查有效示例通过且常见违规失败。
