---
name: ground-truth
description: "No guessing: verify every claim against the source before relying on it or stating it. Use before using an API, flag, file, schema, version, event shape or model name you have not seen in this session, and before saying something works, passes or is done."
---

# Ground truth

A claim is either **verified** (you saw it in this session) or **unverified** (you remember it, inferred it, or it looks right). Only verified claims go into code, plans and answers. Unverified ones get verified or labelled.

## Before you rely on a thing

| You are about to rely on                               | Verify by                                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| A function, type, export, flag                         | Open its definition. Do not trust the name.                                                                |
| A file or path                                         | List or read it.                                                                                           |
| A payload, schema, event or DB column                  | Read the producer and the consumer, or the migration. Never infer a shape from a sibling.                  |
| A dependency API                                       | Read the installed version's types or docs, not memory. A new version may have changed it.                 |
| A command or script                                    | Read it in the manifest (`package.json`, `Makefile`). Run it.                                              |
| A model name or config key                             | List what the tool accepts (its model picker, CLI help, docs). An unknown value often falls back silently. |
| A function that "does the same" as the one you replace | Read both bodies. Same name is not same behavior.                                                          |
| "It was like that before"                              | `git show <ref>:<path>`                                                                                    |

If you cannot verify: say so, name what is missing, ask or choose the reversible option. Never fill the gap with a plausible guess.

## Before you say it is done

- You ran the check, on the final state of the code, and you read its output. "Should pass" is not a result.
- A green run only counts if it covers the claim: a one-file test does not prove the whole package.
- State what you did not run or could not check. One line.

## Evidence format

Cite the place: `path/to/file.ts:42`, a command and its exit code, or a link. A claim without a place is a guess.

## Search, then read

1. Search narrowly (symbol, string, path) to find candidates.
2. Read only the matching range of each file.
3. When two sources disagree, the code that runs beats docs, which beat comments, which beat memory. Report the conflict.

## Red flags in your own output

- "Probably", "should", "I believe", "usually" next to a fact you could check.
- A name you typed from memory: import path, option, CLI flag, header, enum value.
- A version number, URL or id you did not just read.
- A test you updated to match new behavior without checking the old behavior was wrong.

## Subagents

A subagent's report is a claim, not evidence. When it drives a decision, open the cited file yourself. Brief subagents to return `file:line` for every finding.
