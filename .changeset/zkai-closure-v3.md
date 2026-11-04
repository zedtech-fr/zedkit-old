---
"@zedtech/zedkit-ai": minor
---

Reference closure v3: validate detects hyphenated kit names (e.g. `a11y-auditor`) as whole words anywhere in kit-origin installed files, not only when backticked — single-word names stay backtick-only so prose never false-positives. The `ui-designer` handoffs line and the `verifier` UI-design verdict now use install-time availability blocks so presets without those agents stay closed. New broken-relative-link check over kit-origin installed files (skips web links, `#anchors`, and fenced code); the `domain-modeling` glossary example, the `setup-ts-deep-modules` README pointer, and the `wayfinder` ticket-index example render paths as code instead of dead links.
