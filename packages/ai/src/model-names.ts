// Original work by the same author.

/**
 * Built-in model-name patterns, one regex source per family. Id-shaped on
 * purpose: every family needs a digit or a vendor-qualified tail, so the
 * bare words "sonnet" / "opus" / "haiku", `claude-code` and `GEMINI.md`
 * stay clean. A new vendor needs no release: a project adds
 * `hardcode.extra_patterns` in its `tokenomics.md`.
 */
export const MODEL_FAMILIES: readonly { family: string; sources: readonly string[] }[] = [
  { family: "claude ids", sources: ["claude-(?:opus|sonnet|haiku|fable)[\\w.-]*", "claude-\\d[\\w.-]*"] },
  { family: "claude names with a version", sources: ["(?:sonnet|opus|haiku)[ -]?\\d+(?:[.-]\\d+)*"] },
  { family: "gpt and o-series", sources: ["gpt-?\\d[\\w.-]*", "o[134]-(?:mini|pro|preview)\\b"] },
  {
    family: "others",
    sources: [
      "gemini-?\\d[\\w.-]*",
      "grok-?\\d[\\w.-]*",
      "composer-?\\d[\\w.-]*",
      "llama-?\\d[\\w.-]*",
      "mistral-[\\w.-]+",
      "deepseek-[\\w.-]+",
      "qwen\\d[\\w.-]*",
    ],
  },
];

/** All built-in families as one alternation (word-bounded at the start; compile with the `i` flag). */
export const MODEL_NAME_SOURCE = `\\b(?:${MODEL_FAMILIES.flatMap((f) => f.sources).join("|")})`;

/** A regex source that matches `text` literally. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

/**
 * A project-declared model value worth matching literally. `inherit` is not
 * a name, and a letters-only alias (`fast`, `opus`) cannot be told from an
 * English word, so only id-shaped values (a digit or one of `-._:/@`) count.
 */
export function isPinnedId(value: unknown): value is string {
  return typeof value === "string" && value !== "inherit" && /[\d\-._:/@]/.test(value);
}
