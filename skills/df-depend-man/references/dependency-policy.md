# Dependency Policy

- Add a direct dependency only when production or test code owns the API boundary; never rely on a transitive dependency by accident.
- Keep runtime, test, build-plugin, annotation-processing, optional, peer, and workspace scopes explicit.
- Reject duplicate libraries, multiple incompatible major versions, convenience wrappers that duplicate platform capabilities, and dependencies used for one trivial helper without a measured need.
- A new dependency record must name purpose, call sites, alternatives, scope, license/security review, and removal proof.
- `--fix` requires explicit authorization, a diff/backup, and a successful focused verification. Uncertain or reflective usage remains a review finding.
