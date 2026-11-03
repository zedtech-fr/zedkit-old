import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Agent instructions that name a file the repo no longer has send coding agents to dead code (audit v6: a removed
// suggest client was still prescribed, with its old fallback). Every `lib/…` or `apps/docs/lib/…` path they cite must exist.
const docs = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(docs, "..", "..");
const sources = [join(docs, "AGENTS.md"), join(root, "deploy", "AGENTS.md")];

test("agent instructions only cite docs lib files that exist", () => {
  for (const source of sources) {
    const text = readFileSync(source, "utf8");
    const cited = [...text.matchAll(/`((?:apps\/docs\/)?lib\/[\w./-]+\.(?:ts|tsx|mjs))`/g)].map((m) => m[1]);
    for (const path of cited) {
      const file = path.startsWith("apps/") ? join(root, path) : join(docs, path);
      assert.ok(existsSync(file), `${source} cites ${path}, which does not exist`);
    }
  }
});
