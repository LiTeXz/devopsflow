import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

const AGENT_INSTRUCTION_EXTENSION = /\.(?:json|md|toml|ya?ml)$/i

export function normalizedPath(path: string): string {
  return path.replaceAll('\\', '/')
}

export function isGovernedFile(relativePath: string): boolean {
  const normalized = normalizedPath(relativePath)
  if (basename(normalized) === 'AGENTS.md') return true
  if (normalized.startsWith('agents/') && AGENT_INSTRUCTION_EXTENSION.test(normalized)) {
    return true
  }
  if (!normalized.startsWith('skills/')) return false
  if (normalized.endsWith('/SKILL.md')) return true
  return /\/agents\/.+\.(?:json|md|toml|ya?ml)$/i.test(normalized)
}

export function findGovernedFiles(projectRoot: string): string[] {
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) return []
  const governedFiles: string[] = []
  const ignoredDirectories = new Set(['.git', 'node_modules'])

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) visit(join(directory, entry.name))
        continue
      }
      if (!entry.isFile()) continue
      const path = join(directory, entry.name)
      if (isGovernedFile(relative(projectRoot, path))) governedFiles.push(path)
    }
  }

  visit(projectRoot)
  return governedFiles.sort((firstPath, secondPath) => firstPath.localeCompare(secondPath))
}
