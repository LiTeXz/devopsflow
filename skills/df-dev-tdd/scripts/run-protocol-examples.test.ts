import { beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { appendCheckpoint } from './append-tdd-checkpoint'

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = import.meta.dir!
const EXAMPLES = join(ROOT, '..', 'examples')
const SKILL = join(ROOT, '..', 'SKILL.md')
const HOOK_PROTOCOL = join(ROOT, '..', 'references', 'hook-protocol.md')

const START_EVENT =
  '{"tdd_start":{"task_type":"bug_fix","protected_behavior":"reject duplicate transfer","stable_boundary":"transfer command","first_test_to_write":"rejects duplicate request id","expected_red_reason":"duplicate request is accepted","current_contract_wrong":false,"wrong_contract_plan":"none"}}'
const TEST_WRITTEN_EVENT = '{"tdd_state":{"phase":"test_written","evidence":"focused test exists"}}'
const RED_EVENT =
  '{"tdd_state":{"phase":"red_observed","command":"bun test transfer.test.ts","exit_code":1,"evidence":"RED fails because duplicate request is accepted"}}'
const GREEN_EVENT = '{"tdd_state":{"phase":"green_reached","command":"bun test transfer.test.ts","exit_code":0,"evidence":"duplicate request is rejected"}}'
const BOUNDARY_SCAN_EVENT =
  '{"tdd_boundary_scan":{"trigger_test":"rejects duplicate request id","stable_boundary":"transfer command","dimensions_considered":["state_sequence","time_concurrency"],"candidates":[{"dimension":"state_sequence","counterexample":"same request id submitted twice","risk":"duplicate debit","disposition":"current_slice","test_layer":"component","rationale":"directly challenges the active behavior"},{"dimension":"time_concurrency","counterexample":"two matching requests race","risk":"duplicate debit under concurrency","disposition":"next_slice","test_layer":"integration","rationale":"requires a separate concurrency fixture"}]}}'
const FINISH_EVENT =
  '{"tdd_finish":{"task_type":"bug_fix","red_observed":true,"green_reached":true,"refactor_performed":false,"tests_run":[{"phase":"red","command":"bun test transfer.test.ts","exit_code":1,"evidence":"duplicate request was accepted"},{"phase":"green","command":"bun test transfer.test.ts","exit_code":0,"evidence":"duplicate request is rejected"}],"current_contract_wrong":false,"wrong_contract_characterized":false,"wrong_contract_fixed":false,"residual_risk":"concurrency remains a next slice"}}'

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

  it('rejects appended start and finish records that supersede earlier audit events', () => {
    const duplicateStart = [readFileSync(join(EXAMPLES, 'valid_finish.md'), 'utf-8'), '{"tdd_start":{"task_type":"bug_fix"}}'].join('\n')
    const duplicateFinish = [readFileSync(join(EXAMPLES, 'valid_finish.md'), 'utf-8'), '{"tdd_finish":{"task_type":"bug_fix"}}'].join('\n')

    expect(validate('finish', duplicateStart)).toContain('tdd_start must appear exactly once; found 2 append-only records')
    expect(validate('finish', duplicateFinish)).toContain('tdd_finish must appear exactly once; found 2 append-only records')
  })

  it('requires boundary discovery after RED and before GREEN', () => {
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan is required after red_observed and before green_reached')
  })

  it('rejects boundary discovery recorded before RED', () => {
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, BOUNDARY_SCAN_EVENT, RED_EVENT, GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1] must appear after red_observed and before green_reached')
  })

  it('rejects boundary discovery recorded after GREEN', () => {
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, GREEN_EVENT, BOUNDARY_SCAN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1] must appear after red_observed and before green_reached')
  })

  it('rejects boundary candidates without a supported disposition', () => {
    const unsupported = BOUNDARY_SCAN_EVENT.replace('"current_slice"', '"implement_all"')
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, unsupported, GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1].candidates[1].disposition must be one of current_slice, deferred, next_slice')
  })

  it('keeps at most one boundary candidate in the current implementation slice', () => {
    const competingCurrentSlices = BOUNDARY_SCAN_EVENT.replace('"disposition":"next_slice"', '"disposition":"current_slice"')
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, competingCurrentSlices, GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1].candidates must contain at most one current_slice')
  })

  it('requires a reason when boundary discovery finds no candidates', () => {
    const event = JSON.parse(BOUNDARY_SCAN_EVENT) as { tdd_boundary_scan: Record<string, unknown> }
    event.tdd_boundary_scan.candidates = []
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, JSON.stringify(event), GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1].none_found_reason is required when candidates is empty')
  })

  it('rejects blank boundary dimensions', () => {
    const event = JSON.parse(BOUNDARY_SCAN_EVENT) as { tdd_boundary_scan: Record<string, unknown> }
    event.tdd_boundary_scan.dimensions_considered = ['state_sequence', '  ']
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, JSON.stringify(event), GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1].dimensions_considered must contain only non-blank strings')
  })

  it('rejects a ceremonial none-found reason', () => {
    const event = JSON.parse(BOUNDARY_SCAN_EVENT) as { tdd_boundary_scan: Record<string, unknown> }
    event.tdd_boundary_scan.candidates = []
    event.tdd_boundary_scan.none_found_reason = 'not applicable'
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, JSON.stringify(event), GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_boundary_scan[1].none_found_reason must describe the explored boundary evidence')
  })

  it('supports one boundary scan for each RED-to-GREEN behavior slice', () => {
    const protocol = [
      START_EVENT,
      TEST_WRITTEN_EVENT,
      RED_EVENT,
      BOUNDARY_SCAN_EVENT,
      GREEN_EVENT,
      RED_EVENT,
      BOUNDARY_SCAN_EVENT,
      GREEN_EVENT,
      FINISH_EVENT,
    ].join('\n')

    expect(validate('finish', protocol)).toEqual([])
  })

  it('allows only one current slice across repeated scans in the same RED-to-GREEN interval', () => {
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, BOUNDARY_SCAN_EVENT, BOUNDARY_SCAN_EVENT, GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('RED-to-GREEN boundary scans must contain at most one current_slice in total')
  })

  it('keeps earlier scans in the interval when RED evidence is appended again', () => {
    const protocol = [START_EVENT, TEST_WRITTEN_EVENT, RED_EVENT, BOUNDARY_SCAN_EVENT, RED_EVENT, BOUNDARY_SCAN_EVENT, GREEN_EVENT, FINISH_EVENT].join('\n')

    expect(validate('finish', protocol)).toContain('RED-to-GREEN boundary scans must contain at most one current_slice in total')
  })

  it('rejects finish while the trailing boundary slice is still RED', () => {
    const protocol = [
      START_EVENT,
      TEST_WRITTEN_EVENT,
      RED_EVENT,
      BOUNDARY_SCAN_EVENT,
      GREEN_EVENT,
      TEST_WRITTEN_EVENT,
      RED_EVENT,
      BOUNDARY_SCAN_EVENT,
      FINISH_EVENT,
    ].join('\n')

    expect(validate('finish', protocol)).toContain('tdd_finish cannot follow an unfinished RED-to-GREEN boundary slice')
  })
})

describe('TDD Checkpoint Storage', () => {
  it('appends an immutable JSONL event without changing existing bytes', () => {
    const directory = mkdtempSync(join(tmpdir(), 'devopsflow-tdd-'))
    const checkpoint = join(directory, 'task.jsonl')
    const existing = '{"tdd_start":{"task_type":"bug_fix"}}\n'

    try {
      writeFileSync(checkpoint, existing, 'utf-8')
      appendCheckpoint(checkpoint, '{"tdd_state":{"phase":"test_written","evidence":"focused test exists"}}')

      const stored = readFileSync(checkpoint, 'utf-8')
      expect(stored.slice(0, existing.length)).toBe(existing)
      expect(stored).toBe(`${existing}{"tdd_state":{"phase":"test_written","evidence":"focused test exists"}}\n`)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('accepts a boundary discovery event as one append-only record', () => {
    const directory = mkdtempSync(join(tmpdir(), 'devopsflow-tdd-boundary-'))
    const checkpoint = join(directory, 'task.jsonl')

    try {
      appendCheckpoint(checkpoint, BOUNDARY_SCAN_EVENT)
      expect(readFileSync(checkpoint, 'utf-8')).toBe(`${BOUNDARY_SCAN_EVENT}\n`)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

describe('TDD Workflow Instructions', () => {
  it('retains append-only checkpoints and requires todo list updates', () => {
    const skill = readFileSync(SKILL, 'utf-8')
    const hookProtocol = readFileSync(HOOK_PROTOCOL, 'utf-8')

    expect(hookProtocol).toContain('必须永久保留')
    expect(hookProtocol).toContain('不得在任务完成后删除')
    expect(hookProtocol).not.toContain('任务完成后可以删除')
    expect(`${skill}\n${hookProtocol}`).toContain('append-only')
    expect(`${skill}\n${hookProtocol}`).toContain('不得修改、替换或删除任何已写入的行')

    expect(skill).toContain('```typescript')
    expect(`${skill}\n${hookProtocol}`).not.toContain('```d.ts')
    expect(skill).toContain('type TddPhase =')
    expect(skill).toContain('type TddCheckpointEvent')
    expect(skill).not.toContain('interface TddWorkflowState')
    expect(skill).not.toContain('const currentTddState')
    expect(skill).toContain('update_plan')
    expect(skill).toContain('todolist')
    expect(skill).toContain('只有 1 个 `in_progress`')
  })

  it('requires a boundary discovery burst between meaningful RED and implementation', () => {
    const skill = readFileSync(SKILL, 'utf-8')

    expect(skill).toContain('## Boundary Discovery Burst')
    expect(skill).toContain('templates/tdd_boundary_scan.jsonl')
    expect(skill).toContain('references/boundary-discovery.md')
    expect(skill).toContain('`current_slice` 最多只能有 1 个')
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
    }
  })
})
