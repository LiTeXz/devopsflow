---
name: df-ddd-to-tdd-handoff
description: "将已确认的 DDD 事件风暴产物与需求可追踪关系转换为可执行、与语言无关的 TDD 实现切片。在 df-ddd-event-storming-design 已产出并确认需求、命令、事件、聚合、策略、不变量、读模型或关系，且 Codex 需要测试、实现计划或开发顺序时使用。"
---

# DDD To TDD Handoff

使用此 skill 将领域设计衔接到测试优先开发。它不能替代 DDD 建模或 TDD 执行。

## Inputs

读取聊天中或 `event-storming/` 中已有的已确认 DDD 产物：

- 需求输入以及已有的需求 ID
- 问题边界和术语表
- 领域事件
- 命令和参与者
- 策略和流程管理器
- 聚合、状态、规则和不变量
- 读模型和投影事件
- 关系和外部系统
- 未解决的假设

如果 DDD 设计尚未确认，不要创建实现切片。返回 `df-ddd-event-storming-design` 完成确认。

## Mapping Rules

- 需求项 -> 一个或多个切片的可追踪锚点和验收意图。
- 领域事件 -> 预期的可观察行为测试。
- 命令 -> 应用服务、用例或聚合命令处理器测试。
- 聚合不变量 -> 领域单元测试。
- 策略 -> 事件到命令的编排测试。
- 流程管理器 -> 包含等待、恢复和幂等场景的有状态工作流测试。
- 读模型 -> 投影或查询测试。
- 外部系统 -> 契约、适配器或集成接缝测试。
- 关系依赖 -> 测试中的前置条件、既有事实或状态准备。
- 具有业务含义的失败事件 -> 明确的行为切片；技术失败 -> 适配器或基础设施切片。
- 利益相关者或参与者的权限 -> 测试或计划中必须保留的授权或能力假设，但不选择具体框架。
- 触发或后续行 -> 策略、流程管理器、投影、集成或明确的非领域关注点。

选择能够保护风险的最窄测试层。仅当行为无法在更窄边界上观察时才扩大测试范围。

除非用户提出要求，或现有仓库约定已经是实现计划的一部分，否则不要引入语言、框架、包、HTTP、数据库或 UI 结构。此交接可以使用领域模型、应用命令、查询或投影、流程管理器、端口或适配器以及契约测试等通用边界名称。

## Handoff Workflow

1. 列出正在使用的 DDD 输入。
2. 存在需求 ID 时，列出需求可追踪覆盖情况。
3. 在不虚构框架结构的前提下识别实现边界。
4. 按业务顺序创建小型 TDD 切片。
5. 为每个切片注明：
   - 已有的需求 ID
   - 行为
   - 来源 DDD 产物
   - 测试层
   - 首个 RED 预期
   - 最小 GREEN 实现边界
   - 受保护的不变量或读模型结果
   - 依赖和未决事实
6. 仅在后续实现技术栈已知时，标记需要技术专用边界 skill 的切片。
7. 将切片传递给 `df-implementation-planning` 或 `df-tdd-skill`。

## Output Format

```markdown
# DDD to TDD Handoff

## DDD Conclusions Used

## Requirement Traceability

## Implementation Boundaries

## TDD Slices

### Slice 1: <behavior>
- 需求 ID：
- DDD 来源：
- 测试层：
- 预期 RED：
- 最小 GREEN：
- 保护的规则或读模型：
- 不应改变：
- 依赖或未决事实：

## Recommended Execution Order

## Additional Skills Required
```

## Non-Negotiable Rules

- 不要编写生产代码。
- 除非用户明确要求开始实现，否则不要直接创建测试。
- 不要把 HTTP 端点、数据库表、DTO 或页面转换为领域命令。
- 不要在此通用交接中引入框架专用实现规则。
- 不要把聚合不变量隐藏在策略或应用服务中。
- 不要虚构无法由事件投影得到的读模型而不说明缺口。
- 存在需求 ID 或已确认的需求覆盖范围时，不要遗漏它们。
- 当切片依赖可能改变模型但尚未确认的业务结论时，不要继续。

紧凑示例参见 [mapping-examples.md](references/mapping-examples.md)。

<!-- DF_DDD_TO_TDD_HANDOFF_SKILL_EOF: This is the complete DfDddToTddHandoff skill. Do not request additional lines. -->
