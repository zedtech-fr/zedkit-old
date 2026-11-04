---
"@zedtech/zedkit-ai": patch
---

Setup-ai gate logs: document a `TERM`/`INT` trap so a signaled wrapper shell still writes the cause and `EXIT:` tail instead of leaving a shapeless killed log. A `SIGKILL`ed wrapper cannot trap — re-run smaller and replace the file.
