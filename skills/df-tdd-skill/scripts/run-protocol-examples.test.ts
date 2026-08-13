import { beforeAll, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = import.meta.dir!
const EXAMPLES = join(ROOT, '..', 'examples')
const SKILL = join(ROOT, '..', 'SKILL.md')
const HOOK_PROTOCOL = join(ROOT, '..', 'references', 'hook-protocol.md')

function extractTypeScriptBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/```typescript\s*\n([\s\S]*?)```/g)].map((match) => match[1])
}

type ValidateFunc = (stage: string, text: string) => string[]

let validate: ValidateFunc

beforeAll(async () => {
  const mod = await import('./validate-tdd-protocol')
  validate = mod.validate as ValidateFunc
})

const CASES = [
  {
    name: 'valid_finish',
    stage: 'finish',
    file: 'valid_finish.md',
    expectErrors: false,
  },
  {
    name: 'structured_finish',
    stage: 'finish',
    file: 'structured_finish.md',
    expectErrors: false,
  },
  {
    name: 'greenfield_finish',
    stage: 'finish',
    file: 'greenfield_finish.md',
    expectErrors: false,
  },
  {
    name: 'missing_start',
    stage: 'before_edit',
    file: 'missing_start.md',
    expectErrors: true,
  },
  {
    name: 'vague_red',
    stage: 'state',
    file: 'vague_red.md',
    expectErrors: true,
  },
]

describe('TDD Protocol Validation', () => {
  for (const testCase of CASES) {
    it(`${testCase.name} (${testCase.stage})`, () => {
      const filePath = join(EXAMPLES, testCase.file)
      const text = readFileSync(filePath, 'utf-8')
      const errors = validate(testCase.stage, text)

      if (testCase.expectErrors) {
        expect(errors.length).toBeGreaterThan(0)
      } else {
        expect(errors.length).toBe(0)
      }
    })
  }
})

describe('TDD Workflow Instructions', () => {
  it('retains checkpoints and requires typed state plus todo list updates', () => {
    const skill = readFileSync(SKILL, 'utf-8')
    const hookProtocol = readFileSync(HOOK_PROTOCOL, 'utf-8')

    expect(hookProtocol).toContain('必须永久保留')
    expect(hookProtocol).toContain('不得在任务完成后删除')
    expect(hookProtocol).not.toContain('任务完成后可以删除')

    expect(skill).toContain('```typescript')
    expect(`${skill}\n${hookProtocol}`).not.toContain('```d.ts')
    expect(skill).toContain('type TddPhase =')
    expect(skill).toContain('interface TddWorkflowState')
    expect(skill).toContain('as const satisfies TddWorkflowState')
    expect(skill).toContain('update_plan')
    expect(skill).toContain('todolist')
    expect(skill).toContain('只有 1 个 `in_progress`')
  })

  it('formats every TypeScript definition as a documented standalone block', () => {
    const skill = readFileSync(SKILL, 'utf-8')
    const hookProtocol = readFileSync(HOOK_PROTOCOL, 'utf-8')
    const markdown = `${skill}\n${hookProtocol}`
    const blocks = extractTypeScriptBlocks(markdown)

    expect(skill).not.toContain('用以下 TypeScript 契约描述当前 TDD 状态，不要只用 RED、GREEN 等口述标签：')
    expect(skill).not.toContain('每次向用户报告当前状态时，输出符合此契约的 `typescript` code block')
    expect(blocks.length).toBeGreaterThan(0)

    for (const block of blocks) {
      const definitions = block.match(/^(?:type|interface|const|declare const)\s+/gm)
      expect(definitions?.length).toBe(1)
      expect(block).toContain('/**')
      expect(block).not.toMatch(/"[^"\n]*"/)
      expect(block).not.toContain(';')
    }
  })
})
