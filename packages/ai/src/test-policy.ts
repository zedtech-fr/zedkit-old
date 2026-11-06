// Original work by the same author.
/** Fill AGENTS.md Commands: observed scripts stay listed; e2e is never the recommendation. */

const E2E = /e2e|playwright|cypress|puppeteer|webdriver/iu;
const GATE = /^(dev|start|typecheck|lint|test|test:.*|build|check)$/u;
const RECOMMENDED = /^(test|test:unit|test:integration)$/u;

export function isObservedE2e(name: string, command = ""): boolean {
  return E2E.test(name) || E2E.test(command);
}

export function applyTestPolicyToAgentsMd(
  markdown: string,
  scripts?: Record<string, string>,
): string {
  if (scripts === undefined) return markdown;
  const entries = Object.entries(scripts).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && GATE.test(entry[0]),
  );
  if (entries.length === 0) return markdown;
  const observed = entries.map(([name, command]) => {
    const line = `pnpm ${name}`;
    return isObservedE2e(name, command) ? `${line}  # observed; not the desired recommendation` : line;
  });
  const recommended = entries
    .filter(([name, command]) => RECOMMENDED.test(name) && !isObservedE2e(name, command))
    .map(([name]) => `pnpm ${name}`);
  let next = replaceFenceAfter(markdown, "### Observed commands", observed.join("\n"));
  if (recommended.length > 0) {
    next = replaceFenceAfter(next, "### Test recommendation", recommended.join("\n"));
  }
  return next;
}

function replaceFenceAfter(markdown: string, heading: string, body: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return markdown;
  const fence = markdown.indexOf("```sh", start);
  const nextHeading = markdown.indexOf("\n### ", start + heading.length);
  const nextH2 = markdown.indexOf("\n## ", start + heading.length);
  const sectionEnd = Math.min(
    ...[nextHeading, nextH2, markdown.length].filter((n) => n >= 0),
  );
  if (fence < 0 || fence > sectionEnd) {
    const insertAt = sectionEnd;
    const block = `\n\`\`\`sh\n${body}\n\`\`\`\n`;
    return `${markdown.slice(0, insertAt)}${block}${markdown.slice(insertAt)}`;
  }
  const openEnd = markdown.indexOf("\n", fence);
  const close = markdown.indexOf("\n```", openEnd);
  if (openEnd < 0 || close < 0) return markdown;
  return `${markdown.slice(0, openEnd + 1)}${body}${markdown.slice(close)}`;
}
