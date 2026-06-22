import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import type { StateStore } from "./types"

let _statePathEnv = "DEVFLOW_MAIN_AGENT_WRITE_STATE"
let _statePath = join(tmpdir(), `devflow-main-agent-write-sessions-${process.getuid?.() ?? 0}.json`)

export function setStatePathForTest(path: string): void {
  _statePath = path
  _statePathEnv = "DEVFLOW_MAIN_AGENT_WRITE_STATE"
}

export function getStatePathEnv(): string {
  return _statePathEnv
}

export function statePath(): string {
  const configured = process.env[_statePathEnv]
  return configured ?? _statePath
}

export function loadState(): StateStore {
  const path = statePath()
  try {
    if (!existsSync(path)) return {}
    const raw = readFileSync(path, "utf-8")
    const value = JSON.parse(raw)
    return value && typeof value === "object" && !Array.isArray(value) ? value as StateStore : {}
  } catch {
    return {}
  }
}

export function saveState(state: StateStore): void {
  const path = statePath()
  const dir = dirname(path)
  mkdirSync(dir, { recursive: true })

  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8")
  renameSync(tmp, path)
}

export function isRegisteredSubagentSession(sessionId: string): boolean {
  return sessionId in loadState()
}
