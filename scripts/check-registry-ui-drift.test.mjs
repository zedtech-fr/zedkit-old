import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("check-registry-ui-drift rebuilds registry/ui then fails on git diff", () => {
  const script = readFileSync(join("scripts", "check-registry-ui-drift.sh"), "utf8");
  assert.match(script, /pnpm registry:build/);
  assert.match(script, /git diff.*registry\/ui/);
});
