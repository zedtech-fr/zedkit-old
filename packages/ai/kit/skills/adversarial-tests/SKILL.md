---
name: adversarial-tests
description: "Find the edge cases a change must be tested against: boundary inputs, bad shapes, failing dependencies, duplicates, state order. Use when writing or reviewing tests for new or changed logic, handlers, consumers, endpoints or repositories."
---

# Adversarial tests

Tests that only show the code working prove little. Aim them at how it breaks. A suite of happy paths gives false confidence.

## Pick the test type first

| Test                                                             | Use it for                                                                             | Not for                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Unit                                                             | one decision: guard, branch, mapping, error classification                             | full flows, wiring                                   |
| Integration (real DB, real queue or in-memory fake that behaves) | data access, transactions, constraints                                                 | logic branches                                       |
| Contract / Pact                                                  | producer/consumer schemas, API compatibility                                           | UI journeys, a default suite                         |
| End-to-end through the public entry (HTTP, message, CLI)         | an explicitly justified critical user path: success, documented failure, garbage input | every internal branch, a default browser/E2E battery |

**Layer:** unit and integration tests are primary. Contract or Pact tests when a boundary earns them. End-to-end through the public entry only for an explicitly justified critical user path — not a default browser/E2E CI battery, not an arbitrary E2E count or budget. Observed CI is not the desired recommendation; do not delete or change existing CI unless the owner asked.

Do not mock the database or the thing under test. Fake only what you do not own (network, clock, third parties).

## Attack list

Take every item that applies to the code. At least one test per relevant item.

**Inputs**

- Each optional parameter as `null`, as `undefined`, and omitted. `false` and `0` versus missing.
- Empty string, array, object. Zero, negative, `NaN`, `Infinity`, max safe integer.
- Too long, odd characters, unicode, injection strings.

**Shapes**

- Required field missing. Present but `null`. Wrong type. Extra unknown fields. Array where one value is expected, and the reverse.

**Dependencies**

- Throws: is the error propagated, not swallowed or rewrapped?
- Returns `undefined`, an empty list, or a value missing optional fields.
- Slow, timing out, answering 5xx or a malformed body.

**State and time**

- Calling again with identical input: is the second call harmless?
- Two concurrent calls: race, lost update?
- Wrong order: finish before start, act on a deleted item.
- Unknown enum or version value: a newer producer must not crash an older consumer.

**Business rules**

- Valid shape that breaks a rule. Cross-tenant or cross-user access: denied and indistinguishable from "not found".

## Rules

- A bug fix starts with a test that fails for the right reason.
- Name tests by behavior ("rejects expired token"), not by function.
- One reason to fail per test. No logic (loops, branches) inside tests.
- Deterministic: no real network, no wall clock, no shared state between tests.
- Removing or loosening a test needs a written reason in the PR.

## Self-check before done

For each function, handler or endpoint written or changed:

- [ ] Happy path, in the right test type
- [ ] Each guard clause and early exit is exercised by a test
- [ ] Each error type it can raise is asserted somewhere
- [ ] Null, empty and unknown-value inputs, where accepted
- [ ] Each collaborator failing, and returning nothing
- [ ] Duplicate delivery or repeat call, where it can happen
- [ ] A test that would fail if the main branch of the code were deleted
