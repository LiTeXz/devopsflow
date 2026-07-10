---
name: df-iam-access-control-design
description: "Design and review strict Google Cloud IAM-style authorization catalogs for RBAC and ABAC across REST, GraphQL, gRPC, protobuf, and mixed API surfaces. Use when Codex needs to name permissions or roles, define role bindings and CEL conditions, map API operations to authorization checks, migrate legacy colon-delimited permissions, or prevent multiple authorization naming schemes."
---

# IAM Access Control Design

Design one authorization vocabulary for every API surface. Use Google Cloud IAM's separation of permissions, roles, principals, resources, and conditions while enforcing this skill's stricter platform-neutral identifier subset.

## Core Rules

1. Name every permission as `service.resource.verb`.
2. Name every role as `roles/service.role`.
3. Grant roles to principals; never grant standalone permissions directly.
4. Keep resource scope and ABAC attributes outside permission identifiers.
5. Express ABAC conditions only with CEL on a role binding.
6. Map REST operations, GraphQL resolvers, and gRPC RPCs to the same permission catalog.
7. Reject colon-delimited permissions, wildcards, aliases, dual-read compatibility, and protocol-specific variants.
8. Fail closed when a permission is missing, malformed, unmapped, or legacy-formatted.

Read [references/authorization-model.md](references/authorization-model.md) before defining identifiers, roles, or bindings. Read [references/api-surface-mapping.md](references/api-surface-mapping.md) when REST, GraphQL, gRPC, protobuf, or OpenAPI is involved. Read [casures/why-google-iam-style.md](casures/why-google-iam-style.md) when explaining or reviewing the mandatory cut from legacy RBAC naming.

## Source Discipline

Fetch current official pages before claiming a rule comes from Google Cloud IAM or Google AIP:

- `https://docs.cloud.google.com/iam/docs/roles-permissions`
- `https://docs.cloud.google.com/iam/docs/roles-overview`
- `https://docs.cloud.google.com/iam/docs/conditions-overview`
- `https://google.aip.dev/121`
- `https://google.aip.dev/122`
- `https://google.aip.dev/127`

Label rules accurately:

- Google Cloud IAM defines permissions as `SERVICE.RESOURCE.VERB`, roles as permission collections, and IAM Conditions as attribute-based expressions attached to policy constructs.
- This skill deliberately narrows segment casing, role names, CEL usage, migration behavior, and cross-protocol mapping. Present those as project policy, not as undocumented Google requirements.

## Workflow

1. Inventory resources and operations before naming permissions.
2. Select one stable service namespace owned by the authorization catalog, not by a transport or deployment environment.
3. Create atomic permission identifiers and validate them with the bundled script.
4. Map each protected API operation to exactly one or more catalog permissions explicitly.
5. Compose least-privilege roles from validated permissions.
6. Bind principals to roles at a resource scope.
7. Add an optional CEL condition to the binding when attributes refine access.
8. Review for legacy syntax, aliases, wildcard grants, hidden conditions, and unmapped operations.
9. Report incompatibilities instead of inventing a fallback DSL or permission syntax.

## Required Design Output

Produce these artifacts for a new design or migration:

1. Permission catalog: identifier, resource, action, semantics, and protected operations.
2. Role catalog: role identifier, purpose, and exact permission set.
3. Binding model: principal, role, resource scope, and optional CEL condition.
4. API mapping table: protocol operation or resolver, permission, resource extraction, and deny behavior.
5. Compliance findings: every legacy name, alias, wildcard, condition leakage, or missing mapping.
6. Validation evidence: command, exit code, and files checked.

Do not silently translate a legacy identifier. Propose its single canonical replacement and require all producers and consumers to switch to it.

## Validation

Store permission or role identifiers in separate line-oriented catalogs. Ignore blank lines and lines beginning with `#`.

```bash
bun skills/df-iam-access-control-design/scripts/validate-authorization-identifiers.ts --kind permission --input permissions.txt
bun skills/df-iam-access-control-design/scripts/validate-authorization-identifiers.ts --kind role --input roles.txt
```

Treat a non-zero exit code as blocking. Do not suppress or downgrade legacy-format findings.

## Review Checklist

- Does every permission match exactly one canonical identifier?
- Is the service namespace independent of REST, GraphQL, gRPC, tenant, region, and environment?
- Are resources and verbs lowerCamelCase and semantically stable?
- Are roles collections rather than disguised permissions?
- Are scope and CEL conditions stored on bindings rather than encoded into names?
- Does every protected API operation map explicitly to the shared catalog?
- Are aliases, wildcards, fallback translations, and legacy colon names absent?
- Does missing or invalid authorization metadata deny access?
