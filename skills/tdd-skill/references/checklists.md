# Checklists

## Before Editing

- Has `tdd_start` been emitted?
- Can the target behavior be stated in one sentence?
- Is the stable boundary clear?
- Is the task type clear: `greenfield_feature`, `bug_fix`, `pure_refactor`, or `characterize_then_fix`?
- Which test will go red first?
- Why will the test fail because of the target risk rather than incidental implementation details?
- Which public contracts, error semantics, ordering, pagination, consistency, security behavior, or side effects must not change?
- For greenfield work, is the first useful behavior observable through a stable boundary before production implementation exists?
- Has wrong behavior been characterized? If so, is the plan to preserve it or continue fixing it explicit?

## Test Quality

- Does the test name state the condition and outcome?
- Does one test fail for one clear reason?
- Does the test name avoid "and" or "also" unless the outcomes are inseparable?
- Does the test assert important behavior rather than only no exception?
- Are important parameters asserted exactly or captured?
- Is test data minimal and named by business meaning?
- Is the test layer narrow enough while still covering the real risk?
- Should the test remain green when internal refactoring does not change external behavior?
- Would the new test really fail before the production change?
- Would the test fail if the production behavior were removed or deliberately mutated?

## TDD Smells

- Missing `tdd_start`, `tdd_state`, or `tdd_finish`, making the process uncheckable.
- Production refactoring happened first and tests were added afterward.
- Production code was kept after a TDD violation without recreating a meaningful RED signal.
- "Too small to test", "tests will be added later", "manual verification is enough", or "only plumbing" was used to skip RED.
- Tests verify implementation structure and fail even when behavior is unchanged.
- Tests mostly verify mocks, broad matchers, or setup rather than observable behavior.
- Wrong contracts were characterized without saying whether they are preserved or fixed.
- Tests cover only the first item, page, or batch while production behavior repeats.
- The failing test was not observed, or the failure reason is unrelated to the target risk.
- Naming, extracting classes, formatting, or other structural cleanup is mixed into a red state.

## When Stuck

- Can the desired assertion be written first, even before setup is complete?
- Is the chosen boundary too unstable or too internal?
- Is a hard-to-write test revealing hidden coupling, unclear API shape, or a missing domain concept?
- Would a narrower core test or a real integration slice remove excessive mocks?
- Can the first behavior slice be smaller while still observable?

## Before Finishing

- Has `tdd_finish` been emitted?
- Is there RED evidence for key tests, or an explanation for why the evidence cannot be retained?
- Have the smallest relevant tests passed?
- If public contracts, persistence, consistency, security, or external systems are involved, have broader checks been run or explicitly called out as not run?
- Are moved responsibilities protected by behavior tests at the new owner?
- Does the final report list protected behavior, stable boundary, test layer, design change, files, command results, and risks?
