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

  it('blocks commits on a feature branch and allows read-only Git commands', () => {
    const cwd = repo('feature/demo')
    expect(shouldBlockGitMutation('git commit -m test', cwd)).toMatchObject({ branch: 'feature/demo', kind: 'commit' })
    expect(shouldBlockGitMutation('git status --short', cwd)).toBeUndefined()
    expect(shouldBlockGitMutation('gh pr create', cwd)).toBeUndefined()
  })

  it('blocks Husky and Lefthook bypasses before the Git command runs', () => {
    const cwd = repo('feature/demo')

    for (const command of [
      'git commit --no-verify -m test',
      'git commit -n -m test',
      'HUSKY=0 git commit -m test',
      'LEFTHOOK=0 git commit -m test',
      'LEFTHOOK_EXCLUDE=pre-commit git commit -m test',
      'git -c core.hooksPath=/dev/null commit -m test',
      'bash -c "HUSKY=0 git status --short"',
      '$env:HUSKY = "0"; git commit -m test',
      '$env:LEFTHOOK = "0"; git commit -m test',
    ]) {
      expect(shouldBlockGitMutation(command, cwd)).toMatchObject({ kind: 'hook-bypass' })
    }
  })

  it('uses git -C when determining the blocked commit branch', () => {
    const root = repo('feature/root')
    const protectedRepo = join(root, 'protected')
    mkdirSync(protectedRepo)
    Bun.spawnSync({ cmd: ['git', 'init', '-b', 'master'], cwd: protectedRepo })
    expect(shouldBlockGitMutation(`git -C "${protectedRepo}" commit -m test`, root)).toMatchObject({ branch: 'master', kind: 'commit' })
  })

  it('returns exit code 2 and tells the user to run local hooks before committing manually', () => {
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
    expect(result.stderr.toString()).toContain('本地 hooks 检查')
    expect(result.stderr.toString()).toContain('手动 commit 和 push')
  })
})
