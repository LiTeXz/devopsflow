# Style Packs

Style packs are project-owned reference material that help agents preserve a repository's implementation style after the business design is clear.

They are not shared DevFlow templates and should not live inside this public skill unless they are generic examples. Concrete project examples belong in the target repository.

## When To Use

Use a style pack when:

- DDD, CQRS, API, or workflow decisions have already clarified what behavior should exist.
- The task maps to a repeated implementation shape such as commands, events, aggregates, projections, controllers, jobs, imports, exports, tests, migrations, or adapters.
- Multiple valid code styles could implement the same behavior, and local consistency matters.
- A refactor is moving code from a legacy pattern toward an explicitly selected target pattern.

Do not use a style pack to override confirmed business rules, security requirements, validation semantics, persistence constraints, or public contracts.

## Discovery Locations

Search project-owned material in this order:

1. Explicit user-provided paths or names.
2. `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and local workflow docs that name style packs.
3. `devflow-style-packs/`
4. `.devflow/style-packs/`
5. `.ai/style-packs/`
6. `docs/devflow/style-packs/`
7. `docs/patterns/`, `examples/`, `reference/`, and `references/`

If a style pack conflicts with current production code, prefer current production code unless the task is explicitly to migrate toward the style pack.

## Recommended Shape

```text
devflow-style-packs/
  <style-pack-name>/
    style-pack.yaml
    rules.md
    examples/
      <golden-example files>
    anti-patterns.md
    review-checklist.md
```

`style-pack.yaml` should describe the scope, applicable task types, primary examples, verification commands, and known exclusions.

`rules.md` should contain concise rules that affect implementation choices, naming, layering, error handling, transaction boundaries, tests, or projection behavior.

`examples/` should contain complete golden examples or small focused excerpts. Prefer one high-quality realistic example over many empty scaffolds.

`anti-patterns.md` should describe shapes agents must avoid, especially legacy structures that look similar but should not be copied.

`review-checklist.md` should list the style-specific checks reviewers expect before handoff.

## How Agents Should Use A Style Pack

1. Select the closest applicable style pack and record why it fits.
2. Read only the relevant rules, examples, anti-patterns, and checklist entries.
3. Classify each discovered example as `target_pattern`, `legacy_pattern`, `anti_pattern`, `behavior_evidence`, or `unknown`.
4. State the conventions that must be preserved and the exact delta required by the task.
5. Pass the selected style pack, target examples, preserved conventions, and delta to implementation planning.
6. During verification, report which style pack was used and whether the implementation still matches its review checklist.

## Good Style Pack Material

- It is owned by the project that uses it.
- It shows complete naming, layering, dependency direction, tests, and verification style.
- It explains why a pattern exists when the reason is not obvious.
- It contains negative examples or explicit "do not copy" notes for attractive legacy shapes.
- It is small enough for an agent to read before coding.

## Poor Style Pack Material

- Empty fill-in templates that encourage mechanical copy/paste.
- Long source dumps without selection guidance.
- Project-private information inside a public skill repository.
- Stale examples that contradict current production code without saying they are migration targets.
- Rules that duplicate business decisions already owned by DDD, API design, security policy, or persistence constraints.
