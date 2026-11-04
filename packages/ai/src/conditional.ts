// Original work by the same author.

/** What a preset installs, by kind. Conditions test membership of one kind. */
export type Availability = {
  skills: ReadonlySet<string>;
  agents: ReadonlySet<string>;
  commands: ReadonlySet<string>;
};

const MARKER = /<!--[ \t]*(if:(.*?)|\/if)[ \t]*-->/gu;
const CONDITIONAL = /<!--[ \t]*(\/if|if:)/u;
const CONDITION = /^(skill|agent|command)=([a-z0-9]+(?:-[a-z0-9]+)*)$/u;

/** Markers are install directives, not prose: reference scans skip them. */
export function withoutMarkers(text: string): string {
  return text.replace(MARKER, "");
}

// Author pattern for inline drops: put the space after the opener, so a
// dropped block leaves no double space:
//   `...format.<!-- if:skill=x --> See `x`.<!-- /if --> Next...`
// Marker-only lines vanish entirely, so conditional table rows and list
// items drop cleanly. Nesting allowed (inner evaluated only when outer
// keeps). Unknown kinds, unknown names, and unbalanced markers throw:
// a typo must fail the install loudly, never strip content silently.
export function resolveConditionals(
  text: string,
  avail: Availability,
  universe?: Availability,
): string {
  if (!CONDITIONAL.test(text)) return text;
  const stack: boolean[] = [];
  const out: string[] = [];
  let pos = 0;
  for (const match of text.matchAll(MARKER)) {
    const at = match.index ?? 0;
    let from = at;
    let to = at + match[0].length;
    // A marker alone on its line removes the whole line.
    const lineStart = text.lastIndexOf("\n", at - 1) + 1;
    const lineEnd = text.indexOf("\n", to);
    const end = lineEnd < 0 ? text.length : lineEnd;
    if (text.slice(lineStart, from).trim() === "" && text.slice(to, end).trim() === "") {
      from = lineStart;
      to = end < text.length ? end + 1 : end;
    }
    if (stack.every(Boolean)) out.push(text.slice(pos, from));
    pos = to;
    if (match[1] === "/if") {
      if (stack.pop() === undefined) throw new Error("unbalanced conditional: `<!-- /if -->` without opener");
    } else {
      const condition = CONDITION.exec(match[2] ?? "");
      if (condition === null) throw new Error(`bad conditional: "<!-- if:${match[2] ?? ""} -->" (want kind=name)`);
      const kind = condition[1] as "skill" | "agent" | "command";
      const name = condition[2] ?? "";
      const pool = kind === "skill" ? universe?.skills : kind === "agent" ? universe?.agents : universe?.commands;
      if (pool !== undefined && !pool.has(name)) {
        throw new Error(`unknown conditional target: ${kind} "${name}" is not in this kit`);
      }
      const have = kind === "skill" ? avail.skills : kind === "agent" ? avail.agents : avail.commands;
      stack.push(have.has(name));
    }
  }
  if (stack.length > 0) throw new Error("unbalanced conditional: `<!-- if: ... -->` without closer");
  if (stack.every(Boolean)) out.push(text.slice(pos));
  // Prettier blanks marker blocks, which splits tables a dropped row sat
  // in; rejoin rows (a blank line inside a table is always such an
  // artifact: prettier never emits one). Keep conditionals out of the gap
  // between two adjacent tables, where a blank is load-bearing.
  return out
    .join("")
    .replace(/(?<=\n\|[^\n]*)\n+(?=\|)/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}
