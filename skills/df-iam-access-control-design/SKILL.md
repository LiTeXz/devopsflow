---
name: df-iam-access-control-design
description: "设计并评审适用于 REST、GraphQL、gRPC、protobuf 和混合 API surface 的严格 Google Cloud IAM-style 授权目录，覆盖 RBAC 与 ABAC。当 Codex 需要命名 permission 或 role、定义 role binding 与 CEL condition、将 API operation 映射到授权检查、迁移旧式冒号分隔 permission，或防止出现多套授权命名方案时使用。"
---

# IAM Access Control Design

为所有 API surface 设计一套统一的授权词汇。采用 Google Cloud IAM 对 permission、role、principal、resource 和 condition 的分离方式，同时强制执行此 skill 更严格且平台无关的 identifier 子集。

## Core Rules

1. 所有 permission 均命名为 `service.resource.verb`。
2. 所有 role 均命名为 `roles/service.role`。
3. 将 role 授予 principal；绝不直接授予独立 permission。
4. 将 resource scope 和 ABAC attribute 保持在 permission identifier 之外。
5. ABAC condition 只能通过 role binding 上的 CEL 表达。
6. 将 REST operation、GraphQL resolver 和 gRPC RPC 映射到同一个 permission catalog。
7. 拒绝冒号分隔 permission、wildcard、alias、dual-read compatibility 和 protocol-specific variant。
8. permission 缺失、格式错误、未映射或采用旧格式时，必须 fail closed。

定义 identifier、role 或 binding 前，先阅读 [authorization-model.md](references/authorization-model.md)。涉及 REST、GraphQL、gRPC、protobuf 或 OpenAPI 时，阅读 [api-surface-mapping.md](references/api-surface-mapping.md)。解释或评审从旧式 RBAC 命名强制切换的原因时，阅读 [why-google-iam-style.md](casures/why-google-iam-style.md)。

## Source Discipline

在声称某项规则来自 Google Cloud IAM 或 Google AIP 前，先获取当前官方页面：

- `https://docs.cloud.google.com/iam/docs/roles-permissions`
- `https://docs.cloud.google.com/iam/docs/roles-overview`
- `https://docs.cloud.google.com/iam/docs/conditions-overview`
- `https://google.aip.dev/121`
- `https://google.aip.dev/122`
- `https://google.aip.dev/127`

准确标注规则来源：

- Google Cloud IAM 将 permission 定义为 `SERVICE.RESOURCE.VERB`，将 role 定义为 permission collection，并将 IAM Conditions 定义为附加在 policy construct 上的 attribute-based expression。
- 此 skill 有意收紧 segment casing、role name、CEL 用法、迁移行为和 cross-protocol mapping。应将这些内容表述为项目 policy，而不是未记录的 Google 要求。

## Workflow

1. 命名 permission 前，盘点 resource 与 operation。
2. 选择由授权目录拥有的稳定 service namespace，而不是由 transport 或 deployment environment 拥有的 namespace。
3. 创建 atomic permission identifier，并使用随附脚本校验。
4. 将每个受保护 API operation 显式映射到一个或多个 catalog permission。
5. 由已校验 permission 组成 least-privilege role。
6. 在 resource scope 上将 principal 绑定到 role。
7. 当 attribute 需要细化访问权限时，为 binding 添加可选 CEL condition。
8. 评审旧式语法、alias、wildcard grant、隐藏 condition 和未映射 operation。
9. 报告不兼容项，不要虚构 fallback DSL 或 permission syntax。

## Required Design Output

为新设计或迁移产出以下 artifact：

1. Permission catalog：identifier、resource、action、语义和受保护 operation。
2. Role catalog：role identifier、用途和精确 permission set。
3. Binding model：principal、role、resource scope 和可选 CEL condition。
4. API mapping table：protocol operation 或 resolver、permission、resource extraction 和 deny behavior。
5. Compliance finding：所有旧式名称、alias、wildcard、condition leakage 或缺失 mapping。
6. Validation evidence：命令、exit code 和已检查文件。

不要静默转换旧式 identifier。提出唯一 canonical replacement，并要求所有 producer 与 consumer 切换到该值。

## Validation

将 permission 或 role identifier 存储在独立的 line-oriented catalog 中。忽略空行和以 `#` 开头的行。

```bash
bun skills/df-iam-access-control-design/scripts/validate-authorization-identifiers.ts --kind permission --input permissions.txt
bun skills/df-iam-access-control-design/scripts/validate-authorization-identifiers.ts --kind role --input roles.txt
```

将非零 exit code 视为阻断项。不要压制或降低旧格式 finding 的严重性。

## Review Checklist

- 每个 permission 是否只匹配一个 canonical identifier？
- service namespace 是否独立于 REST、GraphQL、gRPC、tenant、region 和 environment？
- resource 与 verb 是否采用 lowerCamelCase 且语义稳定？
- role 是否是 collection，而不是伪装的 permission？
- scope 与 CEL condition 是否存储在 binding 上，而不是编码进名称？
- 每个受保护 API operation 是否显式映射到共享 catalog？
- 是否不存在 alias、wildcard、fallback translation 和旧式冒号名称？
- 授权 metadata 缺失或无效时是否拒绝访问？

<!-- DF_IAM_ACCESS_CONTROL_DESIGN_EOF: This is the complete DfIamAccessControlDesign skill. Do not request additional lines. -->
