---
name: df-google-aip-api-design
description: 使用 Google API Improvement Proposals (AIP) 设计、评审和重构 resource-oriented HTTP、REST、gRPC transcoding、protobuf 与 OpenAPI API。当 Codex 需要依据 Google AIP 指南创建或评议 API endpoint、REST URI version prefix、resource name、standard method、custom method、pagination、filtering、field mask、error、long-running operation、protobuf service definition 或 api-linter 配置时使用。
---

# Google AIP API Design

## Core Rule

绝不要凭记忆应用或引用 AIP 规则。在依据某项规则作出设计决策、评审 finding 或建议前，先获取并阅读当前官方页面。

对于 REST/HTTP API URI 设计或评审，AIP-185 是强制要求。获取并应用 `https://google.aip.dev/185`，然后检查第一个 URI path segment 是否包含 API major version。

使用以下官方来源：

- AIP index：`https://google.aip.dev/`
- Specific rule：`https://google.aip.dev/{number}`
- API linter：`https://linter.aip.dev/`
- API linter source：`https://github.com/googleapis/api-linter`

## Workflow

1. 识别 API surface：HTTP JSON、gRPC、带 HTTP transcoding 的 protobuf、OpenAPI 或混合设计。
2. 阅读 [aip-map.md](references/aip-map.md)，为任务选择可能相关的 AIP 页面。
3. 应用所选规则前，先获取相应的官方 AIP 页面。
4. 对于 REST/HTTP URI path，在判定 path 可接受前校验 AIP-185 versioning：
   - Stable API 必须使用 `/v1/...` 或 `/v2/...` 等 major version prefix。
   - 不要暴露 `/v1.0/...`、`/v1.1/...` 或 `/v1.4.2/...` 等 minor 或 patch version。
   - 若采用相应 release strategy，Alpha 和 beta API 必须遵循 AIP-185 stability suffix strategy，例如 `/v1alpha/...`、`/v1beta/...`、`/v1alpha1/...` 或 `/v1beta1/...`。
   - 如果项目可能通过 global context path、gateway、servlet path、API prefix、router group 或类似配置注入 version prefix，应先检查并引用该配置，再判断每个 controller 或 route 是否必须显式包含 prefix。
   - 如果不存在已验证的 global version prefix，应将缺失 major version prefix 视为 API design finding，而不是可选建议。
5. 优先对 resource 建模：resource、collection、parent-child relationship、resource name 和 canonical identifier。
6. custom method 之前优先考虑 standard method。仅当 operation 无法明确适配 standard method 时，才使用 custom method。
7. 显式定义 cross-cutting behavior：pagination、filtering、ordering、field mask、error、idempotency、long-running operation 和 partial update。
8. 对于 protobuf API，编写 `.proto` 文件后运行或建议运行 `api-linter`。
9. 使用带 URL 的 AIP 引用解释 tradeoff，不要使用模糊引用。

## Design Output

设计新 API 时，产出：

- 包含 resource name 与 parent-child relationship 的 resource model。
- endpoint 或 RPC 表，包含 method、path/RPC name、REST path 的 AIP-185 version-prefix 状态或说明、request、response 和相关 AIP URL。
- request 与 response shape，包括 required field 和 idempotency behavior。
- 适用时，提供 pagination、filtering、ordering、field mask、error、permission 和 long-running operation 说明。
- validation plan；对于 protobuf API，应包含 `api-linter`。

## Review Output

评审现有 API 时，首先列出 finding：

- severity 和受影响的 endpoint/RPC/schema。
- 被违反或相关的 AIP URL。
- 当前设计为何有风险或不一致。
- 具体 replacement design。

对于 REST/HTTP API，每次评审都必须包含 AIP-185 version-prefix finding，或明确的“已检查且可接受”说明。如果 `GET /users/me`、`PATCH /users/me` 或 `POST /users/me:deactivate` 等 endpoint 没有经过验证的 global `/v1`-style prefix injection，应报告其缺失 major version prefix，并提出改为 `GET /v1/users/me`、`PATCH /v1/users/me` 和 `POST /v1/users/me:deactivate`。

如果未发现实质问题，应明确说明，并列出 residual risk 或未检查的规则。

## API Linter

条件允许时，对 protobuf API surface 使用 `api-linter`：

```bash
go install github.com/googleapis/api-linter/v2/cmd/api-linter@latest
api-linter path/to/api.proto
```

将 linter 输出视为有用的 guardrail，而不是完整设计评审。部分 AIP 指南需要作出判断并直接阅读 AIP 正文。

## Resources

- 为任务选择需查阅的 AIP 规则时，阅读 [aip-map.md](references/aip-map.md)。
- 此 skill 维护于 `https://github.com/LiTeXz/devopsflow/tree/main/skills/df-google-aip-api-design`。
