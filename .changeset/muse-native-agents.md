---
"@zedtech/zedkit-ai": minor
---

`zedkit-ai sync` writes Muse-native agent files (closed frontmatter, Muse `disallowedTools`) as marked regular files in `.agents/agents`. Unmarked and kit files stay the canonical source. Cursor check-kind agents get `readonly: true`. Sync never writes through a symlink.
