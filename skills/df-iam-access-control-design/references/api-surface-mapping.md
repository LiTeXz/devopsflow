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

授权语义属于 permission catalog，而不属于 transport。如果 REST、GraphQL 和 gRPC 暴露同一 resource 上的同一 action，它们必须引用同一个 permission identifier。

绝不在运行时仅依据 HTTP verb、resolver name、RPC name、URL fragment 或 protobuf package 推导授权。维护可评审且 fail closed 的显式 operation-to-permission mapping。

## Resource-First Design

1. 应用当前 AIP-121 指南识别 resource 与 standard method。
2. 应用当前 AIP-122 指南定义 canonical resource name 与 scope。
3. protobuf 使用 HTTP transcoding 时，应用当前 AIP-127 指南。
4. 根据稳定的 service、resource type 和 authorization action 命名 permission。
5. 将每个 transport operation 映射到该 permission。

引用 AIP 前先获取其当前页面。更广泛的 API 设计或评审工作使用 `df-google-aip-api-design`。

## Cross-Protocol Example

| Surface | Operation | Canonical permission | Resource extraction |
| --- | --- | --- | --- |
| REST | `GET /v1/publishers/{publisher}/books/{book}` | `library.books.get` | path resource name |
| GraphQL | `Query.book(id)` | `library.books.get` | resolver 加载的 book name |
| gRPC | `LibraryService.GetBook` | `library.books.get` | `GetBookRequest.name` |
| REST transcoding | 使用 `google.api.http` 的 `GetBook` | `library.books.get` | transcoded `name` field |

transport 可以变化；permission 不变。

## REST Mapping

- 授权语义匹配时，将 resource-oriented standard method 映射到 `get`、`list`、`create`、`update` 和 `delete`。
- 不要将 HTTP path 和 API version 放入 permission identifier。
- 授权前，从已校验的 path 或 request data 中提取 canonical resource scope。
- 对于 batch operation，记录是应用单个 collection permission 还是 per-resource check；绝不要假设 wildcard permission 语义。
- 返回目标平台的 permission-denied response，不要泄露不可访问的 resource detail。

## GraphQL Mapping

- 显式映射受保护的 query 与 mutation resolver。
- 使用底层 resource action 作为 permission verb，而不是 `query`、`mutation`、field name 或 schema type name。
- 仅当解析 field 会暴露单独受保护的 action 或 resource 时，才声明 field-level permission。
- 防止 alias、fragment、batching 和 nested resolver 绕过必要检查。
- 在识别 canonical resource 之后、返回受保护数据之前应用授权。

## gRPC and Protobuf Mapping

- 在 service configuration 或 interceptor metadata 中，将 fully qualified RPC method 映射到 catalog permission。
- native gRPC 与 HTTP-transcoded call 使用相同 mapping。
- 从 RPC contract 定义的 request field 中提取 resource name。
- 不要将 protobuf package name、RPC casing 和 transport annotation 放入 permission identifier。
- protobuf API 采用 Google AIP 约定时运行 `api-linter`，但将 permission mapping 作为额外的授权评审。

## Custom Actions

仅当 action 不是 standard resource method 时，才使用 `publish`、`archive`、`cancel` 或 `actAs` 等 domain verb。在该 action 的所有 protocol representation 中复用同一 verb。

不要创建以下 variant：

```text
rest.books.archive
graphql.books.archive
grpc.books.archive
library.books.archiveV1
```

只能使用：

```text
library.books.archive
```

## Review Procedure

1. 枚举每个受保护的 REST route、GraphQL resolver、gRPC RPC 和 transcoding rule。
2. 将每个 operation 解析为 canonical resource 与 action。
3. 确认映射的 identifier 通过随附 validator。
4. 检测没有 mapping、存在多个冲突名称、alias 或 protocol-specific name 的 operation。
5. 确认 metadata 缺失与 extraction failure 会导致拒绝访问。
6. 比较跨 protocol 的等价 action，并要求使用相同 permission。
7. 记录 validation command 和未解决的 runtime limitation。
