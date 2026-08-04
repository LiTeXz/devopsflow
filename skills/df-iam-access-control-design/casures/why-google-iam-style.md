# Why This Skill Uses One Google IAM-Style Vocabulary

`casures/` 目录名作为明确的项目要求予以保留。本文档记录采用此授权模型不可协商的原因。

## Permissions Describe Actions, Not Assignments

`service.resource.verb` 回答一个问题：正在授权哪个 service 中哪个 resource type 上的哪个 action？它不编码谁获得访问权限、grant 在何处生效，也不编码其在哪些 attribute 下有效。

`admin:user:read` 等传统字符串混合了 role、resource 和 action。不同团队随后会重新解释各个 segment、增加更多 segment、颠倒其顺序或引入 wildcard。同一 business action 因而积累出不兼容的名称。

## Roles Must Remain Collections

Google Cloud IAM 将 role 建模为 permission collection，并将 role 授予 principal。保持这种分离，可以让 least-privilege role 演进而不重命名 API action。因此，role name 不能替代 permission name，也不能出现在其中。

## ABAC Must Refine Bindings

tenant、environment、ownership、request time、network 和 resource tag 等 attribute 改变的是 grant 何时生效，而不是底层 action。CEL condition 应归属于 binding，使 RBAC 与 ABAC 共享同一个 permission catalog。

将 attribute 编码进名称会产生 `books.get.production`、`books.get.tenantA` 或 `books.get.businessHours` 等无界 variant。禁止这些 variant。

## API Protocols Must Not Create Namespaces

REST route、GraphQL resolver 和 gRPC RPC 是 delivery surface。transport 迁移不得要求 policy 迁移。将每个 surface 显式映射到同一 catalog，可防止 `rest.*`、`graphql.*` 和 `grpc.*` permission family 产生分歧。

## A Stricter Subset Prevents Drift

Google Cloud 记录了宽泛的 `SERVICE.RESOURCE.VERB` 结构。此 skill 有意补充精确 casing、role grammar、CEL-only condition、显式 API mapping 和 fail-closed 迁移规则。更严格的子集使 identifier 可通过机械方式校验，并防止团队将示例视为可选的 style advice。

## No Compatibility Alias

同时接受 `a:b:c` 和 `a.b.c` 会无限期保留两种授权语言。自动转换还会隐藏含义模糊的 segment，并可能授予错误 action。迁移必须选择一个 canonical replacement，更新所有受控 producer 与 consumer，然后拒绝旧值。

## Security Consequence

格式错误、未知、旧式或未映射的授权数据必须导致拒绝访问。记录 warning 后继续、猜测 permission、fallback 到宽泛 role 或跳过检查，都会把命名漂移变成 authorization bypass。
