---
"@zedtech/zedkit-ai": patch
---

Validate now checks relative markdown links in every skill directory, including repo-authored skills the kit does not ship (previously only kit skills were scanned, so broken links in agent-written skills passed silently). Also skips `mailto:` links, and the post-setup hint points past phase C once `.agents/product.md` exists instead of repeating the phase C note.
