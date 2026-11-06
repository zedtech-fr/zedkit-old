// Original work by the same author.

/** What `zedkit-ai sync` knows about one tool's agent files. Data, not code: each row says when it was checked. */
export type ProviderKeys = {
  /** Directory the tool reads agents from, relative to the project; undefined when sync writes nothing for it. */
  agentsDir: string | undefined;
  /** Whether the tool has a per-agent effort key that was seen to work. */
  effortKey: boolean;
  /** Printed once per sync run for this provider. */
  note: string;
  /** Date of the check this row comes from (YYYY-MM-DD). */
  checked: string;
};

/** Providers sync generates agent files for. */
export const GENERATED_PROVIDERS = ["cursor", "claude"] as const;
export type GeneratedProvider = (typeof GENERATED_PROVIDERS)[number];

export function isGenerated(provider: string): provider is GeneratedProvider {
  return (GENERATED_PROVIDERS as readonly string[]).includes(provider);
}

/**
 * Cursor: `model` must be unquoted (a quoted id is read with its quotes and
 * falls back to the session model); an unknown id falls back to the session
 * model with a runtime note and no error. `readonly: true` is enforced but
 * switches the agent into a mode that refuses commands that write, which the
 * kit's gate-running agents need, so it is not generated. `disallowedTools`
 * is tolerated and not enforced, so it is kept as written. A spawn may
 * override the model only with a slug from a short allowlist. Cursor reads
 * `.cursor/agents` before `.claude/agents` and lists a name once.
 *
 * Claude Code could not be run where this table was written, so nothing is
 * claimed for it: the generated file keeps `disallowedTools` and gets the
 * route's model written as the same plain scalar.
 *
 * Muse reads only `.agents/agents`, and only regular files, so there is
 * nothing to generate for it. The kit's read-only agents carry Claude tool
 * names in `disallowedTools`, which Muse Code 1.4.14 rejects at spawn.
 */
export const PROVIDER_KEYS: Readonly<Record<string, ProviderKeys>> = {
  cursor: {
    agentsDir: ".cursor/agents",
    effortKey: false,
    note: "effort ignored for cursor (no per-agent field)",
    checked: "2026-11-05",
  },
  claude: {
    agentsDir: ".claude/agents",
    effortKey: false,
    note: "effort ignored for claude (no per-agent key verified)",
    checked: "2026-11-05",
  },
  codex: {
    agentsDir: undefined,
    effortKey: false,
    note: "codex reads .agents directly: nothing generated",
    checked: "2026-11-05",
  },
  muse: {
    agentsDir: undefined,
    effortKey: false,
    note: "muse reads .agents/agents directly and needs regular files there: nothing generated",
    checked: "2026-11-05",
  },
};
