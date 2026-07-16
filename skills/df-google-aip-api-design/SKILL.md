---
name: df-google-aip-api-design
description: Design, review, and refactor resource-oriented HTTP, REST, gRPC transcoding, protobuf, and OpenAPI APIs using Google API Improvement Proposals (AIP). Use when Codex needs to create or critique API endpoints, REST URI version prefixes, resource names, standard methods, custom methods, pagination, filtering, field masks, errors, long-running operations, protobuf service definitions, or api-linter setup against Google AIP guidance.
---

# Google AIP API Design

## Core Rule

Never apply or cite an AIP rule from memory. Fetch and read the current official page before making a design decision, review finding, or recommendation based on that rule.

For REST/HTTP API URI design or review, AIP-185 is mandatory. Fetch and apply `https://google.aip.dev/185`, then check that the first URI path segment carries the API major version.

Use these official sources:

- AIP index: `https://google.aip.dev/`
- Specific rule: `https://google.aip.dev/{number}`
- API linter: `https://linter.aip.dev/`
- API linter source: `https://github.com/googleapis/api-linter`

## Workflow

1. Identify the API surface: HTTP JSON, gRPC, protobuf with HTTP transcoding, OpenAPI, or a mixed design.
2. Read `references/aip-map.md` to choose the likely AIP pages for the task.
3. Fetch the selected official AIP pages before applying them.
4. For REST/HTTP URI paths, verify AIP-185 versioning before judging the path acceptable:
   - Stable APIs must use a major version prefix such as `/v1/...` or `/v2/...`.
   - Do not expose minor or patch versions such as `/v1.0/...`, `/v1.1/...`, or `/v1.4.2/...`.
   - Alpha and beta APIs must follow the AIP-185 stability suffix strategy, such as `/v1alpha/...`, `/v1beta/...`, `/v1alpha1/...`, or `/v1beta1/...` when that release strategy applies.
   - If the project may inject a version prefix through a global context path, gateway, servlet path, API prefix, router group, or similar configuration, inspect and cite that configuration before deciding whether each controller or route must include the prefix explicitly.
   - If no verified global version prefix exists, treat a missing major version prefix as an API design finding, not an optional suggestion.
5. Model resources first: resources, collections, parent-child relationships, resource names, and canonical identifiers.
6. Prefer standard methods before custom methods. Use custom methods only when the operation does not fit a standard method cleanly.
7. Define cross-cutting behavior explicitly: pagination, filtering, ordering, field masks, errors, idempotency, long-running operations, and partial updates.
8. For protobuf APIs, run or recommend `api-linter` after writing `.proto` files.
9. Explain tradeoffs with AIP citations by URL, not vague references.

## Design Output

When designing a new API, produce:

- Resource model with resource names and parent-child relationships.
- Endpoint or RPC table with method, path/RPC name, AIP-185 version-prefix status or note for REST paths, request, response, and relevant AIP URLs.
- Request and response shapes, including required fields and idempotency behavior.
- Notes for pagination, filtering, ordering, field masks, errors, permissions, and long-running operations when applicable.
- Validation plan, including `api-linter` for protobuf APIs.

## Review Output

When reviewing an existing API, lead with findings:

- Severity and affected endpoint/RPC/schema.
- The violated or relevant AIP URL.
- Why the current design is risky or inconsistent.
- A concrete replacement design.

For REST/HTTP APIs, every review must include an AIP-185 version-prefix finding or an explicit "checked and acceptable" note. If endpoints such as `GET /users/me`, `PATCH /users/me`, or `POST /users/me:deactivate` have no verified global `/v1`-style prefix injection, report them as missing a major version prefix and propose `GET /v1/users/me`, `PATCH /v1/users/me`, and `POST /v1/users/me:deactivate`.

If no material issues are found, say so and list residual risks or rules not checked.

## API Linter

Use `api-linter` for protobuf API surfaces when possible:

```bash
go install github.com/googleapis/api-linter/v2/cmd/api-linter@latest
api-linter path/to/api.proto
```

Treat linter output as a useful guardrail, not the full design review. Some AIP guidance requires judgment and direct reading of the AIP text.

## Resources

- Read `references/aip-map.md` when selecting which AIP rules to consult for a task.
- This skill is maintained at `https://github.com/LiTeXz/devopsflow/tree/main/skills/df-google-aip-api-design`.
