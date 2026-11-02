import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { DOCS_OMITTED_REDIRECTS } from "./docs-omitted-needs.mjs";
import { writeDocsOmittedRedirectStubs } from "./write-docs-omitted-redirects.mjs";

test("writes one stub html per omitted docs redirect", () => {
  const dir = mkdtempSync(join(tmpdir(), "docs-redir-"));
  writeDocsOmittedRedirectStubs(dir);
  for (const [pathname, target] of Object.entries(DOCS_OMITTED_REDIRECTS)) {
    const file = join(dir, `${pathname.replace(/^\//, "")}.html`);
    const html = readFileSync(file, "utf8");
    assert.match(html, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /location\.replace/);
  }
});
