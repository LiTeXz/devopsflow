# Problem Domain Boundary

后台目录管理。

# Domain Event Catalog

- 名称已修订，不进入领域事件，只用于展示字段。
- 外部事实已拒绝，不进入领域事件，排查走日志。

# Command Catalog

- 按事件组合创建命令：名称变更加状态变更命令、名称变更加除册命令。

# Aggregate Design

- 聚合属性：来源类型、当前状态、描述。
- 这些属性目前无业务方法使用，当前只是展示和同步排查。

# Completeness Check

- 名称不能重复。
