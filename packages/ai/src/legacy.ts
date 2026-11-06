// Original work by the same author.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { kitDir } from "./kit.js";

type Hashes = { agents: Record<string, string[]>; commands: Record<string, string[]> };

let cached: Hashes | undefined;

function load(): Hashes {
  if (cached) return cached;
  const read = tryCatch(() => JSON.parse(readFileSync(join(kitDir(), "legacy-hashes.json"), "utf8")) as Partial<Hashes>);
  cached = { agents: read.ok ? (read.value.agents ?? {}) : {}, commands: read.ok ? (read.value.commands ?? {}) : {} };
  return cached;
}

/** The short content hash `kit/legacy-hashes.json` uses: sha256 of the LF text, first 16 hex digits. */
export function shortHash(text: string): string {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
}

/**
 * True when `text` is a copy of the kit rather than user work: the project's
 * current source for it, or any version `init` shipped before (by hash).
 */
export function isKitCopy(kind: "agents" | "commands", name: string, text: string, source: string | undefined): boolean {
  const normalized = text.replace(/\r\n/g, "\n");
  if (source !== undefined && normalized === source.replace(/\r\n/g, "\n")) return true;
  const known = load()[kind][name];
  return known !== undefined && known.includes(shortHash(normalized));
}
