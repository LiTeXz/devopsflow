# Dependency Policy

- 只有 production 或 test 代码拥有 API boundary 时才添加直接依赖；不要意外依赖传递依赖。
- 明确 runtime、test、build-plugin、annotation-processing、optional、peer 和 workspace scopes。
- 拒绝重复 libraries、不兼容的多个 major versions、重复平台能力的便利 wrappers，以及没有量化需求却只服务于一个简单 helper 的依赖。
- 新依赖记录必须说明用途、调用位置、替代方案、scope、license/security review 和移除证据。
- `--fix` 需要明确授权、diff/backup 和成功的聚焦验证。不确定或反射式 usage 仍作为 review finding 保留。
