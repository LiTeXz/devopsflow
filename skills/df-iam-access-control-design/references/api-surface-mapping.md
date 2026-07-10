# API Surface Mapping

## Contents

- Mapping invariant
- Resource-first design
- REST mapping
- GraphQL mapping
- gRPC and protobuf mapping
- Custom actions
- Review procedure

## Mapping Invariant

Authorization semantics belong to the permission catalog, not to a transport. If REST, GraphQL, and gRPC expose the same action on the same resource, they must reference the same permission identifier.

Never derive authorization solely from an HTTP verb, resolver name, RPC name, URL fragment, or protobuf package at runtime. Maintain an explicit operation-to-permission mapping that is reviewable and fails closed.

## Resource-First Design

1. Apply current AIP-121 guidance to identify resources and standard methods.
2. Apply current AIP-122 guidance to define canonical resource names and scopes.
3. Apply current AIP-127 guidance when protobuf uses HTTP transcoding.
4. Name the permission from the stable service, resource type, and authorization action.
5. Map every transport operation to that permission.

Fetch the current AIP pages before citing them. Use `df-google-aip-api-design` for broader API design or review work.

## Cross-Protocol Example

| Surface | Operation | Canonical permission | Resource extraction |
| --- | --- | --- | --- |
| REST | `GET /v1/publishers/{publisher}/books/{book}` | `library.books.get` | Path resource name |
| GraphQL | `Query.book(id)` | `library.books.get` | Resolver-loaded book name |
| gRPC | `LibraryService.GetBook` | `library.books.get` | `GetBookRequest.name` |
| REST transcoding | `GetBook` with `google.api.http` | `library.books.get` | Transcoded `name` field |

The transport changes; the permission does not.

## REST Mapping

- Map resource-oriented standard methods to `get`, `list`, `create`, `update`, and `delete` where their authorization semantics match.
- Keep HTTP paths and API versions out of permission identifiers.
- Extract the canonical resource scope from validated path or request data before authorization.
- For batch operations, document whether one collection permission or per-resource checks apply; never assume wildcard permission semantics.
- Return the target platform's permission-denied response without revealing inaccessible resource details.

## GraphQL Mapping

- Map protected query and mutation resolvers explicitly.
- Use the underlying resource action, not `query`, `mutation`, field names, or schema type names, as the permission verb.
- Declare field-level permissions only when resolving the field exposes a separately protected action or resource.
- Prevent aliases, fragments, batching, and nested resolvers from bypassing a required check.
- Apply authorization after canonical resource identification and before returning protected data.

## gRPC and Protobuf Mapping

- Map the fully qualified RPC method to a catalog permission in service configuration or interceptor metadata.
- Use the same mapping for native gRPC and HTTP-transcoded calls.
- Extract resource names from the request fields defined by the RPC contract.
- Keep protobuf package names, RPC casing, and transport annotations out of permission identifiers.
- Run `api-linter` when the protobuf API adopts Google AIP conventions, but treat permission mapping as an additional authorization review.

## Custom Actions

Use a domain verb such as `publish`, `archive`, `cancel`, or `actAs` only when the action is not a standard resource method. Reuse it across all protocol representations of that action.

Do not create these variants:

```text
rest.books.archive
graphql.books.archive
grpc.books.archive
library.books.archiveV1
```

Use only:

```text
library.books.archive
```

## Review Procedure

1. Enumerate every protected REST route, GraphQL resolver, gRPC RPC, and transcoding rule.
2. Resolve each operation to a canonical resource and action.
3. Confirm the mapped identifier passes the bundled validator.
4. Detect operations with no mapping, multiple competing names, aliases, or protocol-specific names.
5. Confirm missing metadata and extraction failures deny access.
6. Compare equivalent actions across protocols and require identical permissions.
7. Record validation commands and unresolved runtime limitations.
