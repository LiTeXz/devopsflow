# Debugging Tactics

Use the smallest useful observation:

- failing unit or integration test
- one added assertion
- temporary log at the boundary where state changes
- debugger breakpoint
- query against persisted state
- contract replay or captured request

When reproduction is difficult:

1. Capture the exact environment, input, seed, time, timezone, and data version.
2. Reduce the scenario until the failure disappears, then restore the last necessary condition.
3. Compare a known-good path and failing path at the same boundary.
4. Add a regression test for the reduced case once the cause is known.

Remove temporary diagnostics before completion unless they are converted into useful tests or structured logging.
