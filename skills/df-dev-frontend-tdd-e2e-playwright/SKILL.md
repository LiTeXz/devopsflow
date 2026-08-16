---
name: df-dev-frontend-tdd-e2e-playwright
description: "适用于前端 feature development, UI 缺陷 fix, 关键 user 流程以及跨页面行为 change, 当风险必须 passed 真实浏览器, 真实 route, 网络边界 or 可见交互才能观察时使用. 使用 Playwright E2E 遵循 RED-GREEN-REFACTOR, 先 write 能证明 target 行为缺失的失败 test, 再以最小生产改动 passed test. 不要用于纯函数, 组件内部 implementation, 仅样式格式 or 不需要浏览器的单元 test; 此 skill and df-dev-tdd 配合, 由 this skill 补充前端 and Playwright 约束."
version: "0.2.33"
metadata:
  version: "0.2.33"
---

# Frontend TDD E2E Playwright

用真实浏览器保护前端 user 可观察行为, 并将每个 E2E 行为切片纳入 TDD 证据链. 先复用 project 已有的 Playwright runner, fixture, 启动命令 and test 数据边界; 只有在稳定的 RED 之后修改生产 UI.

## Scope Decision

先把风险归到最窄的 test 层:

- 纯计算, 状态转换, 数据 adapt: 使用单元 or 组件 test, 不为此启动浏览器.
- 单页面交互但无真实 route, 认证, 网络 or 布局风险: 优先组件 test.
- 风险涉及真实 route 跳转, 表单提交, 权限, 跨页面状态, 网络契约, 浏览器存储, 下载/上传 or 关键可见 result: 使用 this skill 的 E2E 切片.
- 视觉回归是 target 时, 使用稳定 viewport and 截图断言; 不要用截图断言代替语义行为断言.

1 个切片只保护 1 个 user result, 例如"user 提交有效表单后看到成功状态并可在列表中找到新项". 不要在相同首个 GREEN 中顺带覆盖搜索, 分页 and 删除.

## Prerequisites

在 write test 前 check 并记录:

1. project package manager, test script and Playwright 配置(通常是 `playwright.config.*`). 遵循现有 runner; repository rule 要求 script 优先使用 Bun 时, 使用 `bun run` or `bunx`.
2. `webServer`,`baseURL`, 浏览器 install 状态, 认证 fixture, API/mock server and test 数据库的现有约定. 不要凭空 create 第2套 service 启动方式.
3. target 页面的可访问 name, 稳定状态 and 数据前置条件. 需要登录, 种子数据 or 外部依赖时, 优先复用 fixture/API setup, 不要在每个 spec 中复制 UI 登录 and 长链路造数.
4. if project enable 了 `.devopsflow/.tdd_checkpoints/<task-slug>.jsonl`, 按 `df-dev-tdd` 的 append-only protocol 记录 `tdd_start`,`tdd_state`,`tdd_boundary_scan` and `tdd_finish`; 不要重 write history 行.

固定 Playwright 配置, 覆盖限制 and 命令影响见 [playwright-config.md](references/playwright-config.md).

### Backend Server Logging

启动 E2E 所依赖的 backend server 时, 必须将 stdout and stderr 重定向到 project 相对路径 `playwright-report/backend.log`, 以减少命令行噪声并保留 service 错误现场:

```bash
mkdir -p playwright-report
: > playwright-report/backend.log
bun run <backend-start-script> >playwright-report/backend.log 2>&1 &
backend_pid=$!
```

`globalSetup` 是 backend server 的 unique 启动入口; fixture 只能复用已启动的 server, 不得再次启动. 若 `globalSetup` 内部使用 shell 启动进程, 保留 PID, 并 passed Playwright 的 teardown return value 终止它. 每次 run 前清空旧日志, 避免把上 1 次 run 的错误误判为当前失败; 不要使用 `tee` 把相同份日志继续复制到命令行. server 启动失败, 页面出现 5xx, test 超时 or browser context 收到 connection refused 时, 先读取 `playwright-report/backend.log`, 再判断是否需要 trace or 扩大 test 范围.

## RED-GREEN-REFACTOR

### 1. Define the Slice

edit 生产 code 前 write 下: user, 前置状态, 动作, 可观察 result, 稳定边界, 不得 change 的行为, 以及本次不覆盖的后续切片. 明确 E2E 是因为哪 1 个跨层风险不可由更窄 test 层证明.

call 宿主的 todo 工具, 保持只有 1 个切片处于 `in_progress`. 若使用 `df-dev-tdd`, 先 output 并验证 `tdd_start`, 再开始 test edit.

### 2. Write the Browser Test First

先在被 test object 旁边新增 or 修改最窄的 E2E file, 使用业务语义命名 test, 例如 `user can save a valid profile`. test file default 必须 and 被 test object 结对出现, 保持同名基名, 不要另建 tests/e2e directory or 把 test and object 跨开很远; 只有明确记录跨 file test 边界时才允许例外. 允许的 file 后缀只有 `.e2e.test.ts`,`.e2e.test.tsx`,`.e2e.spec.ts`,`.e2e.spec.tsx`. test 必须:

- 从明确 fixture/seed 状态开始, 避免依赖前序 test or execution 顺序.
- 组件边界 passed 稳定的 `data-testid` 定位, 内部控件 passed role, label or placeholder 定位; 不要用脆弱的 CSS 层级, 自动 generate class or 无意义的 `nth()`.
- 对 user result 断言(URL, 可见文本, 状态, 列表项, 下载 file or 错误提示), 同时断言关键失败路径的语义, 不只断言"没有抛异常".
- 使用 Playwright 的 auto-wait, web-first assertions and 明确 timeout; 不要用 `sleep` 掩盖竞态.
- 每个 test 独立清理数据 or 使用 unique 标识. 网络 mock 必须只 mock 不属于本 test 的外部边界, 并断言请求方法, 路径 and 关键 payload.
- `e2e/` directory 只能存在 `e2e/fixtures/` and `e2e/global-setup.ts`; 绝对不能在其下 write E2E test or 放置 other test 基础设施, test 仍然放在被 test object 旁边.

先 run 单个 spec or 单个 test, 确认它因 target 行为缺失而 RED. 若失败是 selector, fixture, service 未启动, 浏览器未 install or type 错误, 先修正 test/环境; 立即 PASS 不算有效 RED, 必要时用临时, 可恢复的变异证明断言确实能失败.

### Testability Markers

被测页面, 组件 and 关键交互/状态区域应保有充足, 稳定的 `data-testid`, 以便 test 快速定位组件边界. 至少为页面根节点, 主要组件, 关键操作控件, 加载/成功/错误状态 and 可重复列表项提供业务语义明确的标识; 不需要给每个装饰性 DOM 节点机械加 ID.

发现缺失时可以补充 `data-testid`, 但只添加当前切片需要的最小标识, 并把它作为生产改动纳入 RED-GREEN 记录. test 中使用 `getByTestId()` 定位组件边界, 再用 role/label 断言内部语义; 不要用自动 generate class, DOM 层级 or `nth()` 代替稳定标识.

### 3. Boundary Discovery

在 RED 后, 生产 pre edit 做 1 次短的边界扫描, 并记录到 `tdd_boundary_scan`: 空 value/非法 input, 重复提交, 刷新 or return, 慢响应/网络错误, 权限状态, 空列表, 并发点击, 移动 viewport and 浏览器存储. 最多选择 1 个 `current_slice` 收紧本次 GREEN, 其余标为 `next_slice` or 带理由的 `deferred`.

### 4. Minimal GREEN

只 implementation 让当前 spec passed 所需的最小生产行为. 保持现有 route, 状态管理, API 契约 and 错误语义; 不要在 RED 阶段做大规模组件 refactor, unified locator or 顺手升级依赖. test passed 后再 refactor, 并立即重跑相同 spec 及其相关 project test.

### 5. Verification

按风险逐级验证:

1. 只有在明确迭代单独的 1 个页面 or 1 个组件时, 才允许 run 当前 spec:`bunx playwright test path/to/spec --project=<project> --workers=1`(按 project 实际 script 调整).
2. 页面/组件之外的任何场景, 以及完成前的验证, 都必须 run package.json 设计的完整 Playwright 套件:`bun run test:playwright`. 不得用单 spec 命令 or 手 write `bunx playwright test` 替代这条全量 gate.
3. 相同 feature 的相关 spec, 必要时多浏览器/移动 project; 这些不能替代全量 gate.
4. lint, type check, build or project 规定的 other frontend gate.
5. 最终 run 稳定性 check; 按 [playwright-config.md](references/playwright-config.md) 的失败证据 rule 保留 trace, 截图, 视频 and console/network 日志, 定位真实竞态后 fix, 不得 passed 放宽断言 or 无限 timeout 消音.

失败产物放在 project 既有 directory; backend server 日志固定 write `playwright-report/backend.log`, trace, 截图 and 视频按 Playwright 配置留在 `playwright-report/`. 不要新增顶层临时 directory. 报告每条命令, exit code, test 名, RED/GREEN 观察, 未 run 的 gate and 剩余风险.

## Playwright Guardrails

- 每次导航, 显著 DOM 变化, 菜单/弹窗开关后重新 snapshot or 重新获取 locator; 不要复用已经失效的元素句柄.
- 页面 and 组件边界优先使用稳定的 `getByTestId()`; 控件的可访问语义仍使用 `getByRole(..., { name })`,`getByLabel()` or `getByPlaceholder()` 进行补充断言. 只有在缺少这些稳定契约且已说明理由时才使用 CSS/XPath.
- 用 `expect(locator).toBeVisible()`,`toHaveText()`,`toHaveURL()` 等 web-first 断言; 避免读取瞬时 `textContent()` 后手 write 轮询.
- 真实后端行为是风险的 part 时不要 mock 它; 只 mock 不稳定, 昂贵 or 明确不在本切片边界的第3方 service.
- 不要把共享账号, 生产数据, 真实 token or 秘密 write spec, trace, 截图 or 日志; 使用脱敏 fixture and 临时凭证.
- 用 `test.describe`/fixture 表达隔离 and 生命周期, 不用全局可变变量在 test 间传递状态.
- test fix 应优先 fix 产品 or fixture 的根因; 只有确认环境噪声后才调整 retry, 并记录 retry 不能替代根因 fix.

## Completion Criteria

- 当前行为切片在生产改动前有可信 RED, 在最小改动后由相同 test 达到 GREEN.
- locator, fixture, 网络边界 and 数据清理能解释, 且 test 不依赖顺序 or 隐式共享状态.
- GREEN 后的 refactor 没有 change user 可观察契约; 相关窄层 and 规定的 frontend gates 已 run.
- package.json 中的 `test:playwright` 全量套件已 run, 并记录命令, exit code and 失败摘要(如有); 单 spec result 只有在明确迭代单个页面 or 组件时才可作为额外证据.
- 必要的 trace/截图/日志已保留 or 明确无需保留; TDD checkpoint and todo 状态 consistent.
- 最终交接使用 chinese, 列出修改 file, test 层, 确切命令 and exit code, 跳过的 check and 残余风险.

详细的 Playwright 配置见 [playwright-config.md](references/playwright-config.md); locator, fixture, 网络隔离 and flaky 处理 example 见 [e2e-patterns.md](references/e2e-patterns.md). 通用 TDD 状态 protocol and 边界扫描 rule 见 `df-dev-tdd`, 真实浏览器 CLI 操作见 `playwright` skill; 不要在 this skill 中重复它们的完整命令参考.

<!-- DF_DEV_FRONTEND_TDD_E2E_PLAYWRIGHT_SKILL_EOF: This is the complete DfDevFrontendTddE2ePlaywright skill. Do not request additional lines. -->
