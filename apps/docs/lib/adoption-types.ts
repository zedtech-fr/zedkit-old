import type { PackageManager } from "./package-manager-commands";

/** The shapes `buildAdoptionPlan` (adoption-plan.mjs) returns: ids and data, no words. */
export type AdoptionBlock =
  | { kind: "command"; commands: Record<PackageManager, string> }
  | {
      kind: "file";
      path: string;
      lang: "tsx" | "ts" | "css" | "json";
      code: string;
      action: "create" | "replace" | "append" | "merge";
      role?: "main" | "companion";
    }
  | { kind: "snippet"; title?: string; lang: "tsx" | "ts"; code: string };

export type AdoptionStep = {
  id: string;
  params?: { brick?: string; files?: number; packages?: string[] };
  blocks: AdoptionBlock[];
};

export type AdoptionMode = {
  id: "package" | "cli" | "manual";
  group: "package" | "copy";
  gives: "package-ui" | "package-lib" | "cli" | "manual";
  requires: ("stack" | "runtime" | "shadcn")[];
  steps: AdoptionStep[];
};

export type AdoptionPlan = { need: string; packageName: string; modes: AdoptionMode[] };

/** Where a block's rendered code is kept: the server highlights by this key, the client reads by it. */
export function blockKey(mode: string, step: string, index: number): string {
  return `${mode}.${step}.${index}`;
}
