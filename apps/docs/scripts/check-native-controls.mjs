#!/usr/bin/env node
/**
 * Docs UI guard: no raw native <select> outside the identity editor toolbar
 * (migrate to kit Select over time).
 */
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowSuffixes = ["components/identity-editor-toolbar.tsx", "components/demo-style-scope.tsx"];

function isAllowed(file) {
  const rel = file.slice(root.length + 1);
  return allowSuffixes.some((suffix) => rel.endsWith(suffix));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === "out") continue;
      walk(path, out);
    } else if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
      out.push(path);
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(root)) {
  if (isAllowed(file)) continue;
  const src = readFileSync(file, "utf8");
  if (/<select[\s/>]/.test(src)) offenders.push(file.slice(root.length + 1));
}

if (offenders.length > 0) {
  console.error("Native <select> is banned in apps/docs UI. Use @zedtech/zedkit-ui Select.\n");
  for (const path of offenders) console.error(`  ${path}`);
  process.exit(1);
}
