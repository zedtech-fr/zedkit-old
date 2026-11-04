---
name: persona-review
description: "Review a deliverable from the point of view of the people who will use or run it, with evidence. Use before shipping an API, feature, doc or tool, when asked for a persona or acceptance review, or to check a change serves its real audience."
---

# Persona review

A change can be correct and still useless to the person it is for. Name the audience, run their real task, report what you observed.

## Steps

1. **Name the recipient** of the deliverable and the task they are trying to do. If the repo's docs do not say, ask.
2. **Pick 2 to 4 personas** whose view differs. First read the repo's `.agents/personas.md` (kit template: v1 Task/Bar columns, or v2 Goals / jobs / frustrations / journeys / evidence / routes). Use the columns that are present. Fall back to these generics only when the file is missing:

| Persona                                | Question                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Stressed user (rushed, anxious)        | Can I get through fast without losing anything, see that it is saved, and never face a naked spinner? |
| Lazy end client (distracted, doubtful) | Can I finish on a phone, interrupted, on flaky network, and resume where I left off?                  |
| Integrating developer                  | Can I adopt it from the README and examples alone?                                                    |
| Coding agent                           | Can I consume it programmatically, with stable names and runnable examples?                           |
| Maintainer / operator                  | Can I see what happened, repair it, and replay it without losing data?                                |
| New contributor                        | Can I make a first correct change from discoverable conventions and runnable tests?                   |
| Security reviewer                      | Can I verify isolation, authorization and secret handling from tests and code?                        |
| Business owner                         | Does it solve the stated problem, and what does it cost to adopt?                                     |

3. **Run the task as each persona.** Follow the real path: copy the quickstart, call the endpoint, read the error, break the input. Do not reason from the diff alone.
4. **Back each verdict with evidence**: a command and its output, a test name, a file and line, a screenshot. No evidence, no verdict.
5. **Report per persona**: Pass, Pass with a rough edge, or Fail. Name the rough edge and the owner or next step. State honest gaps instead of hiding them.

## In parallel

Personas are independent. Give each to a subagent with the brief from `parallel-work` (deliverable, task, how to run it, output shape), then merge. Pair persona review with deterministic tests: personas find what tests do not think of, tests keep it from regressing.

## Output

```
Persona: <name> — task: <what they try>
Verdict: Pass | Pass with rough edge | Fail
Evidence: <command/test/file:line>
Gap: <what is missing, and next step>
```
