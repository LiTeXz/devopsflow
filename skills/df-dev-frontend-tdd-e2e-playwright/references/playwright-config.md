# Playwright Configuration

本项目的 `playwright.config.ts` 使用以下固定配置：

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  // ...
  maxFailures: 1,
  retries: 0,
  globalSetup: './e2e/global-setup.ts',
  testDir: '.',
  // ...
})
```

## Rules

- 这些配置是项目契约，不能在 spec、临时 config 或命令行中覆盖。
- `globalSetup` 是全局初始化和 backend server 日志生命周期的唯一入口；fixture 和单个测试只能复用已启动的 server，不得重复启动。
- `maxFailures: 1` 表示首个失败后停止后续测试；调试时先缩小到目标 spec。
- `retries: 0` 表示失败不会自动重试；不要使用只在 retry 时生成证据的 `on-first-retry`。
- `testDir: '.'` 表示测试发现范围由仓库根目录约定决定；新增 spec 遵循既有目录和命名规则。

## Test Placement And Naming

- 允许存在 `e2e/` 目录，但该目录只能存在 `e2e/fixtures/` 和 `e2e/global-setup.ts`；绝对不能在 `e2e/` 下编写测试文件或放置其他测试基础设施。
- E2E 测试默认必须与被测试对象结对放置，保持同名基名；不要另立测试目录，也不要与被测试对象跨越很远的目录层级。只有明确记录跨文件测试边界时才允许例外。
- 测试文件与被测试对象保持同名基名，并且只能使用以下四种后缀：`.e2e.test.ts`、`.e2e.test.tsx`、`.e2e.spec.ts`、`.e2e.spec.tsx`。

例如：

```text
src/components/ProfileForm.tsx
src/components/ProfileForm.e2e.test.tsx

src/pages/profile.tsx
src/pages/profile.e2e.spec.tsx
```

`e2e/fixtures/` 中的 fixture 文件和 `e2e/global-setup.ts` 不属于测试文件，可以按项目约定使用普通 `.ts` 命名；除此之外不要向 `e2e/` 添加文件。

## Failure Evidence

由于没有自动 retry，需要显式保留失败证据：

```bash
bunx playwright test path/to/spec --trace=on --workers=1
```

或在配置中使用 `trace: 'retain-on-failure'`。backend server 的 stdout/stderr 统一写入 `playwright-report/backend.log`，详见 [e2e-patterns.md](e2e-patterns.md) 的 server logging 示例。

## Full Suite Gate

package.json 中的 `test:playwright` 是完整 Playwright 测试套件的正式入口。只有在明确迭代单独的一个页面或一个组件时，才允许使用单 spec 命令获得局部反馈；其他场景必须运行：

```bash
bun run test:playwright
```

不要以单 spec、单 project 或手写 `bunx playwright test` 的结果代替该全量 gate；交接时记录全量命令的 exit code、执行范围和首个失败摘要。单 spec 只能作为明确页面/组件迭代期间的额外证据。
