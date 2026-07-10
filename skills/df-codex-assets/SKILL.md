---
name: df-codex-assets
description: "Bootstrap DevOpsFlow Codex hook runtime assets into an installed plugin mirror before other hooks run."
---

# DevOpsFlow Codex Asset Bootstrap

This internal skill carries the bootstrap script and expected hash for DevOpsFlow's managed Codex runtime assets.

The SessionStart hook runs `scripts/df-codex-assets.ts hydrate` before the runtime hook scripts. The script verifies the managed asset hash and, when an installed plugin mirror is missing those assets, downloads the versioned files from the matching GitHub tag.
