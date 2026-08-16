---
name: df-dev-frontend-tdd-e2e-playwright
description: "适用于前端 feature development, UI 缺陷修复, 关键用户流程以及跨页面行为变更, 当风险必须通过真实浏览器、真实路由、网络边界或可见交互才能观察时使用. 使用 Playwright E2E 遵循 RED-GREEN-REFACTOR, 先写能证明目标行为缺失的失败测试, 再以最小生产改动通过测试. 不要用于纯函数、组件内部实现、仅样式格式或不需要浏览器的单元测试; 此 skill 与 df-dev-tdd 配合, 由本 skill 补充前端和 Playwright 约束."
version: "0.2.32"
metadata:
  version: "0.2.32"
---

# Frontend TDD E2E Playwright

用真实浏览器保护前端用户可观察行为，并将每个 E2E 行为切片纳入 TDD 证据链。先复用项目已有的 Playwright runner、fixture、启动命令和测试数据边界；只有在稳定的 RED 之后修改生产 UI。

## Scope Decision

先把风险归到最窄的测试层：

- 纯计算、状态转换、数据适配：使用单元或组件测试，不为此启动浏览器。
- 单页面交互但无真实路由、认证、网络或布局风险：优先组件测试。
- 风险涉及真实路由跳转、表单提交、权限、跨页面状态、网络契约、浏览器存储、下载/上传或关键可见结果：使用本 skill 的 E2E 切片。
- 视觉回归是目标时，使用稳定 viewport 和截图断言；不要用截图断言代替语义行为断言。

一个切片只保护一个用户结果，例如“用户提交有效表单后看到成功状态并可在列表中找到新项”。不要在同一首个 GREEN 中顺带覆盖搜索、分页和删除。

## Prerequisites

在写测试前检查并记录：

1. 项目包管理器、测试脚本和 Playwright 配置（通常是 `playwright.config.*`）。遵循现有 runner；仓库规则要求脚本优先使用 Bun 时，使用 `bun run` 或 `bunx`。
2. `webServer`、`baseURL`、浏览器安装状态、认证 fixture、API/mock server 和测试数据库的现有约定。不要凭空创建第二套服务启动方式。
3. 目标页面的可访问名称、稳定状态和数据前置条件。需要登录、种子数据或外部依赖时，优先复用 fixture/API setup，不要在每个 spec 中复制 UI 登录和长链路造数。
4. 如果项目启用了 `.devopsflow/.tdd_checkpoints/<task-slug>.jsonl`，按 `df-dev-tdd` 的 append-only 协议记录 `tdd_start`、`tdd_state`、`tdd_boundary_scan` 和 `tdd_finish`；不要重写历史行。

固定 Playwright 配置、覆盖限制和命令影响见 [playwright-config.md](references/playwright-config.md)。

### Backend Server Logging

启动 E2E 所依赖的 backend server 时，必须将 stdout 和 stderr 重定向到项目相对路径 `playwright-report/backend.log`，以减少命令行噪声并保留服务错误现场：

```bash
mkdir -p playwright-report
: > playwright-report/backend.log
bun run <backend-start-script> >playwright-report/backend.log 2>&1 &
backend_pid=$!
```

`globalSetup` 是 backend server 的唯一启动入口；fixture 只能复用已启动的 server，不得再次启动。若 `globalSetup` 内部使用 shell 启动进程，保留 PID，并通过 Playwright 的 teardown 返回值终止它。每次运行前清空旧日志，避免把上一次运行的错误误判为当前失败；不要使用 `tee` 把同一份日志继续复制到命令行。server 启动失败、页面出现 5xx、测试超时或 browser context 收到 connection refused 时，先读取 `playwright-report/backend.log`，再判断是否需要 trace 或扩大测试范围。

## RED-GREEN-REFACTOR

### 1. Define the Slice

编辑生产代码前写下：用户、前置状态、动作、可观察结果、稳定边界、不得改变的行为，以及本次不覆盖的后续切片。明确 E2E 是因为哪一个跨层风险不可由更窄测试层证明。

调用宿主的 todo 工具，保持只有一个切片处于 `in_progress`。若使用 `df-dev-tdd`，先输出并验证 `tdd_start`，再开始测试编辑。

### 2. Write the Browser Test First

先在被测试对象旁边新增或修改最窄的 E2E 文件，使用业务语义命名测试，例如 `user can save a valid profile`。测试文件默认必须与被测试对象结对出现、保持同名基名，不要另建 tests/e2e 目录或把测试与对象跨开很远；只有明确记录跨文件测试边界时才允许例外。允许的文件后缀只有 `.e2e.test.ts`、`.e2e.test.tsx`、`.e2e.spec.ts`、`.e2e.spec.tsx`。测试必须：

- 从明确 fixture/seed 状态开始，避免依赖前序测试或执行顺序。
- 组件边界通过稳定的 `data-testid` 定位，内部控件通过 role、label 或 placeholder 定位；不要用脆弱的 CSS 层级、自动生成 class 或无意义的 `nth()`。
- 对用户结果断言（URL、可见文本、状态、列表项、下载文件或错误提示），同时断言关键失败路径的语义，不只断言“没有抛异常”。
- 使用 Playwright 的 auto-wait、web-first assertions 和明确 timeout；不要用 `sleep` 掩盖竞态。
- 每个测试独立清理数据或使用唯一标识。网络 mock 必须只 mock 不属于本测试的外部边界，并断言请求方法、路径和关键 payload。
- `e2e/` 目录只能存在 `e2e/fixtures/` 和 `e2e/global-setup.ts`；绝对不能在其下编写 E2E 测试或放置其他测试基础设施，测试仍然放在被测试对象旁边。

先运行单个 spec 或单个 test，确认它因目标行为缺失而 RED。若失败是 selector、fixture、服务未启动、浏览器未安装或类型错误，先修正测试/环境；立即 PASS 不算有效 RED，必要时用临时、可恢复的变异证明断言确实能失败。

### Testability Markers

被测页面、组件和关键交互/状态区域应保有充足、稳定的 `data-testid`，以便测试快速定位组件边界。至少为页面根节点、主要组件、关键操作控件、加载/成功/错误状态和可重复列表项提供业务语义明确的标识；不需要给每个装饰性 DOM 节点机械加 ID。

发现缺失时可以补充 `data-testid`，但只添加当前切片需要的最小标识，并把它作为生产改动纳入 RED-GREEN 记录。测试中使用 `getByTestId()` 定位组件边界，再用 role/label 断言内部语义；不要用自动生成 class、DOM 层级或 `nth()` 代替稳定标识。

### 3. Boundary Discovery

在 RED 后、生产编辑前做一次短的边界扫描，并记录到 `tdd_boundary_scan`：空值/非法输入、重复提交、刷新或返回、慢响应/网络错误、权限状态、空列表、并发点击、移动 viewport 和浏览器存储。最多选择一个 `current_slice` 收紧本次 GREEN，其余标为 `next_slice` 或带理由的 `deferred`。

### 4. Minimal GREEN

只实现让当前 spec 通过所需的最小生产行为。保持现有路由、状态管理、API 契约和错误语义；不要在 RED 阶段做大规模组件重构、统一 locator 或顺手升级依赖。测试通过后再重构，并立即重跑同一 spec 及其相关项目测试。

### 5. Verification

按风险逐级验证：

1. 只有在明确迭代单独的一个页面或一个组件时，才允许运行当前 spec：`bunx playwright test path/to/spec --project=<project> --workers=1`（按项目实际脚本调整）。
2. 页面/组件之外的任何场景，以及完成前的验证，都必须运行 package.json 设计的完整 Playwright 套件：`bun run test:playwright`。不得用单 spec 命令或手写 `bunx playwright test` 替代这条全量 gate。
3. 同一 feature 的相关 spec，必要时多浏览器/移动 project；这些不能替代全量 gate。
4. lint、typecheck、build 或项目规定的其他 frontend gate。
5. 最终运行稳定性检查；按 [playwright-config.md](references/playwright-config.md) 的失败证据规则保留 trace、截图、视频和 console/network 日志，定位真实竞态后修复，不得通过放宽断言或无限 timeout 消音。

失败产物放在项目既有目录；backend server 日志固定写入 `playwright-report/backend.log`，trace、截图和视频按 Playwright 配置留在 `playwright-report/`。不要新增顶层临时目录。报告每条命令、exit code、测试名、RED/GREEN 观察、未运行的 gate 和剩余风险。

## Playwright Guardrails

- 每次导航、显著 DOM 变化、菜单/弹窗开关后重新 snapshot 或重新获取 locator；不要复用已经失效的元素句柄。
- 页面和组件边界优先使用稳定的 `getByTestId()`；控件的可访问语义仍使用 `getByRole(..., { name })`、`getByLabel()` 或 `getByPlaceholder()` 进行补充断言。只有在缺少这些稳定契约且已说明理由时才使用 CSS/XPath。
- 用 `expect(locator).toBeVisible()`、`toHaveText()`、`toHaveURL()` 等 web-first 断言；避免读取瞬时 `textContent()` 后手写轮询。
- 真实后端行为是风险的一部分时不要 mock 它；只 mock 不稳定、昂贵或明确不在本切片边界的第三方服务。
- 不要把共享账号、生产数据、真实 token 或秘密写入 spec、trace、截图或日志；使用脱敏 fixture 和临时凭证。
- 用 `test.describe`/fixture 表达隔离和生命周期，不用全局可变变量在测试间传递状态。
- 测试修复应优先修复产品或 fixture 的根因；只有确认环境噪声后才调整 retry，并记录 retry 不能替代根因修复。

## Completion Criteria

- 当前行为切片在生产改动前有可信 RED，在最小改动后由同一测试达到 GREEN。
- locator、fixture、网络边界和数据清理能解释，且测试不依赖顺序或隐式共享状态。
- GREEN 后的重构没有改变用户可观察契约；相关窄层和规定的 frontend gates 已运行。
- package.json 中的 `test:playwright` 全量套件已运行，并记录命令、exit code 和失败摘要（如有）；单 spec 结果只有在明确迭代单个页面或组件时才可作为额外证据。
- 必要的 trace/截图/日志已保留或明确无需保留；TDD checkpoint 和 todo 状态一致。
- 最终交接使用中文，列出修改文件、测试层、确切命令与 exit code、跳过的检查和残余风险。

详细的 Playwright 配置见 [playwright-config.md](references/playwright-config.md)；locator、fixture、网络隔离和 flaky 处理示例见 [e2e-patterns.md](references/e2e-patterns.md)。通用 TDD 状态协议和边界扫描规则见 `df-dev-tdd`，真实浏览器 CLI 操作见 `playwright` skill；不要在本 skill 中重复它们的完整命令参考。

<!-- DF_DEV_FRONTEND_TDD_E2E_PLAYWRIGHT_SKILL_EOF: This is the complete DfDevFrontendTddE2ePlaywright skill. Do not request additional lines. -->
