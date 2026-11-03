#!/usr/bin/env node
/**
 * Docs CSS guard: font-size and animation/transition-duration must use tokens
 * (`var(...)`) or inherit. Raw rem/px/ms/clamp live on the token, not the rule.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), "..");
const PROP = /(?:^|[{;}])\s*(font-size|animation-duration|transition-duration)\s*:\s*([^;}{]+)/gi;
const OK = /^(var\(|inherit|unset|initial|revert)/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === "out") continue;
      walk(path, out);
    } else if (path.endsWith(".css")) {
      out.push(path);
    }
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

const offenders = [];
for (const file of walk(root)) {
  const src = stripComments(readFileSync(file, "utf8"));
  for (const match of src.matchAll(PROP)) {
    const value = (match[2] ?? "").trim();
    if (!value || OK.test(value)) continue;
    const line = src.slice(0, match.index).split("\n").length;
    offenders.push(`${file.slice(root.length + 1)}:${line} ${match[1]}: ${value}`);
  }
}

if (offenders.length > 0) {
  console.error("Raw font-size / duration in apps/docs CSS. Use a type or motion token.\n");
  for (const row of offenders) console.error(`  ${row}`);
  process.exit(1);
}
