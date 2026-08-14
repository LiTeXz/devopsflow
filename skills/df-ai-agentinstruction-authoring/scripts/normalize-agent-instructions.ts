#!/usr/bin/env bun

import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findGovernedFiles, normalizedPath } from './instruction-files'

interface LiteralRule {
  from: string
  to: string | string[]
}

interface ContextualRule {
  name: string
  pattern: string
  flags?: string
  to: string | string[]
}

interface Vocabulary {
  literalRules: LiteralRule[]
  forbiddenCharacterRules?: LiteralRule[]
  contextualRules: ContextualRule[]
  punctuationRules: LiteralRule[]
  allowedNonAsciiSymbols: string[]
}

export interface NormalizationIssue {
  message: string
}

export type NormalizeMode = 'check' | 'diff' | 'fix'

export interface NormalizeResult {
  changedFiles: string[]
  diffs: string[]
  issues: Array<{ path: string; message: string }>
}

export interface CliLogger {
  log(message: string): void
  error(message: string): void
}

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const DEFAULT_DICTIONARY_PATH = resolve(SCRIPT_DIRECTORY, '../dictionary/vocabulary.yaml')
const HAN = '\\p{Script=Han}'
const URL_PATTERN = /https?:\/\/[^\s)]+/g
const INLINE_CODE_PATTERN = /`[^`\r\n]*`/g
const LINK_DESTINATION_PATTERN = /(?<=\]\()[^)\r\n]+(?=\))/g
const MARKDOWN_LINK_PATTERN = /\[([^\]\r\n]+)\]\(([^)\r\n]+)\)/g
const ASSET_PATH_PATTERN = /(?:\.\.?\/)?assets\/[A-Za-z0-9._/-]+/g

export function loadVocabulary(path = DEFAULT_DICTIONARY_PATH): Vocabulary {
  const parsed = Bun.YAML.parse(readFileSync(path, 'utf-8')) as Vocabulary
  const forbiddenCharacterRules = parsed.forbiddenCharacterRules ?? []
  const sources = new Set<string>()
  for (const rule of [...parsed.literalRules, ...forbiddenCharacterRules, ...parsed.punctuationRules]) {
    if (sources.has(rule.from)) {
      throw new Error(`duplicate dictionary source "${rule.from}"`)
    }
    sources.add(rule.from)
  }
  return {
    ...parsed,
    forbiddenCharacterRules: [...forbiddenCharacterRules].sort((first, second) => second.from.length - first.from.length),
    literalRules: [...parsed.literalRules].sort((first, second) => second.from.length - first.from.length),
  }
}

const DEFAULT_VOCABULARY = loadVocabulary()

function translations(rule: LiteralRule | ContextualRule): string[] {
  return Array.isArray(rule.to) ? rule.to : [rule.to]
}

function canonicalTranslation(rule: LiteralRule | ContextualRule): string {
  const [canonical] = translations(rule)
  if (!canonical) {
    const name = 'from' in rule ? rule.from : rule.name
    throw new Error(`dictionary rule "${name}" has no translation`)
  }
  return canonical
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceLiteralRule(content: string, rule: LiteralRule): string {
  const replacement = canonicalTranslation(rule)
  const leadingBoundary = /^[A-Za-z0-9]/.test(rule.from) ? '(?<![A-Za-z0-9])' : ''
  const trailingBoundary = /[A-Za-z0-9]$/.test(rule.from) ? '(?![A-Za-z0-9])' : ''
  const pattern = new RegExp(`${leadingBoundary}${escapeRegExp(rule.from)}${trailingBoundary}`, 'g')
  return content.replace(pattern, (_match, offset: number) => {
    const before = content[offset - 1] ?? ''
    const after = content[offset + rule.from.length] ?? ''
    const needsLeadingSpace = before !== '' && /^[A-Za-z0-9]/.test(replacement) && /[\p{L}\p{N}]/u.test(before)
    const needsTrailingSpace = after !== '' && /[A-Za-z0-9]$/.test(replacement) && /[\p{L}\p{N}]/u.test(after)
    return `${needsLeadingSpace ? ' ' : ''}${replacement}${needsTrailingSpace ? ' ' : ''}`
  })
}

function normalizeSpacing(content: string, vocabulary: Vocabulary): string {
  const tokens = [
    ...vocabulary.literalRules.flatMap(translations),
    ...(vocabulary.forbiddenCharacterRules ?? []).filter((rule) => rule.from.length > 1).flatMap(translations),
    ...vocabulary.contextualRules.flatMap(translations),
  ]
    .filter((token, index, values) => values.indexOf(token) === index)
    .sort((first, second) => second.length - first.length)
  let normalized = content
  for (const token of tokens) {
    const escaped = escapeRegExp(token)
    normalized = normalized.replace(new RegExp(`(${HAN})(${escaped})`, 'gu'), '$1 $2').replace(new RegExp(`(${escaped})(${HAN})`, 'gu'), '$1 $2')
  }
  const tokenPattern = tokens.map(escapeRegExp).join('|')
  const joinedTokens = new RegExp(`(?<![A-Za-z0-9])(${tokenPattern})(${tokenPattern})(?![A-Za-z0-9])`, 'gu')
  const tokenSet = new Set(tokens)
  let previous: string
  do {
    previous = normalized
    normalized = normalized.replace(joinedTokens, (match, firstToken: string, secondToken: string) =>
      tokenSet.has(match) ? match : `${firstToken} ${secondToken}`,
    )
  } while (normalized !== previous)
  return normalized
    .replace(/(\S) {2,}(?=\S)/g, '$1 ')
    .replace(/(\p{Script=Han}) +(?=\p{Script=Han})/gu, '$1')
    .replace(/([A-Za-z0-9])(and|or|if)(?=[A-Z])/g, '$1 $2 ')
    .replace(/(\p{Script=Han})([A-Za-z])/gu, '$1 $2')
    .replace(/([A-Za-z])(\p{Script=Han})/gu, '$1 $2')
    .replace(/([,;:?])([A-Za-z\p{Script=Han}])/gu, '$1 $2')
    .replace(/\.(?!(?:md|toml|ya?ml|json|tsx?|jsx?|mjs|cjs|lock|io)\b)([A-Za-z\p{Script=Han}])/gu, '. $1')
}

function normalizeProse(content: string, vocabulary: Vocabulary): string {
  let normalized = content
  for (const rule of vocabulary.contextualRules) {
    normalized = normalized.replace(new RegExp(rule.pattern, rule.flags ?? 'gu'), canonicalTranslation(rule))
  }
  for (const rule of vocabulary.literalRules) {
    normalized = replaceLiteralRule(normalized, rule)
  }
  normalized = normalizeSpacing(normalized, vocabulary)
  for (const rule of vocabulary.punctuationRules) {
    normalized = normalized.replaceAll(rule.from, canonicalTranslation(rule))
  }
  return normalizeSpacing(normalized, vocabulary)
}

interface Span {
  start: number
  end: number
}

function protectedSpans(line: string): Span[] {
  const spans: Span[] = []
  for (const pattern of [URL_PATTERN, INLINE_CODE_PATTERN, LINK_DESTINATION_PATTERN, ASSET_PATH_PATTERN]) {
    pattern.lastIndex = 0
    for (let match = pattern.exec(line); match; match = pattern.exec(line)) {
      spans.push({ start: match.index, end: match.index + match[0].length })
    }
  }
  MARKDOWN_LINK_PATTERN.lastIndex = 0
  for (let match = MARKDOWN_LINK_PATTERN.exec(line); match; match = MARKDOWN_LINK_PATTERN.exec(line)) {
    const [, label, destination] = match
    if (label === basename(destination.replaceAll('\\', '/'))) {
      const start = match.index + 1
      spans.push({ start, end: start + label.length })
    }
  }
  return spans.sort((first, second) => first.start - second.start)
}

function normalizeLine(line: string, vocabulary: Vocabulary): string {
  if (
    /^<!-- (?:BEGIN|END):.*AGENTS\.md -->$/.test(line) ||
    /^<!-- (?:BEGIN_GLOBAL|BEGINE_GLOBAL|END_GLOBAL):~\/\.codex\/ -->$/.test(line) ||
    /^# (?:~\/\.codex\/)?(?:.*\/)?AGENTS\.md(?::.*)?$/.test(line)
  ) {
    return line
  }
  const spans = protectedSpans(line)
  if (!spans.length) return normalizeProse(line, vocabulary)
  let cursor = 0
  let normalized = ''
  for (const span of spans) {
    if (span.start < cursor) continue
    normalized += normalizeProse(line.slice(cursor, span.start), vocabulary)
    normalized += line.slice(span.start, span.end)
    cursor = span.end
  }
  return normalized + normalizeProse(line.slice(cursor), vocabulary)
}

function proseSegments(content: string): string[] {
  const segments: string[] = []
  let inFence = false
  for (const segment of content.split(/(?<=\n)/)) {
    const line = segment.endsWith('\n') ? segment.slice(0, -1) : segment
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const spans = protectedSpans(line)
    let cursor = 0
    for (const span of spans) {
      if (span.start < cursor) continue
      segments.push(line.slice(cursor, span.start))
      cursor = span.end
    }
    segments.push(line.slice(cursor))
  }
  return segments
}

export function findNormalizationIssues(content: string, vocabulary: Vocabulary = DEFAULT_VOCABULARY): NormalizationIssue[] {
  const allowedSymbols = new Set([...vocabulary.allowedNonAsciiSymbols, ...vocabulary.punctuationRules.map((rule) => rule.from)])
  const issues = new Map<string, NormalizationIssue>()
  for (const rule of vocabulary.forbiddenCharacterRules ?? []) {
    if (content.includes(rule.from)) {
      const codePoint = rule.from.codePointAt(0) ?? 0
      const message = `forbidden character U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
      issues.set(message, { message })
    }
  }
  for (const segment of proseSegments(content)) {
    for (const character of segment) {
      if (character.charCodeAt(0) > 0x7f && /[\p{P}\p{S}]/u.test(character) && !allowedSymbols.has(character)) {
        const codePoint = character.codePointAt(0) ?? 0
        const message = `unsupported symbol U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
        issues.set(message, { message })
      }
    }
  }
  return [...issues.values()]
}

export function normalizeInstructionText(content: string, vocabulary: Vocabulary = DEFAULT_VOCABULARY): string {
  let globallyNormalized = content
  for (const rule of vocabulary.forbiddenCharacterRules ?? []) {
    globallyNormalized = globallyNormalized.replaceAll(rule.from, canonicalTranslation(rule))
  }
  let inFence = false
  return globallyNormalized
    .split(/(?<=\n)/)
    .map((segment) => {
      const newline = segment.endsWith('\n') ? '\n' : ''
      const line = newline ? segment.slice(0, -1) : segment
      if (/^\s*```/.test(line)) {
        inFence = !inFence
        return segment
      }
      return inFence ? segment : normalizeLine(line, vocabulary) + newline
    })
    .join('')
}

function unifiedDiff(root: string, path: string, before: string, after: string): string {
  const relativePath = normalizedPath(relative(root, path))
  const beforeLines = before.trimEnd().split(/\r?\n/)
  const afterLines = after.trimEnd().split(/\r?\n/)
  return [
    `--- a/${relativePath}`,
    `+++ b/${relativePath}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`),
  ].join('\n')
}

export function normalizeGovernedFiles(projectRoot: string, mode: NormalizeMode, targetPath?: string): NormalizeResult {
  const changedFiles: string[] = []
  const diffs: string[] = []
  const issues: Array<{ path: string; message: string }> = []
  const paths = targetPath
    ? statSync(targetPath).isDirectory()
      ? findGovernedFiles(projectRoot).filter((path) => {
          const pathFromTarget = relative(targetPath, path)
          return pathFromTarget === '' || (!pathFromTarget.startsWith('..') && !isAbsolute(pathFromTarget))
        })
      : [targetPath]
    : findGovernedFiles(projectRoot)
  for (const path of paths) {
    const before = readFileSync(path, 'utf-8')
    const after = normalizeInstructionText(before)
    if (after !== before) {
      changedFiles.push(path)
      if (mode === 'fix') writeFileSync(path, after, 'utf-8')
      if (mode === 'diff') diffs.push(unifiedDiff(projectRoot, path, before, after))
    }
    const issueContent = mode === 'fix' ? after : before
    for (const issue of findNormalizationIssues(issueContent)) {
      issues.push({ path, message: issue.message })
    }
  }
  return { changedFiles, diffs, issues }
}

function usage(): string {
  return 'Usage: normalize-agent-instructions.ts [--root <project-root>] [--path <file-or-directory>] [--check | --diff | --fix]'
}

export function runNormalizeCli(argumentsList: readonly string[] = process.argv.slice(2), logger: CliLogger = console): number {
  let root = process.cwd()
  let targetPath: string | undefined
  let mode: NormalizeMode = 'check'
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--root' && argumentsList[index + 1]) {
      root = resolve(argumentsList[index + 1])
      index += 1
      continue
    }
    if (argument === '--path' && argumentsList[index + 1]) {
      targetPath = resolve(argumentsList[index + 1])
      index += 1
      continue
    }
    if (argument === '--check' || argument === '--diff' || argument === '--fix') {
      mode = argument.slice(2) as NormalizeMode
      continue
    }
    logger.error(usage())
    return 2
  }

  const result = normalizeGovernedFiles(root, mode, targetPath)
  if (mode === 'diff') {
    for (const diff of result.diffs) logger.log(diff)
  }
  if (mode === 'fix') {
    logger.log(`Normalized ${result.changedFiles.length} governed file(s).`)
    for (const issue of result.issues) {
      logger.error(`::error file=${issue.path}::${issue.message}`)
    }
    return result.issues.length ? 1 : 0
  }
  for (const issue of result.issues) {
    logger.error(`::error file=${issue.path}::${issue.message}`)
  }
  if (result.changedFiles.length || result.issues.length) {
    for (const path of result.changedFiles) {
      logger.error(`::error file=${path}::requires normalization`)
    }
    return 1
  }
  logger.log('Agent instruction normalization passed.')
  return 0
}

if (import.meta.main) process.exit(runNormalizeCli())
