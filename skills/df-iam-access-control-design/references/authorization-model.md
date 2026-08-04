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

- **Permission**：一个 service 中一个 resource type 上的 atomic action。
- **Role**：用于 RBAC assignment 的具名 permission collection。
- **Principal**：经过认证的 identity 或 principal set。将其 canonical identifier 保存在 typed field 中；它不是 permission name。
- **Resource scope**：binding 生效的 resource name 或 hierarchy node。
- **Binding**：一个或多个 principal、一个 role、一个 resource scope 与可选 condition 之间的关联。
- **Condition**：用于细化 binding 生效条件的 CEL boolean expression。

## Identifier Grammar

### Permissions

Canonical form：

```text
service.resource.verb
```

Validation grammar：

```regex
^[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$
```

- `service` 是稳定的小写 product 或 bounded-service namespace。
- `resource` 是 lowerCamelCase resource type，通常使用复数形式以匹配 collection。
- `verb` 是 lowerCamelCase action。standard resource method 优先使用 `get`、`list`、`create`、`update` 和 `delete`；真正的 custom action 使用精确的 domain verb。
- 必须使用恰好三个 segment。不要添加 tenant、environment、region、protocol、API version 或 role segment。

### Roles

Canonical form：

```text
roles/service.role
```

Validation grammar：

```regex
^roles/[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$
```

以 `viewer`、`publisher` 或 `serviceAccountAdmin` 等稳定职责命名 role。role 绝不是 permission 的另一种拼写。

## Permission Semantics

- 保持 permission 原子化且为肯定语义。授权检查询问调用方是否拥有 permission；否定行为属于 deny policy 或 condition evaluation。
- 跨 transport 的同一 business action 复用同一个 permission。
- 仅当 resource 或与授权相关的 action 不同时，才创建新 permission。
- 不要在 permission 中编码 row filter、ownership、tenancy、time window、network zone、resource tag 或 deployment environment。
- 不要使用 `*`、prefix matching、implicit parent permission 或 alias。

## Roles and Bindings

使用 typed field 表示 assignment，避免混淆 identifier：

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

- unconditional RBAC 省略 `condition`。
- ABAC 添加 `condition`；不要创建 conditional permission 或 role variant。
- binding 的 scope 应采用符合目标 API resource model 的 canonical API resource name。
- 在实际可行的最窄 scope 上授予最小 role。

## ABAC Conditions

- 仅使用 CEL 作为 condition language。
- expression 必须求值为 boolean。
- 为每个 condition 提供稳定 title 和对运维有用的 description。
- 只允许目标 policy engine 支持并记录的 attribute。
- evaluation error 或所需 attribute 不可用时，视为拒绝。
- 若目标无法执行 CEL，报告不兼容性。不要引入第二套 DSL，也不要静默转换 expression。

## Migration and Failure Behavior

1. 盘点所有 permission producer、catalog、policy store、middleware、annotation、测试和 API mapping。
2. 为每个旧式 identifier 分配一个 canonical replacement。
3. 在一个受控 migration boundary 内更新 producer 和 consumer。
4. 删除旧 identifier，不要保留 alias 或 fallback lookup。
5. 在 validation 与 authorization boundary 拒绝旧值。
6. permission 缺失、格式错误、未知或未映射时拒绝访问。

不要支持 dual read、dual write、colon-to-dot conversion、case folding、wildcard expansion 或 best-effort matching。

## Examples

Valid permissions：

```text
compute.instances.list
iam.serviceAccounts.actAs
cloudkms.cryptoKeyVersions.useToEncrypt
library.books.get
library.books.archive
```

Valid roles：

```text
roles/compute.viewer
roles/iam.serviceAccountAdmin
roles/library.archivist
```

Invalid identifiers：

```text
library:books:get
library.books.*
library.books.get.production
rest.books.get
graphql.books.get
library.book_records.get
roles/library:viewer
```

第一个值是旧式冒号语法；第二个是 wildcard；第三个泄露 environment；第四个和第五个创建了 transport namespace；第六个违反 lowerCamelCase；最后一个 role 使用了禁止的旧式 delimiter。
