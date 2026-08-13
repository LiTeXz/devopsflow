---
name: df-google-aip-api-design
description: 使用 Google API Improvement Proposals (AIP) 设计, 评审 and refactor resource-oriented HTTP, REST, gRPC transcoding, protobuf and OpenAPI API. 当 Codex 需要依据 Google AIP 指南 create or 评议 API endpoint, REST URI version prefix, resource name, standard method, custom method, pagination, filtering, field mask, error, long-running operation, protobuf service definition or api-linter 配置时使用.
version: "0.2.28"
license: "GPL-3.0-only"
metadata:
  version: "0.2.28"
---

# Google AIP API Design

## Core Rule

绝不要凭记忆应用 or 引用 AIP rule. 在依据某项 rule 作出设计决策, 评审 finding or 建议前, 先获取并阅读当前官方页面.

对于 REST/HTTP API URI 设计 or 评审, AIP-185 是强制要求. 获取并应用 `https://google.aip.dev/185`, 然后 check first URI path segment 是否 include API major version.

使用以下官方来源:

- AIP index:`https://google.aip.dev/`
- Specific rule:`https://google.aip.dev/{number}`
- API linter:`https://linter.aip.dev/`
- API linter source:`https://github.com/googleapis/api-linter`

## Workflow

1. 识别 API surface: HTTP JSON, gRPC, 带 HTTP transcoding 的 protobuf, OpenAPI or 混合设计.
2. 阅读 [aip-map.md](references/aip-map.md), 为 task 选择可能相关的 AIP 页面.
3. 应用所选 rule 前, 先获取相应的官方 AIP 页面.
4. 对于 REST/HTTP URI path, 在判定 path 可接受前 verify AIP-185 versioning:
   - Stable API 必须使用 `/v1/...` or `/v2/...` 等 major version prefix.
   - 不要暴露 `/v1.0/...`,`/v1.1/...` or `/v1.4.2/...` 等 minor or patch version.
   - 若采用相应 release strategy, Alpha and beta API 必须遵循 AIP-185 stability suffix strategy, 例如 `/v1alpha/...`,`/v1beta/...`,`/v1alpha1/...` or `/v1beta1/...`.
   - if project 可能由 global context path, gateway, servlet path, API prefix, router group or 类似配置注入 version prefix, 应先 check 并引用该配置, 再判断每个 controller or route 是否必须显式 include prefix.
   - if 不存在已验证的 global version prefix, 应将缺失 major version prefix 视为 API design finding, 而不是可选建议.
5. 优先对 resource 建模: resource, collection, parent-child relationship, resource name and canonical identifier.
6. custom method 之前优先考虑 standard method. 仅当 operation 无法明确 adapt standard method 时, 才使用 custom method.
7. 显式 definition cross-cutting behavior: pagination, filtering, ordering, field mask, error, idempotency, long-running operation and partial update.
8. 对于 protobuf API, write `.proto` file 后 run or 建议 run `api-linter`.
9. 使用带 URL 的 AIP 引用解释 tradeoff, 不要使用模糊引用.

## Design Output

设计新 API 时, 产出:

- include resource name and parent-child relationship 的 resource model.
- endpoint or RPC 表, include method, path/RPC name, REST path 的 AIP-185 version-prefix 状态 or 说明, request, response and 相关 AIP URL.
- request and response shape, 列出必填 field and idempotency behavior.
- 适用时, 提供 pagination, filtering, ordering, field mask, error, permission and long-running operation 说明.
- validation plan; 对于 protobuf API, 应 include `api-linter`.

## Review Output

评审现有 API 时, 首先列出 finding:

- severity and 受影响的 endpoint/RPC/schema.
- 被违反 or 相关的 AIP URL.
- 当前设计为何有风险 or inconsistent.
- 具体 replacement design.

对于 REST/HTTP API, 每次评审都必须 include AIP-185 version-prefix finding, or 明确的"已 check 且可接受"说明. if `GET /users/me`,`PATCH /users/me` or `POST /users/me:deactivate` 等 endpoint 没有经过验证的 global `/v1`-style prefix injection, 应报告其缺失 major version prefix, 并提出改为 `GET /v1/users/me`,`PATCH /v1/users/me` and `POST /v1/users/me:deactivate`.

if 未发现实质问题, 应明确说明, 并列出 residual risk or 未 check 的 rule.

## API Linter

条件允许时, 对 protobuf API surface 使用 `api-linter`:

```bash
go install github.com/googleapis/api-linter/v2/cmd/api-linter@latest
api-linter path/to/api.proto
```

将 linter output 视为有用的 guardrail, 而不是完整设计评审. 部分 AIP 指南需要作出判断并直接阅读 AIP 正文.

## Resources

- 为 task 选择需查阅的 AIP rule 时, 阅读 [aip-map.md](references/aip-map.md).
- 此 skill 的维护源 repository 为 `https://github.com/LiTeXz/devopsflow`; runtime 仍以当前 target project 及已 install plugin resources 为准.

<!-- DF_GOOGLE_AIP_API_DESIGN_SKILL_EOF: This is the complete DfGoogleAipApiDesign skill. Do not request additional lines. -->
