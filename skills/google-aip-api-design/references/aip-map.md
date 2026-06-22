# AIP Selection Map

Use this map to select official AIP pages to fetch from `https://google.aip.dev/{number}`. Do not treat this file as a substitute for the official pages.

## Start Here

- API-wide design principles: AIP-121 resource-oriented design
- Resource names and identifiers: AIP-122 resource names, AIP-123 resource types
- Resource relationships: AIP-124 resource association
- Standard fields and comments: AIP-140+ field guidance, AIP-192 documentation

## Standard Methods

- List methods: AIP-132
- Get methods: AIP-131
- Create methods: AIP-133
- Update methods: AIP-134
- Delete methods: AIP-135
- Custom methods: AIP-136

Prefer standard methods unless the operation is clearly not CRUD-like.

## HTTP and Transcoding

- REST API versioning: AIP-185 is mandatory for REST/HTTP URI design and review. Check that the first URI path segment contains the major version.
- HTTP and gRPC transcoding: AIP-127
- Resource-oriented method naming: AIP-121, AIP-131 through AIP-136
- Long-running operations over HTTP/gRPC: AIP-151

For pure HTTP JSON APIs, adapt the resource-oriented parts of the AIP guidance while still checking each cited rule for protobuf-specific assumptions. Treat REST URI version-prefix review as required, not optional: stable paths should begin with `/v1/...`, `/v2/...`, and similar major version prefixes; alpha/beta paths should follow AIP-185 suffix guidance such as `/v1alpha/...` or `/v1beta/...`; minor or patch prefixes such as `/v1.0/...`, `/v1.1/...`, or `/v1.4.2/...` are design problems. If a framework, gateway, servlet context path, router group, or API prefix configuration may inject the version segment globally, inspect that configuration before deciding whether route declarations need an explicit version.

## Collections and Query Behavior

- Pagination: AIP-158
- Filtering: AIP-160
- Ordering: AIP-132 list method guidance, then check current AIP index for dedicated ordering guidance
- Field masks and partial responses/updates: AIP-157 and AIP-161 as applicable

## Mutations and Consistency

- Update semantics: AIP-134
- Delete semantics: AIP-135
- Declarative-friendly resources: AIP-128, AIP-148, and related declarative AIPs when relevant
- Idempotency and request identifiers: check create/update/delete method AIPs and current AIP index

## Errors and Operations

- Errors: AIP-193
- Long-running operations: AIP-151
- Common operation metadata: check AIP-151 and current AIP index

## Protobuf Schema Design

- Field behavior annotations: AIP-203
- Resource annotations: AIP-123 and AIP-127
- Comments and documentation: AIP-192
- Backwards compatibility: check current AIP index for compatibility-related rules

## Review Checklist

For every endpoint, RPC, or schema under review:

1. Is the primary concept a resource with a stable resource name?
2. Does the method fit a standard method before becoming custom?
3. For REST/HTTP paths, does the first path segment include an AIP-185 major version prefix, or is there a verified global prefix injection configuration?
4. Is the HTTP method and path consistent with the resource and operation?
5. Are request and response messages named predictably?
6. Are pagination, filtering, ordering, and field masks present only where useful and shaped consistently?
7. Are mutations explicit about idempotency, validation, partial update behavior, and error cases?
8. Are long-running operations represented with the expected operation shape?
9. Are errors mapped to standard status codes and structured details where appropriate?
10. For protobuf APIs, does `api-linter` pass or are suppressions justified?
