# 问题域边界

根据公司表、部门表、岗位表、员工表设计 DDD。

# 领域事件清单

- CompanyCreatedEvent
- DeptUpdatedEvent
- PositionDeletedEvent
- EmployeeEditedEvent

# 命令清单

- CreateCompanyCommand
- UpdateDeptCommand
- DeletePositionCommand
- EditEmployeeCommand

# 聚合设计

- 公司聚合对应公司表字段
- 部门聚合对应部门表字段
- 岗位聚合对应岗位表字段
- 员工聚合对应员工表字段

# 读模型设计

- 公司管理页面
- 部门管理页面
- 岗位管理页面
- 员工管理页面
