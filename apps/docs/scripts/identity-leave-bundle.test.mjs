import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

const {
  IDENTITY_LEAVE_AI_INIT,
  IDENTITY_LEAVE_AI_SLASH,
  IDENTITY_LEAVE_INSTALL,
  identityLeaveBundle,
} = await import("../lib/identity-leave-bundle.ts");

const SNIPPETS = join(import.meta.dirname, "..", "home-quickstart", "snippets");

test("leave bundle install and AI commands match home quickstart snippets", () => {
  assert.equal(IDENTITY_LEAVE_INSTALL, readFileSync(join(SNIPPETS, "install.sh"), "utf8").trim());
  assert.equal(IDENTITY_LEAVE_AI_INIT, readFileSync(join(SNIPPETS, "ai-init.sh"), "utf8").trim());
  assert.equal(IDENTITY_LEAVE_AI_SLASH, "/setup-ai");
});

test("leave bundle CSS uses :root like the editor export parity test", () => {
  const bundle = identityLeaveBundle(identityPresets.glass);
  assert.match(bundle, /# Install\npnpm add @zedtech\/zedkit-ui/);
  assert.match(bundle, /# Theme CSS \(matches preview\)\n:root \{/);
  assert.match(bundle, /:root\.dark \{/);
  assert.match(bundle, /# AI setup\nnpx @zedtech\/zedkit-ai init\n\/setup-ai/);
});
