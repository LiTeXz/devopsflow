# E2E Patterns

本文件只在需要具体 Playwright 写法时加载；先遵循 `SKILL.md` 的切片和 RED-GREEN-REFACTOR 顺序。

## Locator Priority

页面和组件应提供足够的 `data-testid`，测试用它快速锁定被测边界；缺失时补充最小、稳定的业务标识：

```tsx
;<section data-testid="profile-form">
  <button data-testid="profile-save" type="submit">
    Save
  </button>
  <div data-testid="profile-error" role="alert" />
</section>
```

```ts
const form = page.getByTestId('profile-form')
await form.getByRole('button', { name: 'Save' }).click()
await expect(page.getByTestId('profile-error')).toHaveText('Profile could not be saved')
```

`data-testid` 应描述业务对象或状态（如 `profile-form`、`profile-save`、`profile-error`），不要使用 CSS class、随机值或 DOM 深度；不要为纯装饰节点添加无价值标识。

```ts
await page.getByRole('button', { name: 'Save profile' }).click()
await page.getByLabel('Display name').fill('Ada')
await expect(page.getByRole('status')).toHaveText('Profile saved')
```

如果产品没有可访问名称，先修复可访问性；确实需要测试专用钩子时使用稳定、业务语义明确的 `data-testid`，例如 `profile-save-button`。不要把 class 名或 DOM 深度当作契约。

## Isolated Data

为每个测试生成唯一标识，并在 fixture 中完成造数和清理：

```ts
test('user can find a newly created project', async ({ page, createProject }) => {
  const project = await createProject({ name: `e2e-${test.info().parallelIndex}-${Date.now()}` })
  await page.goto('/projects')
  await page.getByRole('searchbox', { name: 'Projects' }).fill(project.name)
  await expect(page.getByRole('row', { name: project.name })).toBeVisible()
})
```

若 cleanup 失败，保留唯一标识和失败上下文，避免下次运行误读残留数据。不要依赖另一个 test 先创建项目。

## Network Boundaries

当本切片只验证 UI 对某个响应的处理时，使用最小、一次性的 route mock，并验证调用契约：

```ts
const requestPromise = page.waitForRequest('**/api/profile')
await page.getByRole('button', { name: 'Save profile' }).click()
const request = await requestPromise
expect(request.method()).toBe('POST')
expect(request.postDataJSON()).toMatchObject({ displayName: 'Ada' })
```

不要 mock 本切片正在验证的后端契约；不要用宽泛 `**/*` 拦截器掩盖真实请求错误。

## Failure Evidence

backend server 的 stdout/stderr 不要混在测试命令输出中：

```bash
mkdir -p playwright-report
: > playwright-report/backend.log
bun run <backend-start-script> >playwright-report/backend.log 2>&1 &
backend_pid=$!
```

该命令只能由 `e2e/global-setup.ts` 执行；global setup 应返回 teardown 以终止 `backend_pid`。测试失败时先检查 `playwright-report/backend.log` 的末尾；确认根因后再查看 trace，并且下一次运行要清空旧日志。

针对偶发失败，使用项目配置的 trace：

```bash
bunx playwright test path/to/spec --trace=on --workers=1
```

查看 trace 前先确认失败是否可复现；从 action、locator、console、network 和 timing 判断根因。`waitForTimeout` 只能用于一次性诊断，不能提交到生产测试。
