---
description: "Set up or improve this repo's AI setup from what it contains."
---

Before anything else, tell the user in plain language what is about to happen (modes fresh/improve, phases A-E, what they get, about 15-45 minutes, they approve the plan before writes and answer one batched interview), using the **Tell the user first** block of the `setup-ai` skill. Print that as the opening text of your first reply, before any tool call, and **continue in the same turn without waiting** for the user. Then run the `setup-ai` skill on `$ARGUMENTS` (the text after the command, or the current context when empty). Do not end your turn after the intro; the only stop points are the phase B batched interview, plan approval before writes, and the final report.
