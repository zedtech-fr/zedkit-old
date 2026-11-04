// Original work by the same author.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";

/** Adopt sidecar path: `*.kit.md` for files, `zk-<name>` for skill folders. */
export function adoptRel(rel: string): string {
  const base = rel.split(sep).pop() ?? rel;
  const dir = dirname(rel);
  if (base.endsWith(".md")) return join(dir, base.replace(/\.md$/, ".kit.md"));
  return join(dir, `zk-${base}`);
}

export type KitManifest = {
  /** Preset name -> skill names, or "*" for every skill in the kit. */
  presets: Record<string, string[] | "*">;
  /** Subagent names (files in `agents/`). Default for every preset unless overridden. */
  agents: string[];
  /** Command names (files in `commands/`). Default for every preset unless overridden. */
  commands?: string[];
  /** Optional subagent subset per preset (e.g. `starter`). */
  presetAgents?: Record<string, string[]>;
  /** Optional command subset per preset (e.g. `starter`). */
  presetCommands?: Record<string, string[]>;
};

/** Absolute path of the bundled kit (same relative spot from `src/` and `dist/`). */
export function kitDir(): string {
  return fileURLToPath(new URL("../kit/", import.meta.url));
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function readManifest(dir: string = kitDir()): Result<KitManifest> {
  const read = tryCatch(() => JSON.parse(readFileSync(`${dir}/kit.json`, "utf8")) as unknown);
  if (!read.ok) {
    return err(new Error(`cannot read kit.json in ${dir}: ${read.error.message}`));
  }
  const data = read.value as {
    presets?: Record<string, unknown>;
    agents?: unknown;
    commands?: unknown;
    presetAgents?: unknown;
    presetCommands?: unknown;
  } | null;
  const presets = data?.presets;
  if (!presets || typeof presets !== "object" || !isStringList(data?.agents)) {
    return err(new Error("kit.json needs `presets` (object) and `agents` (string list)"));
  }
  if (data.commands !== undefined && !isStringList(data.commands)) {
    return err(new Error("kit.json `commands` must be a string list"));
  }
  for (const [name, value] of Object.entries(presets)) {
    if (value !== "*" && !isStringList(value)) {
      return err(new Error(`kit.json preset "${name}" must be a string list or "*"`));
    }
  }
  for (const [key, label] of [
    ["presetAgents", data?.presetAgents],
    ["presetCommands", data?.presetCommands],
  ] as const) {
    if (label === undefined) continue;
    if (typeof label !== "object" || label === null) {
      return err(new Error(`kit.json \`${key}\` must be an object`));
    }
    for (const [preset, names] of Object.entries(label)) {
      if (!isStringList(names)) {
        return err(new Error(`kit.json \`${key}.${preset}\` must be a string list`));
      }
    }
  }
  const manifest: KitManifest = {
    presets: presets as KitManifest["presets"],
    agents: data.agents,
  };
  if (data.commands !== undefined) manifest.commands = data.commands as string[];
  if (data.presetAgents !== undefined) manifest.presetAgents = data.presetAgents as Record<string, string[]>;
  if (data.presetCommands !== undefined) manifest.presetCommands = data.presetCommands as Record<string, string[]>;
  return ok(manifest);
}

/** Subagents installed for a preset (full manifest list when not narrowed). */
export function agentsForPreset(manifest: KitManifest, preset: string): string[] {
  return manifest.presetAgents?.[preset] ?? manifest.agents;
}

/** Commands installed for a preset (full manifest list when not narrowed). */
export function commandsForPreset(manifest: KitManifest, preset: string): string[] {
  return manifest.presetCommands?.[preset] ?? manifest.commands ?? [];
}

export type KitUniverse = { skills: Set<string>; agents: Set<string>; commands: Set<string> };

/** Every installable name in a kit dir: skill folders, agent/command stems. Missing dirs read as empty (minimal foreign kits). */
export function kitUniverse(dir: string = kitDir()): KitUniverse {
  const skills = tryCatch(() => readdirSync(`${dir}/skills`, { withFileTypes: true }));
  const stems = (sub: string): Set<string> => {
    const files = tryCatch(() => readdirSync(`${dir}/${sub}`));
    if (!files.ok) return new Set();
    return new Set(files.value.filter((file) => file.endsWith(".md")).map((file) => file.replace(/\.md$/, "")));
  };
  return {
    skills: new Set(
      skills.ok ? skills.value.filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [],
    ),
    agents: stems("agents"),
    commands: stems("commands"),
  };
}
