#!/usr/bin/env bun

import { closeSync, fstatSync, openSync, readFileSync, readSync, writeSync } from 'node:fs'
import { runLoggedScript } from '@/shared/script-logger'

const EVENT_KEYS = new Set(['tdd_start', 'tdd_state', 'tdd_boundary_scan', 'tdd_finish'])

function checkpointLine(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('checkpoint event is required')

  let event: unknown
  try {
    event = JSON.parse(trimmed)
  } catch {
    throw new Error('checkpoint event must be one JSON object')
  }

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error('checkpoint event must be one JSON object')
  }

  const keys = Object.keys(event)
  if (keys.length !== 1 || !EVENT_KEYS.has(keys[0])) {
    throw new Error('checkpoint event must contain exactly one of tdd_start, tdd_state, tdd_boundary_scan, or tdd_finish')
  }

  const payload = (event as Record<string, unknown>)[keys[0]]
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`${keys[0]} must contain an object payload`)
  }

  return `${JSON.stringify(event)}\n`
}

export function appendCheckpoint(path: string, text: string): void {
  const line = checkpointLine(text)
  const descriptor = openSync(path, 'a+', 0o600)

  try {
    const size = fstatSync(descriptor).size
    if (size > 0) {
      const finalByte = Buffer.alloc(1)
      readSync(descriptor, finalByte, 0, 1, size - 1)
      if (finalByte[0] !== 0x0a) {
        throw new Error('existing checkpoint must end with a newline before another event can be appended')
      }
    }
    writeSync(descriptor, line)
  } finally {
    closeSync(descriptor)
  }
}

function readStdin(): string {
  const chunks: Buffer[] = []
  const buffer = Buffer.alloc(65536)
  let bytesRead = readSync(0, buffer, 0, buffer.length, null)
  while (bytesRead > 0) {
    chunks.push(Buffer.from(buffer.subarray(0, bytesRead)))
    bytesRead = readSync(0, buffer, 0, buffer.length, null)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

function main(): number {
  const args = Bun.argv.slice(2)
  let checkpointPath = ''
  let inputPath = ''

  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--checkpoint' && index + 1 < args.length) {
      checkpointPath = args[++index]
    } else if (args[index] === '--input' && index + 1 < args.length) {
      inputPath = args[++index]
    }
  }

  if (!checkpointPath) {
    console.error('Usage: append-tdd-checkpoint.ts --checkpoint <file> [--input <event.json>]')
    return 1
  }

  appendCheckpoint(checkpointPath, inputPath ? readFileSync(inputPath, 'utf-8') : readStdin())
  console.log('TDD checkpoint appended')
  return 0
}

if (import.meta.main) {
  process.exit(runLoggedScript({ scriptName: 'append-tdd-checkpoint' }, () => main()))
}
