#!/usr/bin/env bun

import { currentBranch } from '@/shared/branch'
import { binaryName, commandSegments, extractWrappedScript, gitEffectiveCwd, gitSubcommand, normalizeCommandPrefix } from '@/shared/command-parser'
import { findCommand, findToolInput, findToolName, findWorkdir, PRE_TOOL_USE_EVENTS, readPayload, SHELL_TOOL_NAMES } from '@/shared/payload'
import { runLoggedScript } from '@/shared/script-logger'
import type { Payload } from '@/shared/types'

export interface GitMutationDecision {
  readonly kind: 'push' | 'commit' | 'hook-bypass'
  readonly branch: string
}

export function shouldBlockGitMutation(command: string, cwd: string): GitMutationDecision | undefined {
  if (disablesLocalGitHooks(command)) return { kind: 'hook-bypass', branch: '*' }

  for (const segment of commandSegments(command)) {
    const tokens = normalizeCommandPrefix(segment)
    if (!tokens.length) continue
    const wrapped = extractWrappedScript(tokens)
    if (wrapped) {
      const wrappedDecision = shouldBlockGitMutation(wrapped, cwd)
      if (wrappedDecision) return wrappedDecision
    }
    if (binaryName(tokens[0]) !== 'git') continue

    const subcommand = gitSubcommand(tokens.slice(1))
    if (subcommand === 'push') return { kind: 'push', branch: '*' }
    if (subcommand === 'commit') return { kind: 'commit', branch: currentBranch(gitEffectiveCwd(tokens, cwd)) ?? '*' }
  }
  return undefined
}

function disablesLocalGitHooks(command: string): boolean {
  if (/(?:^|\s)\$env:HUSKY(?:_SKIP_HOOKS)?\s*=\s*['"]?(?:0|1)['"]?/i.test(command)) return true
  if (/(?:^|\s)\$env:LEFTHOOK\s*=\s*['"]?0['"]?/i.test(command)) return true

  const tokens = commandSegments(command).flat()
  if (
    tokens.some(
      (token) =>
        token === 'HUSKY=0' ||
        token === 'HUSKY_SKIP_HOOKS=1' ||
        token === 'LEFTHOOK=0' ||
        token.startsWith('LEFTHOOK_EXCLUDE=') ||
        token.startsWith('LEFTHOOK_ONLY='),
    )
  ) {
    return true
  }

  return commandSegments(command).some((segment) => {
    const normalized = normalizeCommandPrefix(segment)
    if (binaryName(normalized[0] ?? '') !== 'git' || gitSubcommand(normalized.slice(1)) !== 'commit') return false
    return normalized.some(
      (token, index) =>
        token === '--no-verify' ||
        token === '-n' ||
        (token === '-c' && normalized[index + 1]?.startsWith('core.hooksPath=')) ||
        token.startsWith('-ccore.hooksPath=') ||
        token.startsWith('--config=core.hooksPath='),
    )
  })
}

function writeBlockMessage(decision: GitMutationDecision): void {
  if (decision.kind === 'push') {
    console.error('DevopsFlow 已阻止 Agent 执行 git push；任何分支都必须由用户手动推送。')
  } else if (decision.kind === 'hook-bypass') {
    console.error('DevopsFlow 已阻止跳过本地 Git hooks 的命令。Husky 和 Lefthook 检查是必要流程，不能使用 --no-verify、-n 或关闭 hook 的环境变量绕过。')
  } else {
    console.error('DevopsFlow 已阻止 Agent 执行 git commit；本地 hooks 检查完成后，请由用户手动提交。')
  }
  console.error('请提醒用户先审查当前代码并完成必要的本地 hooks 检查，再由用户手动 commit 和 push；Agent 不能跳过这些检查。')
}

function main(payload: Payload | null = readPayload()): number {
  if (!payload || typeof payload !== 'object') return 0
  if (!PRE_TOOL_USE_EVENTS.has(String(payload.hook_event_name ?? ''))) return 0
  const toolName = findToolName(payload)
  if (toolName && !SHELL_TOOL_NAMES.has(toolName)) return 0
  const toolInput = findToolInput(payload) ?? {}
  const command = findCommand(toolInput)
  if (!command) return 0
  const decision = shouldBlockGitMutation(command, findWorkdir(payload, toolInput))
  if (!decision) return 0
  writeBlockMessage(decision)
  return 2
}

if (import.meta.main) {
  const payload = readPayload()
  process.exit(runLoggedScript({ payload, scriptName: 'prevent-git-push-protected-commit' }, () => main(payload)))
}
