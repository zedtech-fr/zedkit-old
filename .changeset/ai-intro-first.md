---
"@zedtech/zedkit-ai": patch
---

`validate --setup` now requires an `intro-first:` line in the plan appendix, so a skipped intro fails mechanically instead of passing silently. The setup-ai skill also makes the resume intro resume-aware: on a resume it opens with `resumed at phase <X>` instead of the fresh-start phase-A wording.
