# Authorization Model

## Contents

- Normative vocabulary
- Identifier grammar
- Permission semantics
- Roles and bindings
- ABAC conditions
- Migration and failure behavior
- Examples

## Normative Vocabulary

- **Permission**: one atomic action on one resource type in one service.
- **Role**: a named collection of permissions used for RBAC assignment.
- **Principal**: an authenticated identity or principal set. Keep its canonical identifier in a typed field; it is not a permission name.
- **Resource scope**: the resource name or hierarchy node at which a binding applies.
- **Binding**: the association between one or more principals, one role, one resource scope, and an optional condition.
- **Condition**: a CEL boolean expression that refines when a binding applies.

## Identifier Grammar

### Permissions

Canonical form:

```text
service.resource.verb
```

Validation grammar:

```regex
^[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$
```

- `service` is a stable lowercase product or bounded-service namespace.
- `resource` is the lowerCamelCase resource type, normally plural to match a collection.
- `verb` is a lowerCamelCase action. Prefer `get`, `list`, `create`, `update`, and `delete` for standard resource methods; use a precise domain verb for a genuine custom action.
- Use exactly three segments. Do not add tenant, environment, region, protocol, API version, or role segments.

### Roles

Canonical form:

```text
roles/service.role
```

Validation grammar:

```regex
^roles/[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$
```

Name a role after a stable responsibility such as `viewer`, `publisher`, or `serviceAccountAdmin`. A role is never an alternate spelling of a permission.

## Permission Semantics

- Make permissions atomic and affirmative. Authorization checks ask whether the caller has a permission; negative behavior belongs in deny policy or condition evaluation.
- Reuse one permission for the same business action across transports.
- Create a new permission only when the resource or authorization-relevant action differs.
- Do not encode row filters, ownership, tenancy, time windows, network zones, resource tags, or deployment environments in a permission.
- Do not use `*`, prefix matching, implicit parent permissions, or aliases.

## Roles and Bindings

Represent assignments with typed fields so identifiers cannot be confused:

```yaml
binding:
  principals:
    - "principal://identity.example/users/alice"
  role: "roles/library.viewer"
  scope: "publishers/acme"
  condition:
    title: "business-hours"
    description: "Allow access only during approved hours"
    expression: "request.time.getHours() >= 8 && request.time.getHours() < 18"
```

- Omit `condition` for unconditional RBAC.
- Add `condition` for ABAC; do not mint a conditional permission or role variant.
- Keep the binding's scope as a canonical API resource name following the target API's resource model.
- Grant the smallest role at the narrowest practical scope.

## ABAC Conditions

- Use CEL as the only condition language.
- Require an expression that evaluates to boolean.
- Give every condition a stable title and an operationally useful description.
- Permit only attributes supported and documented by the target policy engine.
- Treat evaluation errors or unavailable required attributes as denial.
- If the target cannot execute CEL, report the incompatibility. Do not introduce a second DSL or silently translate expressions.

## Migration and Failure Behavior

1. Inventory all permission producers, catalogs, policy stores, middleware, annotations, tests, and API mappings.
2. Assign one canonical replacement to every legacy identifier.
3. Update producers and consumers in one controlled migration boundary.
4. Remove the old identifier instead of retaining an alias or fallback lookup.
5. Reject legacy values at validation and authorization boundaries.
6. Deny access for missing, malformed, unknown, or unmapped permissions.

Do not support dual reads, dual writes, colon-to-dot conversion, case folding, wildcard expansion, or best-effort matching.

## Examples

Valid permissions:

```text
compute.instances.list
iam.serviceAccounts.actAs
cloudkms.cryptoKeyVersions.useToEncrypt
library.books.get
library.books.archive
```

Valid roles:

```text
roles/compute.viewer
roles/iam.serviceAccountAdmin
roles/library.archivist
```

Invalid identifiers:

```text
library:books:get
library.books.*
library.books.get.production
rest.books.get
graphql.books.get
library.book_records.get
roles/library:viewer
```

The first value is legacy colon syntax; the second is a wildcard; the third leaks environment; the fourth and fifth create transport namespaces; the sixth violates lowerCamelCase; the final role uses the forbidden legacy delimiter.
