#!/usr/bin/env node
/**
 * Inventory raw font-size / duration / ease in apps/docs (for signature criterion 1).
 * Strict guard remains check-raw-css-values.mjs (font-size, animation-duration,
 * transition-duration properties only). This script lists shorthand transitions,
 * animation delays, and Tailwind text-* in dock + /docs/* paths for PR tables.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const CSS_STRICT = /(?:^|[{;}])\s*(font-size|animation-duration|transition-duration)\s*:\s*([^;}{]+)/gi;
const CSS_SHORTHAND_MS = /\b(?:animation|transition)\s*:[^;{}]*\b\d+(?:\.\d+)?ms\b/gi;
const CSS_EASE_RAW = /\b(?:animation|transition)\s*:[^;{}]*\b(?:ease-in-out|ease-out|ease-in|cubic-bezier)\b/gi;
const TW_SIZE = /\btext-(xs|sm|base|lg|xl|\[[^\]]+\])\b/g;

const DOCK_DOCS_TSX = /^(components\/identity-|components\/demos\/identity-)/;
const OUT_OF_SCOPE_CSS = new Set([
  "app/home-hero.css",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === "out") continue;
      walk(path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

const rows = [];

for (const file of walk(appRoot)) {
  const rel = relative(appRoot, file);
  if (file.endsWith(".css")) {
    const src = stripComments(readFileSync(file, "utf8"));
    for (const match of src.matchAll(CSS_STRICT)) {
      const value = (match[2] ?? "").trim();
      if (/^(var\(|inherit|unset|initial|revert)/i.test(value)) continue;
      rows.push({ kind: "css-strict", file: rel, detail: `${match[1]}: ${value}` });
    }
    if (!OUT_OF_SCOPE_CSS.has(rel)) {
      for (const match of src.matchAll(CSS_SHORTHAND_MS)) {
        if (/var\s*\(/.test(match[0])) continue;
        rows.push({ kind: "css-shorthand-ms", file: rel, detail: match[0].trim().slice(0, 120) });
      }
      for (const match of src.matchAll(CSS_EASE_RAW)) {
        if (/var\s*\(/.test(match[0])) continue;
        rows.push({ kind: "css-shorthand-ease", file: rel, detail: match[0].trim().slice(0, 120) });
      }
    }
  }
  if (file.endsWith(".tsx") && DOCK_DOCS_TSX.test(rel)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!TW_SIZE.test(line)) return;
      TW_SIZE.lastIndex = 0;
      const hits = [...line.matchAll(TW_SIZE)].map((m) => m[0]);
      rows.push({ kind: "tsx-tailwind-type", file: rel, detail: `L${index + 1}: ${hits.join(", ")}` });
    });
  }
}

const strict = rows.filter((r) => r.kind === "css-strict");
const inScope = rows.filter((r) => r.kind !== "css-strict" || r.file.startsWith("app/docs-") || r.file.startsWith("app/identity-") || r.file === "app/site-compact.css");

console.log("# Signature raw-value inventory (apps/docs)\n");
console.log(`Generated: ${new Date().toISOString()}\n`);
console.log("## Strict-property offenders (must be empty for CI)\n");
if (strict.length === 0) console.log("- none\n");
else for (const r of strict) console.log(`- \`${r.file}\`: ${r.detail}`);

console.log("\n## In-scope shorthand / Tailwind (target: tokenise or CSS sheet)\n");
console.log("| Kind | File | Detail |");
console.log("|---|---|---|");
for (const r of inScope.filter((x) => x.kind !== "css-strict")) {
  console.log(`| ${r.kind} | \`${r.file}\` | ${r.detail.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")} |`);
}

console.log("\n## Out of scope (marketing home; tracked separately)\n");
for (const name of OUT_OF_SCOPE_CSS) {
  const path = join(appRoot, name);
  const src = stripComments(readFileSync(path, "utf8"));
  const ms = [...src.matchAll(CSS_SHORTHAND_MS)];
  console.log(`- \`${name}\`: ${ms.length} shorthand rules with raw ms`);
}

if (strict.length > 0) process.exit(1);
