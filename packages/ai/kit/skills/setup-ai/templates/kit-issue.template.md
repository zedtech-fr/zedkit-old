# Kit issue draft

One draft per setup friction caused by the kit. Paste it into the kit repo's issue tracker as its own issue.

Public-safe only: no private repo names, customer data, internal URLs, or people. Rewrite the repro with the fictional Acme Bookings sample (slots, cancellation, refund) when the real one is private.

## Title

Short, public-safe, naming the kit behavior (not the adopter repo).

## What happened

What the agent had to do, step by step, including any manual file copy, config edit, or detour outside the documented flow. Quote the transcript where it helps.

## Expected

What the documented flow says should happen instead.

## Kit root cause

Which kit file or behavior caused the friction (for example `setup-ai` SKILL phase C sidecar step, validate message, CLI next-step).

## Kit file

Path in the **installed kit** (`.agents/skills/setup-ai/…` in the repo) or **runtime package** (`node_modules/@zedtech/zedkit-ai/kit/…`). Run **`test -e`** on that path before filing. Kit monorepo authors may use `packages/ai/kit/…`. If you cannot verify, write **`UNVERIFIED: <why>`** instead of guessing.

## Proposed fix

One concrete change: what the kit should do differently, and which existing test (or a new test to add) would catch a regression.

## Repro

Minimal steps on a fixture repo, using fictional content only.
