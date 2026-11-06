---
"@zedtech/zedkit-ai": minor
---

Breaking: `init` and `setup` write each tool's agent files with `sync`, and `validate` checks them the same way. Generated files keep the model in `.agents/tokenomics.md`, the `.claude/agents` link becomes a real directory, and Cursor commands become one link each. Existing copies of kit files are replaced; your own files stay, with the kit version beside them. Migration: copied .cursor/agents -> generated (run `npx zedkit-ai sync`); see docs/migrations/zedkit-ai-tokenomics.md.
