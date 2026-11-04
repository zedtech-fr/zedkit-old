---
description: "Set up or improve this repo's AI setup from what it contains."
---

Before anything else, tell the user in plain language what is about to happen (modes fresh/improve, phases A-E, what they get, about 15-45 minutes, they approve the plan before writes and answer one batched interview), using the **Tell the user first** block of the `setup-ai` skill. Do that as your very first message, before any tool call. Then run the `setup-ai` skill on `$ARGUMENTS` (the text after the command, or the current context when empty).
