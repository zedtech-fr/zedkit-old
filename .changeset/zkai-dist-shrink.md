---
"@zedtech/zedkit-ai": patch
---

Dist size review (no behavior change): CLI help text lives in shipped `kit/usage.txt` instead of inline, and duplicated logic is merged behind shared seams (drift sidecar/user-copy compare, frontmatter parse, provider skills-dir and layer-copy wiring, kit universe as sets, adopt sidecar path). Gzip(dist) 17540 → 17148; budget lowered to 17400.
