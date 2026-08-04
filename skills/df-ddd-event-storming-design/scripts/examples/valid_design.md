# Problem Domain Boundary

订单提交。

# Actors and Collaboration Scenarios

- 买家 -> 提交订单 -> 订单已提交 -> 订单详情读模型

# Domain Events

- 订单已提交

# Commands

- 买家发起提交订单

# Policy

- 无

# Aggregates

- 订单

# Read Models

- 订单详情，由订单已提交投影。

# Completeness Check

- 每个事件都有生产路径。
