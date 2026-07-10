# Why This Skill Uses One Google IAM-Style Vocabulary

The `casures/` directory name is retained as an explicit project requirement. This document records the non-negotiable reasons for the authorization model.

## Permissions Describe Actions, Not Assignments

`service.resource.verb` answers one question: which action on which resource type in which service is being authorized? It does not encode who receives access, where the grant applies, or under which attributes it is valid.

Traditional strings such as `admin:user:read` mix role, resource, and action. Different teams then reinterpret each segment, add more segments, reverse their order, or introduce wildcards. The same business action accumulates incompatible names.

## Roles Must Remain Collections

Google Cloud IAM models roles as collections of permissions and grants roles to principals. Keeping that separation allows least-privilege roles to evolve without renaming API actions. A role name therefore cannot substitute for a permission name or appear inside one.

## ABAC Must Refine Bindings

Attributes such as tenant, environment, ownership, request time, network, and resource tags change when a grant applies. They do not change the underlying action. CEL conditions belong on bindings so RBAC and ABAC share the same permission catalog.

Encoding attributes into names creates unbounded variants such as `books.get.production`, `books.get.tenantA`, or `books.get.businessHours`. Those variants are forbidden.

## API Protocols Must Not Create Namespaces

REST routes, GraphQL resolvers, and gRPC RPCs are delivery surfaces. A transport migration must not require policy migration. Explicitly mapping every surface to one catalog prevents `rest.*`, `graphql.*`, and `grpc.*` permission families from diverging.

## A Stricter Subset Prevents Drift

Google Cloud documents the broad `SERVICE.RESOURCE.VERB` shape. This skill deliberately adds exact casing, role grammar, CEL-only conditions, explicit API mappings, and fail-closed migration rules. The stricter subset makes identifiers mechanically verifiable and prevents teams from treating examples as optional style advice.

## No Compatibility Alias

Accepting both `a:b:c` and `a.b.c` preserves two authorization languages indefinitely. Automatic conversion also hides ambiguous segment meanings and can grant the wrong action. Migration must choose one canonical replacement, update all controlled producers and consumers, and then reject the legacy value.

## Security Consequence

Malformed, unknown, legacy, or unmapped authorization data must deny access. Logging a warning while continuing, guessing a permission, falling back to a broad role, or skipping the check turns naming drift into an authorization bypass.
