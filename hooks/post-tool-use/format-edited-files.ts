#!/usr/bin/env bun

import { existsSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { findHookEvent, findToolInput, findToolName, readPayload } from '@/shared/payload'
import type { Payload } from '@/shared/types'

interface FormatterResult {
  readonly exitCode: number
  readonly stderr: string
}

interface FormatResult {
  readonly formatted: string[]
  readonly warning?: string
}

type Formatter = (paths: string[], cwd: string) => FormatterResult

const POST_TOOL_USE_EVENTS = new Set(['PostToolUse', 'post_tool_use', 'postToolUse'])
const EDIT_TOOL_NAMES = new Set(['apply_patch', 'Edit', 'Write'])
const EDITED_FILE_PATTERN = /^\*\*\* (?:Add|Update) File: (.+)$/gm
const MAX_WARNING_LENGTH = 240

export function extractEditedPaths(command: string): string[] {
  const paths: string[] = []
  for (const match of command.matchAll(EDITED_FILE_PATTERN)) {
    const path = match[1]?.trim()
    if (path && !paths.includes(path)) paths.push(path)
  }
  return paths
}

export function biomeCommand(root: string, paths: string[]): string[] {
  return [process.execPath, resolve(root, 'node_modules', '@biomejs', 'biome', 'bin', 'biome'), 'format', '--write', ...paths]
}

export function formatEditedFiles(payload: Payload, formatter: Formatter = runBiome): FormatResult {
  if (
    !POST_TOOL_USE_EVENTS.has(findHookEvent(payload)) ||
    !EDIT_TOOL_NAMES.has(findToolName(payload)) ||
    toolFailed(payload.tool_response ?? payload.toolResponse)
  ) {
    return { formatted: [], warning: undefined }
  }

  const command = findToolInput(payload)?.command
  if (typeof command !== 'string') return { formatted: [], warning: undefined }

  const cwd = typeof payload.cwd === 'string' && payload.cwd.trim() ? payload.cwd : process.cwd()
  const root = gitRoot(cwd)
  if (!root) return { formatted: [], warning: 'devopsflow: skipped post-edit formatting because the Git root was unavailable' }
  if (!hasBiomeConfig(root)) return { formatted: [], warning: undefined }

  const paths = extractEditedPaths(command)
    .map((path) => containedRootPath(root, cwd, path))
    .filter((path): path is string => path !== undefined)
  if (!paths.length) return { formatted: [], warning: undefined }

  const result = formatter(paths, root)
  if (result.exitCode === 0) return { formatted: paths, warning: undefined }

  const detail = result.stderr.trim().replace(/\s+/g, ' ').slice(0, MAX_WARNING_LENGTH)
  return {
    formatted: [],
    warning: `devopsflow: formatter failed for ${paths.join(', ')}${detail ? `: ${detail}` : ''}`,
  }
}

function toolFailed(response: unknown): boolean {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return false
  const record = response as Record<string, unknown>
  return record.isError === true || record.success === false
}

function hasBiomeConfig(root: string): boolean {
  return existsSync(resolve(root, 'biome.json')) || existsSync(resolve(root, 'biome.jsonc'))
}

function gitRoot(cwd: string): string | undefined {
  const result = Bun.spawnSync({ cmd: ['git', 'rev-parse', '--show-toplevel'], cwd, stderr: 'ignore' })
  if (result.exitCode !== 0) return undefined
  const root = result.stdout.toString().trim()
  return root ? realpathSync(root) : undefined
}

function containedRootPath(root: string, cwd: string, path: string): string | undefined {
  if (isAbsolute(path)) return undefined
  const candidate = resolve(cwd, path)
  if (!existsSync(candidate)) return undefined

  const resolved = realpathSync(candidate)
  const fromRoot = relative(root, resolved)
  if (fromRoot === '' || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) return undefined
  return fromRoot.split(sep).join('/')
}

function runBiome(paths: string[], cwd: string): FormatterResult {
  const result = Bun.spawnSync({
    cmd: biomeCommand(cwd, paths),
    cwd,
    stdout: 'ignore',
  })
  return { exitCode: result.exitCode, stderr: result.stderr.toString() }
}

function main(payload: Payload | null = readPayload()): number {
  try {
    if (!payload) return 0
    const result = formatEditedFiles(payload)
    if (result.warning) console.log(JSON.stringify({ systemMessage: result.warning }))
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.log(JSON.stringify({ systemMessage: `devopsflow: post-edit formatting skipped: ${detail.slice(0, MAX_WARNING_LENGTH)}` }))
  }
  return 0
}

if (import.meta.main) process.exit(main())
