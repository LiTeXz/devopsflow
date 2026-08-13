import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { shouldBlockGitMutation } from './prevent-git-push-protected-commit'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

function repo(branch: string): string {
  const cwd = mkdtempSync(join(tmpdir(), 'devopsflow-git-guard-'))
  tempRoots.push(cwd)
  mkdirSync(cwd, { recursive: true })
  Bun.spawnSync({ cmd: ['git', 'init', '-b', branch], cwd })
  return cwd
}

describe('PreToolUse Git mutation guard', () => {
  it('blocks every push regardless of destination or current branch', () => {
    const cwd = repo('feature/demo')
    expect(shouldBlockGitMutation('git push origin feature/demo', cwd)?.kind).toBe('push')
    expect(shouldBlockGitMutation('git push origin HEAD:main', cwd)?.kind).toBe('push')
    expect(shouldBlockGitMutation('env X=1 git push --all origin', cwd)?.kind).toBe('push')
    expect(shouldBlockGitMutation('bash -c "git push origin feature/demo"', cwd)?.kind).toBe('push')
  })

  for (const branch of ['main', 'master', 'dev', 'develop', 'devlop']) {
    it(`blocks commit on ${branch}`, () => {
      const cwd = repo(branch)
      expect(shouldBlockGitMutation('git commit -m test', cwd)).toMatchObject({
        branch,
        kind: 'commit',
      })
    })
  }

  it('allows commit on a feature branch and read-only Git commands', () => {
    const cwd = repo('feature/demo')
    expect(shouldBlockGitMutation('git commit -m test', cwd)).toBeUndefined()
    expect(shouldBlockGitMutation('git status --short', cwd)).toBeUndefined()
    expect(shouldBlockGitMutation('gh pr create', cwd)).toBeUndefined()
  })

  it('uses git -C when determining the commit target branch', () => {
    const root = repo('feature/root')
    const protectedRepo = join(root, 'protected')
    mkdirSync(protectedRepo)
    Bun.spawnSync({ cmd: ['git', 'init', '-b', 'master'], cwd: protectedRepo })
    expect(shouldBlockGitMutation(`git -C "${protectedRepo}" commit -m test`, root)).toMatchObject({ branch: 'master', kind: 'commit' })
  })

  it('returns exit code 2 and tells the user to review and commit manually', () => {
    const cwd = repo('main')
    const payload = JSON.stringify({
      cwd,
      hook_event_name: 'PreToolUse',
      session_id: 'guard-test',
      tool_name: 'shell_command',
      tool_input: { command: 'git commit -m test' },
    })
    const result = Bun.spawnSync({
      cmd: [process.execPath, join(import.meta.dir, 'prevent-git-push-protected-commit.ts')],
      cwd,
      env: { ...process.env, PLUGIN_ROOT: join(import.meta.dir, '..', '..') },
      stdin: new Blob([payload]),
      stdout: 'pipe',
      stderr: 'pipe',
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr.toString()).toContain('审查当前代码')
    expect(result.stderr.toString()).toContain('逐个手动提交')
  })
})
