#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const SUPPORTED_LANGUAGES = new Set(['js', 'jsx', 'json', 'jsonc', 'ts', 'tsx', 'typescript', 'javascript'])

const LANGUAGE_ALIASES: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
}

interface Fence {
  readonly language: string
  readonly opening: string
  readonly closing: string
  readonly contentStart: number
  readonly contentEnd: number
  readonly prefix: string
}

interface OpenFence {
  readonly language: string
  readonly markerCharacter: string
  readonly markerLength: number
  readonly opening: string
  readonly prefix: string
  readonly start: number
}

function findFences(lines: string[]): Fence[] {
  const fences: Fence[] = []
  let open: OpenFence | undefined

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const match = /^(\s*)(`{3,}|~{3,})([^`]*)$/.exec(line)
    if (!match) continue
    const [, prefix, marker, info] = match
    if (!open) {
      const language = info.trim().split(/\s+/, 1)[0]?.toLowerCase() ?? ''
      open = {
        language,
        markerCharacter: marker[0] ?? '',
        markerLength: marker.length,
        opening: line,
        start: index + 1,
        prefix,
      }
      continue
    }
    const isClosingFence = info.trim() === '' && marker[0] === open.markerCharacter && marker.length >= open.markerLength
    if (line.startsWith(open.prefix) && isClosingFence) {
      fences.push({
        language: open.language,
        opening: open.opening,
        closing: line,
        contentStart: open.start,
        contentEnd: index,
        prefix: open.prefix,
      })
      open = undefined
    }
  }
  return fences
}

function stripPrefix(line: string, prefix: string): string {
  return line.startsWith(prefix) ? line.slice(prefix.length) : line
}

function addPrefix(line: string, prefix: string): string {
  return line.length ? `${prefix}${line}` : prefix.trimEnd()
}

export function runBiomeFormatter(source: string, language: string): string {
  const result = Bun.spawnSync({
    cmd: [process.execPath, 'x', '@biomejs/biome', 'format', '--stdin-file-path', `block.${language}`],
    stdin: new Blob([source]),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (result.exitCode !== 0) {
    throw new Error(`Biome failed for ${language} code block: ${result.stderr.toString().trim()}`)
  }
  return result.stdout.toString().replace(/\r?\n$/, '')
}

export function formatMarkdownCodeBlocks(markdown: string): string {
  const newline = markdown.includes('\r\n') ? '\r\n' : '\n'
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')
  const fences = findFences(lines)
  for (const fence of fences.reverse()) {
    const language = LANGUAGE_ALIASES[fence.language] ?? fence.language
    if (!SUPPORTED_LANGUAGES.has(fence.language)) continue
    const source = lines
      .slice(fence.contentStart, fence.contentEnd)
      .map((line) => stripPrefix(line, fence.prefix))
      .join('\n')
    let formatted: string
    try {
      formatted = runBiomeFormatter(source, language)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(`${fence.language} code block at line ${fence.contentStart + 1}: ${detail}`)
    }
    lines.splice(fence.contentStart, fence.contentEnd - fence.contentStart, ...formatted.split('\n').map((line) => addPrefix(line, fence.prefix)))
  }
  return lines.join('\n').replaceAll('\n', newline)
}

function main(args: string[] = process.argv.slice(2)): number {
  if (args[0] === '--staged') return checkStagedMarkdown()
  const write = args[0] === '--write'
  const files = (write ? args.slice(1) : args).filter(Boolean)
  if (!files.length) {
    console.error('Usage: format-markdown-codeblocks.ts [--write] <file.md> [...]')
    return 2
  }
  let changed = false
  const results: Array<{
    formatted: string
    original: string
    path: string
  }> = []
  for (const file of files) {
    const path = resolve(file)
    const original = readFileSync(path, 'utf8')
    let formatted: string
    try {
      formatted = formatMarkdownCodeBlocks(original)
    } catch (error) {
      console.error(`${basename(path)}: ${error instanceof Error ? error.message : String(error)}`)
      return 2
    }
    results.push({ formatted, original, path })
    if (formatted === original) continue
    changed = true
  }
  for (const result of results) {
    if (result.formatted === result.original) continue
    if (write) writeFileSync(result.path, result.formatted)
    else console.error(`${result.path} is not formatted`)
  }
  return changed && !write ? 1 : 0
}

function checkStagedMarkdown(): number {
  const listed = Bun.spawnSync({
    cmd: ['git', 'diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR', '--', '*.md'],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (listed.exitCode !== 0) {
    console.error(`Unable to list staged Markdown files: ${listed.stderr.toString().trim()}`)
    return 2
  }
  const paths = listed.stdout.toString().split('\0').filter(Boolean)
  for (const path of paths) {
    const content = Bun.spawnSync({
      cmd: ['git', 'show', `:${path}`],
      stdout: 'pipe',
      stderr: 'pipe',
    })
    if (content.exitCode !== 0) {
      console.error(`${path}: unable to read staged content: ${content.stderr.toString().trim()}`)
      return 2
    }
    let formatted: string
    try {
      formatted = formatMarkdownCodeBlocks(content.stdout.toString())
    } catch (error) {
      console.error(`${path}: ${error instanceof Error ? error.message : String(error)}`)
      return 2
    }
    if (formatted !== content.stdout.toString()) {
      console.error(`${path} is not formatted`)
      return 1
    }
  }
  return 0
}

if (import.meta.main) process.exit(main())
