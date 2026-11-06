---
"@zedtech/zedkit-ui": patch
---

Add `WordRoll` for inline vertical word cycling with `data-animate="fade-up"` enter and `data-word-roll` exit (`zk-word-roll-exit-up` in `motion.css`). `IdentityScript` emits its bootstrap only during SSR/hydration so Next.js 16 no longer warns about a client-created `<script>`.
