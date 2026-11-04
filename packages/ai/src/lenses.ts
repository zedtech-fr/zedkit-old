// Original work by the same author.

export type LensIssue = { path: string; message: string };

const NAME = /`([a-z0-9]+(?:-[a-z0-9]+)*)`/gu;

function runnerNames(cell: string): string[] {
  return [...cell.matchAll(NAME)].map((match) => match[1] ?? "").filter(Boolean);
}

function lensCells(line: string): string[] | undefined {
  if (!line.startsWith("|")) return undefined;
  const cells = line.split("|");
  const lens = cells[1]?.trim() ?? "";
  if (!lens || lens === "Lens" || /^:?-{3,}:?$/.test(lens)) return undefined;
  return cells;
}

function runnersInstalled(cell: string, installed: ReadonlySet<string>): boolean {
  const names = runnerNames(cell);
  return names.length > 0 && names.every((name) => installed.has(name));
}

/** Rewrite `lenses.md` Status to `exists` when every runner is installed, else `planned`. */
export function setLensStatus(text: string, installed: ReadonlySet<string>): string {
  return text
    .split("\n")
    .map((line) => {
      const cells = lensCells(line);
      if (cells === undefined || cells[3] === undefined) return line;
      const status = runnersInstalled(cells[2] ?? "", installed) ? "exists" : "planned";
      cells[3] = ` ${status} `;
      return cells.join("|");
    })
    .join("\n");
}

/** `Status: exists` is only valid when every named runner is installed. */
export function lensClosureIssues(
  path: string,
  text: string,
  installed: ReadonlySet<string>,
): LensIssue[] {
  const issues: LensIssue[] = [];
  for (const line of text.split("\n")) {
    const cells = lensCells(line);
    if (cells === undefined) continue;
    const lens = cells[1]?.trim() ?? "";
    const status = cells[3]?.trim() ?? "";
    if (status !== "exists") continue;
    for (const name of runnerNames(cells[2] ?? "")) {
      if (!installed.has(name)) {
        issues.push({
          path,
          message: `lens "${lens}" marks runner "${name}" as exists, but it is not installed`,
        });
      }
    }
  }
  return issues;
}
