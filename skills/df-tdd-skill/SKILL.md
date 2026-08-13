---
name: df-tdd-skill
description: "适用于全新 feature development, 缺陷 fix, 行为保持型 refactor, 特征 tests 以及先刻画后 fix work 的纯 TDD workflow. 当 Codex 需要以 tests 优先的纪律从零构建新行为, or 在不引起行为漂移的前提下修改现有 code 时使用. 适用于各种 language and 架构. 不要用于技术栈专用分层 rule, 仅文档 edit, 简单格式调整, or 不期望产生可 execution 行为的纯探索性原型."
---

# TDD Skill

使用 project 无关的 TDD 节奏构建 or 修改行为: 先 definition 后续可观察行为, 使其失败, 再使其 passed, 并且仅在 passed 状态后 refactor.

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

edit 生产 code 前, 使用 [tdd_start.jsonl](templates/tdd_start.jsonl) output `tdd_start` protocol block, 使流程可 check.

每当观察到重要状态时, 使用 [tdd_state.jsonl](templates/tdd_state.jsonl) 记录 `tdd_state` protocol block.

完成前, 使用 [tdd_finish.jsonl](templates/tdd_finish.jsonl) output `tdd_finish` protocol block.

这些块是半自动护栏所用的流程元数据. 不要在其中放入 project 结构 or 技术栈 rule. 完整 protocol 参见 [hook-protocol.md](references/hook-protocol.md).
证据字段必须记录具体命令, exit code, tests name 以及失败 or passed 摘要. 不要使用"tests 失败了"or"tests passed 了"等含糊证据.

此 skill 无法注册 platform 级自动 hook. 使用时, 必须在固定阶段主动 run install 后 skill 根 directory 中的 `validate-tdd-protocol.ts`:

- if target project 已 enable `.devopsflow/.tdd_checkpoints/<task-slug>.jsonl`, 将当前 task 的 protocol blocks 追加到该 file. 它是永久审计记录, 完成 task 后仍必须保留; directory 不存在时不要擅自 create DevopsFlow 专属结构, 先记录替代审计位置 or 请求确认.
- edit 生产 code 前: output `tdd_start`, 然后 run `--stage before_edit`.`validation failed` 时, 先补全声明再 edit 生产 code.
- 观察到 RED/GREEN/REFACTOR 状态后: output `tdd_state`, 然后 run `--stage state`.`validation failed` 时, 补充命令, exit code, tests name, and 风险相关的证据, or return 正确阶段.
- 最终响应前: output `tdd_finish`, 然后 run `--stage finish`.`validation failed` 时, 继续补充证据, execution tests or 纠正 workflow.

## Todo List Coordination

在 output 并验证 `tdd_start` 后, 立即 call 宿主提供的 todo list 工具, 例如 Codex 的 `update_plan` or ChatGPT 的 `todolist`, 明确列出行为切片, 当前 tests, 最小 implementation and 最终验证. 不要只在对话中口述计划.

- 每个 todo 项对应 1 个可验证的行为切片 or 完成 gate, description 中 include 预期观察 result.
- 开始 write tests 时将对应项设为 `in_progress`; 观察 `red_observed`, 达到 `green_reached`, 完成 `refactor_done` and 进入 `final_verified` 时都 call 工具同步状态.
- 任何时刻只有 1 个 `in_progress`. 不要到最后 1 次完成把所有项标为 `completed`.
- 新发现的行为, 风险 or 验证 work 立即加入 todo list; 不再需要的项保留并在说明中标明原因, 不要静默删除.
- output 当前状态的 `typescript` code block 时, 使 `todos` and 工具中的实际 manifest consistent.
- output `tdd_finish` 前逐项核对 todo list. 未完成项必须继续 execution, or 作为 `residual_risk` 明确交接.

## Core Loop

1. definition 1 个最小行为切片.
2. 说明稳定边界: 公共契约, 传输边界, 编排逻辑, 核心逻辑, 持久化边界, 外部副作用 or other 可观察接口.
3. 将 task category 为 `greenfield_feature`,`bug_fix`,`pure_refactor` or `characterize_then_fix`.
4. 先 write tests: 全新 feature 使用期望行为 tests, 缺陷 fix 使用复现 tests, 纯 refactor 使用特征 tests.
5. 先观察 `red_observed`: 记录失败命令, exit code, tests name, 以及失败 and target 风险之间的关系, 并同步 todo list.
   - if tests 因 target 风险而失败, 继续.
   - if tests 因 tests 本身有问题而报错, fix tests, 直至它因 target 风险而失败.
   - if tests 立即 passed, 停止操作; 在 edit 生产 code 前, 先证明它能够因 target 风险而失败.
6. 进行达到 `green_reached` 所需的最小生产 code 修改.
7. 在 `green_reached` 后 refactor; 处于 `red_observed` 时不要进行结构清理.
8. 每个有意义的步骤后 run 最小相关 tests.
9. 以小切片重复, 直至 target 行为 and 设计 change 完成.

## Violation Recovery

违反流程时, 在继续前恢复流程, 不要为偏差辩解:

- if 在有意义的失败 tests 前已经添加 or 修改生产 code, 停止并移除 or 暂存该生产 code 修改, 然后先 write 失败 tests.
- if tests 在 implementation 之后才添加, 不要将其视为 TDD 证据. 充分回退 or disable implementation 路径, 重新产生 RED 信号, 以证明 tests 能够保护 target 风险.
- if 因行为已经存在而无法观察 RED 状态, 使用临时变异证明 tests 能够失败, 然后在继续前恢复 code.
- if user 明确要求保留非 TDD 路径, 在最终响应中报告偏差, 补偿 tests and 剩余风险.

## Greenfield Feature Development

对于全新 development, 在 create 生产 implementation 前 definition first 外部可观察行为:

- 用业务, user or 公共契约 language 说明 first 行为.
- 选择 first 稳定边界: 公共 API, CLI 命令, UI 交互, domain service, 纯函数, 持久化契约 or integration 边界.
- 在 create implementation 前 write 失败 tests.
- RED 状态可以因符号, route, 类, 命令 or module 尚不存在而失败; 只有当缺失元素恰好是行为切片所需边界时, 这才有效.
- 只添加使当前 tests passed 所需的生产 code.
- 在 GREEN tests 产生真实压力前, 延后大范围基础设施, 抽象 and 清理.
- 使用后续最小行为切片重复.

## Non-Negotiable Rules

- 没有支持期望可观察行为的失败 tests 时, 不要添加 or 修改生产行为.
- 对于全新 work, 除非 project 没有最小设置就无法 run tests, 否则不要在首个失败行为 tests 前 create 大范围基础设施.
- 不要以"太小而不 value 得 tests""稍后补 tests""手工验证已足够"or"这只是胶水 code"为由跳过 RED.
- 不要把错误的当前契约命名为期望契约. 当前行为错误时, 明确选择"仅刻画兼容性"or"先刻画, 再继续 fix".
- 对于纯 refactor, 不要随意修改公共契约, default value, 错误语义, 排序, 分页, 事务 or consistency 边界, 安全 rule, 持久化 result or 外部副作用.
- 断言可观察行为, 不要只断言 implementation 细节 or"没有异常".
- 选择真正保护风险的最窄 tests 层. 当窄层 tests 无法覆盖边界风险时, 扩大 tests 范围.
- 仅在 GREEN 后 refactor. refactor 后, 同组相关 tests 仍应 passed.
- 不要把架构 or 技术栈 rule 伪装成 TDD 本身. framework 边界相关时, 使用对应的技术栈 skill.
- 将 `tdd_start`,`tdd_state` and `tdd_finish` 视为 unique 稳定的验证接口. 半自动 script 不应推断 project directory or framework type.
- 永久保留已 enable 的 `.devopsflow/.tdd_checkpoints/<task-slug>.jsonl`, 不得把 task 完成视为删除审计记录的授权.
- 使用 todo list 工具明确列出并穿插 update TDD work 项, 任何时刻只有 1 个 `in_progress`.
- 不要使用含糊证据满足 protocol. RED 证据必须表明 target tests 因 target 风险而失败; GREEN 证据必须表明最小生产修改后, 相同风险已受到保护.

## Pre-Edit Check

首次 edit 生产 code 前, write 下:

- 正在保护什么行为?
- 稳定边界是什么?
- task type 是 `greenfield_feature`,`bug_fix`,`pure_refactor` 还是 `characterize_then_fix`?
- 哪个 tests 会先进入 RED? 为什么这个 RED 有意义?
- 此 change 触及哪类边界: 公共契约, 传输, 编排, 核心逻辑, 持久化, 外部 system 还是副作用?
- 哪些行为不得 change?
- 对于全新 work, 可从边界观察到的最小有用行为是什么?
- if 当前行为错误, 此 task 是在保持兼容性还是继续 fix?

if 答案不明确, 在修改生产 code 前继续阅读 code or 添加 tests.

## Choosing Test Layers

按风险选择 tests 层, 而不是按 file 名 or 技术偏好选择:

- 核心 rule, 计算, 状态转换, 纯函数, value object: 单元 tests.
- 编排逻辑, 协作者 call 顺序, 批处理, 失败后继续 or 停止策略: 组件 or 编排层 tests.
- 公共传输边界, 请求 or 响应契约, 序列化, 验证, 认证 and 授权: 边界 or 契约 tests.
- 持久化查询, 排序, 分页, 约束, 事务敏感行为: 持久化 or integration tests.
- 风险本身是跨层协作: 少量端到端 or system tests.
- 风险是依赖方向 or 分层 rule: 架构 tests or static check.

将有环境支撑的验证视为相同 TDD and 验证连续体的 part, 而不是 development 之外的 work:

- 当风险取决于真实 service, 数据存储, protocol, 事务 or 工具链行为时, 使用 integration tests.
- 当不变量必须在 generate 的 input 空间而非少数 example 中成立时, 使用属性 tests.
- 当发布行为必须先在受控环境中观察再扩大范围时, 使用 canary tests.
- fix 缺陷前, 使用脱敏 input, 可观察证据 and 回归断言, 将生产事故调查转化为复现 tests.
- 围绕相同的风险 and 行为可追踪关系, 将单元 tests, functional tests, integration tests, 属性 tests, canary tests and 事故复现 tests 连接起来.
- 记录所需 service, fixture, 环境假设, 命令 and 观察 result. if 环境 unavailable, 报告未经验证的层 and 剩余风险, 不要将其重新归类为不必要.

更多细节参见 [test-slices.md](references/test-slices.md).

## Characterization Tests

修改保持行为的 code 前, 捕获当前行为:

- 覆盖 call 方可能依赖的正常路径 and 棘手边界场景.
- 断言 return value, 错误语义, 重要参数, 持久化 change and 外部副作用.
- 对于分页, 批处理, import or 导出, 回调 and 重复查询, 捕获完整序列, 而不只是首次 call.
- 断言异常 type 以及有意义的消息 or 错误 code.
- 保持 tests 数据小巧, 可读, 并按业务含义命名.

完整 rule 参见 [characterization-tests.md](references/characterization-tests.md).

## When Testing Feels Hard

在扩大 implementation 范围前, 将难以 write 的 tests 视为设计反馈:

- if ready work 庞大, 查找公共契约上的不稳定边界, 隐藏依赖 or 缺失的接缝.
- if mock 复杂, 重新考虑该行为是否应位于更窄的核心单元, 组件 tests or 真实 integration 切片中.
- if 断言含糊, 先 write 期望断言, 再围绕行为塑造 tests 数据.
- if 首个 tests 需要大范围基础设施, 选择更小的可观察行为 or 更稳定的边界.

## Completion Criteria

- 每个新增 or 修改的关键 tests 都在生产修改后经历了 RED 再到 GREEN.
- 对于全新 work, 每个已 implementation 行为切片都在生产 implementation 前经历 RED, 并在最小修改后达到 GREEN.
- 移动后的职责在新归属方仍有行为 tests 保护.
- 没有意外行为 change, 尤其是契约, default value, 错误语义, 排序, 分页, consistency, 安全性, 持久化 result and 副作用.
- 最小相关 tests passed; 更广泛的 check 已 run, or 明确说明未 run.
- TDD 流程的任何偏差都明确报告原因, 补偿 tests and 剩余风险.
- 面向 user 的最终报告必须使用 chinese, 并 include 受保护行为, tests 层, 设计 change, 修改 file, 命令 result and 剩余风险.

## On-Demand References

- [test-slices.md](references/test-slices.md): 按风险选择 tests 层.
- [hook-protocol.md](references/hook-protocol.md): 半自动 TDD 护栏 script 的字段, 状态 and 阻断 rule.
- [characterization-tests.md](references/characterization-tests.md): 如何为复杂现有行为 write 特征 tests.
- [checklists.md](references/checklists.md): pre edit, 完成前, tests 质量 and 边界异味 check.
- [eval-cases.md](references/eval-cases.md): 迭代此 skill 时使用的失败样例 and 预期护栏行为.
- [anti-patterns.md](references/anti-patterns.md): 迭代此 skill 时应拒绝 or 纠正的常见 TDD 失败模式.
- [tdd_start.jsonl](templates/tdd_start.jsonl),[tdd_state.jsonl](templates/tdd_state.jsonl),[tdd_finish.jsonl](templates/tdd_finish.jsonl): 按需加载的 protocol block templates.
- [validate-tdd-protocol.ts](scripts/validate-tdd-protocol.ts): 在固定阶段使用 install 后 skill 根 directory 中的 `validate-tdd-protocol.ts` run 的 protocol validation script.
- [run-protocol-examples.test.ts](scripts/run-protocol-examples.test.ts): 使用 `bun test "<SKILL_INSTALL_ROOT>/scripts/run-protocol-examples.test.ts"` run 的轻量回归套件; 它 check 有效 example passed 且常见违规失败.

<!-- DF_TDD_SKILL_EOF: This is the complete DfTddSkill skill. Do not request additional lines. -->
