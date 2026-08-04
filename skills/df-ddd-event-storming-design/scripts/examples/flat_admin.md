# Problem Domain Boundary

后台组织管理。

# Domain Event Catalog

- 公司信息已变更
- 部门信息已变更
- 岗位信息已变更
- 员工个人信息已变更
- 公司已停用或解散

# Command Catalog

- 建立公司
- 变更部门信息
- 调整岗位所属部门
- 撤销员工

# Policy

- 无

# Aggregate Design

- 公司聚合
- 部门聚合
- 岗位聚合
- 员工聚合

# Read Model Design

- 公司列表
- 部门树

# Completeness Check

- 每个事件都有生产路径。
