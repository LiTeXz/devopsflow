#!/usr/bin/env bun

import { currentBranch, PROTECTED_BRANCHES } from '@/shared/branch'
import { binaryName, commandSegments, extractWrappedScript, gitEffectiveCwd, gitSubcommand, normalizeCommandPrefix } from '@/shared/command-parser'
import { findCommand, findToolInput, findToolName, findWorkdir, PRE_TOOL_USE_EVENTS, readPayload, SHELL_TOOL_NAMES } from '@/shared/payload'
import { runLoggedScript } from '@/shared/script-logger'
import type { Payload } from '@/shared/types'

export interface GitMutationDecision {
  readonly kind: 'push' | 'commit'
  readonly branch: string
}

export function shouldBlockGitMutation(command: string, cwd: string): GitMutationDecision | undefined {
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
    if (subcommand !== 'commit') continue

    const branchCwd = gitEffectiveCwd(tokens, cwd)
    const branch = currentBranch(branchCwd)
    if (branch && PROTECTED_BRANCHES.has(branch)) {
      return { kind: 'commit', branch }
    }
  }
  return undefined
}

function writeBlockMessage(decision: GitMutationDecision): void {
  if (decision.kind === 'push') {
    console.error('DevopsFlow 已阻止 Agent 执行 push；任何分支都必须由用户人工推送。')
  } else {
    console.error(`DevopsFlow 已阻止 Agent 在受保护分支 ${decision.branch} 上执行 commit。`)
  }
  console.error('请提醒用户先审查当前代码，再由用户逐个手动提交；不要把 commit 或 push 委托给 Agent。')
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
