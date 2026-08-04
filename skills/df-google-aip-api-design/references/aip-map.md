# AIP Selection Map

使用此 map 选择要从 `https://google.aip.dev/{number}` 获取的官方 AIP 页面。不要将此文件视为官方页面的替代品。

## Start Here

- API-wide design principle：AIP-121 resource-oriented design
- Resource name 与 identifier：AIP-122 resource name、AIP-123 resource type
- Resource relationship：AIP-124 resource association
- Standard field 与 comment：AIP-140+ field guidance、AIP-192 documentation

## Standard Methods

- List method：AIP-132
- Get method：AIP-131
- Create method：AIP-133
- Update method：AIP-134
- Delete method：AIP-135
- Custom method：AIP-136

除非 operation 明确不是 CRUD-like，否则优先使用 standard method。

## HTTP and Transcoding

- REST API versioning：AIP-185 是 REST/HTTP URI 设计与评审的强制要求。检查第一个 URI path segment 是否包含 major version。
- HTTP 与 gRPC transcoding：AIP-127
- Resource-oriented method naming：AIP-121、AIP-131 至 AIP-136
- 基于 HTTP/gRPC 的 long-running operation：AIP-151

对于纯 HTTP JSON API，在适配 AIP 指南中 resource-oriented 部分的同时，仍需检查每项引用规则是否包含 protobuf-specific assumption。将 REST URI version-prefix 评审视为必需而非可选：stable path 应以 `/v1/...`、`/v2/...` 等 major version prefix 开头；alpha/beta path 应遵循 AIP-185 suffix 指南，例如 `/v1alpha/...` 或 `/v1beta/...`；`/v1.0/...`、`/v1.1/...` 或 `/v1.4.2/...` 等 minor 或 patch prefix 属于设计问题。如果 framework、gateway、servlet context path、router group 或 API prefix 配置可能全局注入 version segment，应先检查该配置，再判断 route declaration 是否需要显式 version。

## Collections and Query Behavior

- Pagination：AIP-158
- Filtering：AIP-160
- Ordering：AIP-132 list method 指南，然后检查当前 AIP index 中专门的 ordering 指南
- Field mask 与 partial response/update：按需使用 AIP-157 和 AIP-161

## Mutations and Consistency

- Update 语义：AIP-134
- Delete 语义：AIP-135
- Declarative-friendly resource：AIP-128、AIP-148，以及相关时的 declarative AIP
- Idempotency 与 request identifier：检查 create/update/delete method AIP 和当前 AIP index

## Errors and Operations

- Error：AIP-193
- Long-running operation：AIP-151
- Common operation metadata：检查 AIP-151 和当前 AIP index

## Protobuf Schema Design

- Field behavior annotation：AIP-203
- Resource annotation：AIP-123 和 AIP-127
- Comment 与 documentation：AIP-192
- Backwards compatibility：检查当前 AIP index 中与 compatibility 相关的规则

## Review Checklist

对于每个受评审的 endpoint、RPC 或 schema：

1. 主要概念是否为具有稳定 resource name 的 resource？
2. method 在成为 custom method 前，是否适合某个 standard method？
3. 对于 REST/HTTP path，第一个 path segment 是否包含 AIP-185 major version prefix，或是否存在已验证的 global prefix injection 配置？
4. HTTP method 和 path 是否与 resource 和 operation 一致？
5. request 与 response message 的命名是否可预测？
6. pagination、filtering、ordering 和 field mask 是否仅在有用处出现，且 shape 保持一致？
7. mutation 是否明确说明 idempotency、validation、partial update 行为和 error case？
8. long-running operation 是否采用预期的 operation shape 表示？
9. error 是否按适用情况映射到 standard status code 和 structured detail？
10. 对于 protobuf API，`api-linter` 是否通过，或 suppression 是否有充分理由？
