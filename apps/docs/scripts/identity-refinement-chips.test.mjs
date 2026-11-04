import assert from "node:assert/strict";
import test from "node:test";

const { identityRefinementChips } = await import("../lib/identity-refinement-chips.ts");

test("refinement chips cover calmer, contrast, type, and accent", () => {
  assert.ok(identityRefinementChips.length >= 4);
  const ids = identityRefinementChips.map((chip) => chip.id);
  assert.deepEqual(ids, ["calmer", "contrast", "type-swap", "accent"]);
  for (const chip of identityRefinementChips) {
    assert.ok(chip.label.length > 0);
    assert.ok(chip.prompt.length >= 20);
  }
});
