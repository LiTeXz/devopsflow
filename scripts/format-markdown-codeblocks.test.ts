import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { formatMarkdownCodeBlocks } from './format-markdown-codeblocks'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('Markdown code block formatter', () => {
  it('formats TypeScript and JSON fences while preserving surrounding Markdown', () => {
    const input = [
      '# Example',
      '',
      '  ```ts',
      '  const value={answer:42};',
      '  ```',
      '',
      '```json',
      '{"answer":42,"items":[1,2]}',
      '```',
      '',
      '```bash',
      'echo   untouched',
      '```',
      '',
    ].join('\n')

    expect(formatMarkdownCodeBlocks(input)).toBe(
      [
        '# Example',
        '',
        '  ```ts',
        '  const value = { answer: 42 }',
        '  ```',
        '',
        '```json',
        '{ "answer": 42, "items": [1, 2] }',
        '```',
        '',
        '```bash',
        'echo   untouched',
        '```',
        '',
      ].join('\n'),
    )
  })

  it('supports aliases and leaves unlabeled fences unchanged', () => {
    const input = [
      '```typescript',
      'type Result={ok:boolean}',
      '```',
      '```jsonc',
      '{"ok":true, // comment',
      '}',
      '```',
      '```',
      'const untouched={ok:false}',
      '```',
    ].join('\n')

    expect(formatMarkdownCodeBlocks(input)).toContain('type Result = { ok: boolean }')
    expect(formatMarkdownCodeBlocks(input)).toContain('  "ok": true // comment')
    expect(formatMarkdownCodeBlocks(input)).toContain('const untouched={ok:false}')
  })

  it('is idempotent', () => {
    const input = '```ts\nconst value = { answer: 42 };\n```\n'
    const once = formatMarkdownCodeBlocks(input)
    expect(formatMarkdownCodeBlocks(once)).toBe(once)
  })

  it('requires a closing fence with the same marker and sufficient length', () => {
    const input = ['````ts', '/*', '```', '~~~', '*/', 'const value={answer:42}', '````'].join('\n')

    expect(formatMarkdownCodeBlocks(input)).toBe(['````ts', '/*', '```', '~~~', '*/', 'const value = { answer: 42 }', '````'].join('\n'))
  })

  it('throws a block-specific error for invalid supported code', () => {
    expect(() => formatMarkdownCodeBlocks('```ts\nconst = ;\n```\n')).toThrow('ts code block')
  })

  it('does not write in check mode when content differs', () => {
    const root = mkdtempSync(join(tmpdir(), 'devopsflow-markdown-format-'))
    tempRoots.push(root)
    const file = join(root, 'example.md')
    writeFileSync(file, '```ts\nconst value={answer:42}\n```\n')
    const result = Bun.spawnSync({
      cmd: [process.execPath, join(import.meta.dir, 'format-markdown-codeblocks.ts'), file],
      cwd: join(import.meta.dir, '..'),
      stdout: 'pipe',
      stderr: 'pipe',
    })
    expect(result.exitCode).toBe(1)
    expect(Bun.file(file).text()).resolves.toContain('const value={answer:42}')
  })

  it('does not partially write files when a later file has invalid code', async () => {
    const root = mkdtempSync(join(tmpdir(), 'devopsflow-markdown-format-'))
    tempRoots.push(root)
    const first = join(root, 'first.md')
    const second = join(root, 'second.md')
    writeFileSync(first, '```ts\nconst value={answer:42}\n```\n')
    writeFileSync(second, '```ts\nconst = ;\n```\n')
    const result = Bun.spawnSync({
      cmd: [process.execPath, join(import.meta.dir, 'format-markdown-codeblocks.ts'), '--write', first, second],
      cwd: join(import.meta.dir, '..'),
      stdout: 'pipe',
      stderr: 'pipe',
    })
    expect(result.exitCode).toBe(2)
    expect(await Bun.file(first).text()).toContain('const value={answer:42}')
  })

  it('checks only staged Markdown files through the staged package mode', async () => {
    const root = mkdtempSync(join(tmpdir(), 'devopsflow-markdown-format-'))
    tempRoots.push(root)
    const staged = join(root, 'staged.md')
    const unstaged = join(root, 'unstaged.md')
    writeFileSync(staged, '```ts\nconst value={answer:42}\n```\n')
    writeFileSync(unstaged, '```ts\nconst value={answer:42}\n```\n')
    Bun.spawnSync({ cmd: ['git', 'init'], cwd: root, stdout: 'ignore' })
    Bun.spawnSync({
      cmd: ['git', 'config', 'user.email', 'test@example.com'],
      cwd: root,
    })
    Bun.spawnSync({
      cmd: ['git', 'config', 'user.name', 'Test User'],
      cwd: root,
    })
    Bun.spawnSync({ cmd: ['git', 'add', 'staged.md'], cwd: root })

    const result = Bun.spawnSync({
      cmd: [process.execPath, join(import.meta.dir, 'format-markdown-codeblocks.ts'), '--staged'],
      cwd: root,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    expect(result.exitCode).toBe(1)
    expect(await Bun.file(unstaged).text()).toContain('const value={answer:42}')
  })
})
