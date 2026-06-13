# Characterization Tests

The goal of a characterization test is to freeze current observable behavior so structural changes do not drift. Do not name obviously wrong behavior as the desired contract; mark it as current compatibility behavior or as a bug candidate.

## What To Cover

- Happy paths and awkward edge cases callers may depend on.
- Return values, error types, error codes, or key messages.
- Persistence count, key fields, filtering, ordering, pagination metadata, and nested/aggregate shape.
- Collaborator insert/update/delete/bind/publish/cache-eviction/notification calls.
- Transaction behavior: one transaction for the whole operation or one per item; continue or stop after failure.
- Import, export, synchronization, and batching: request sequence, sizes, ordering, type selection, sequence numbers, and termination conditions per page, batch, or item.

## Capturing Parameters

When behavior depends on constructed objects, capture and assert them:

- Pagination requests, sorting rules, and query specs.
- Batch size, page index, and continuation condition.
- Type markers, callbacks, filenames, and boundary metadata.
- Key fields in command/result objects.

Do not assert only the first call. Pagination and batching should assert the full sequence.

## Test Naming

Use behavior-oriented names, for example:

- `export_givenMultiplePages_shouldKeepSequenceAcrossPages`
- `create_givenInvalidOwner_shouldThrowBusinessException`
- `list_givenDefaultParams_shouldDelegateWithDefaultPageSize`
- `validate_givenLegacyInvalidInput_shouldKeepCurrent500ForCompatibility`

The last example is suitable only for compatibility characterization. If the goal is to fix a bug, write a separate desired-behavior test.

## Good Enough

A characterization test should fail when a common future mistake changes behavior. If it only verifies "called a method" or "did not throw," it is usually too weak.
