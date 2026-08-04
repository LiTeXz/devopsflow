# Problem Domain Boundary

根据公司表、部门表、岗位表、员工表设计 DDD。

# Domain Event Catalog

- CompanyCreatedEvent
- DeptUpdatedEvent
- PositionDeletedEvent
- EmployeeEditedEvent

# Command Catalog

- CreateCompanyCommand
- UpdateDeptCommand
- DeletePositionCommand
- EditEmployeeCommand

# Aggregate Design

- 公司聚合对应公司表字段
- 部门聚合对应部门表字段
- 岗位聚合对应岗位表字段
- 员工聚合对应员工表字段

# Read Model Design

- 公司管理页面
- 部门管理页面
- 岗位管理页面
- 员工管理页面
