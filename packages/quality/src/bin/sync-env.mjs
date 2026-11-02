#!/usr/bin/env node
// Keeps .env complete across pulls: copy from .env.example on first run,
// otherwise append keys that the example gained. Existing values are never
// overwritten. Commented-out example keys (#FOO=) stay opt-in.
import { copyFileSync, existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const KEY_PATTERN = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=/;

function keyOf(line) {
  const match = KEY_PATTERN.exec(line);
  return match ? match[1] : null;
}

/**
 * Lines from the example whose keys are absent from the env text.
 * Pure (unit tested); the caller decides where they go.
 */
export function missingExampleLines(exampleContent, envContent) {
  const present = new Set();
  for (const line of envContent.split("\n")) {
    const key = keyOf(line.trim());
    if (key) present.add(key);
  }
  const missing = [];
  for (const line of exampleContent.split("\n")) {
    const key = keyOf(line);
    if (key && !present.has(key)) {
      present.add(key);
      missing.push(line);
    }
  }
  return missing;
}

export function syncEnv(root) {
  const examplePath = join(root, ".env.example");
  const envPath = join(root, ".env");
  if (!existsSync(examplePath)) {
    throw new Error(`sync-env: missing ${examplePath}`);
  }
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.log("created .env from .env.example (dev-only, never commit it)");
    return { created: true, added: [] };
  }
  const missing = missingExampleLines(
    readFileSync(examplePath, "utf8"),
    readFileSync(envPath, "utf8"),
  );
  if (missing.length === 0) {
    console.log(".env already complete (no missing keys)");
    return { created: false, added: [] };
  }
  const envText = readFileSync(envPath, "utf8");
  const prefix = envText.length === 0 || envText.endsWith("\n") ? "" : "\n";
  const block =
    "# Appended from .env.example defaults.\n" + missing.join("\n") + "\n";
  writeFileSync(envPath, envText + prefix + block);
  const added = missing.map((line) => keyOf(line));
  console.log(`.env: appended missing keys: ${added.join(", ")}`);
  return { created: false, added };
}

function invokedAsCli() {
  if (process.argv[1] === undefined) return false;
  if (!existsSync(process.argv[1])) {
    return pathToFileURL(process.argv[1]).href === import.meta.url;
  }
  return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
}

function usage() {
  return "Usage: zedkit-sync-env [root]\nCopies .env.example to .env when missing; otherwise appends missing keys.";
}

if (invokedAsCli()) {
  const arg = process.argv[2];
  if (arg === "--help" || arg === "-h") {
    console.log(usage());
  } else if (arg !== undefined && arg.startsWith("-")) {
    console.error(`zedkit-sync-env: unknown argument "${arg}"\n${usage()}`);
    process.exitCode = 2;
  } else {
    syncEnv(arg ?? process.cwd());
  }
}
