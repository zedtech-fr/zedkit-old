// Shared assertions for generated catalog need pages. Used by check.mjs
// and by node:test so a missing install tab / description fails in unit
// tests, not only at docs build time.

export const LEGACY_DESCRIPTION =
  /^@zedtech\/[\w-]+ — (alpha|beta|stable|deprecated|planned)$/;

export const GUIDANCE_BULLETS = [
  "- **Who:**",
  "- **What:**",
  "- **Use when:**",
  "- **Avoid when:**",
];

export function readFrontmatterDescription(text) {
  const match = text.match(/^description: (.+)$/m);
  if (!match) return null;
  return JSON.parse(match[1]);
}

export function readFrontmatterTitle(text) {
  const match = text.match(/^title: (.+)$/m);
  if (!match) return null;
  return JSON.parse(match[1]);
}

/**
 * @param {string} rel
 * @param {string} text
 * @param {{ seoMax: number, descriptionsSeen: Map<string, string>, a11yByTitle?: Map<string, string> }} ctx
 * @param {string[]} errors
 */
export function checkGeneratedPage(rel, text, { seoMax, descriptionsSeen, a11yByTitle }, errors) {
  if (!rel.includes("/")) return;
  const description = readFrontmatterDescription(text);
  if (description === null) {
    errors.push(`generator: ${rel} lacks description frontmatter.`);
  } else {
    if (LEGACY_DESCRIPTION.test(description)) {
      errors.push(`generator: ${rel} uses legacy package — status description.`);
    }
    if (description.length > seoMax) {
      errors.push(`generator: ${rel} description exceeds ${seoMax} characters.`);
    }
    const prior = descriptionsSeen.get(description);
    if (prior) {
      errors.push(`generator: duplicate description on ${rel} and ${prior}.`);
    } else {
      descriptionsSeen.set(description, rel);
    }
  }
  if (text.includes("<ComponentPage")) {
    for (const label of GUIDANCE_BULLETS) {
      const prop =
        label === "- **Who:**"
          ? "audience={"
          : label === "- **Use when:**"
            ? "whenToUse={"
            : label === "- **Avoid when:**"
              ? "whenNotToUse={"
              : label === "- **What:**"
                ? "purpose={"
                : null;
      if (prop && !text.includes(prop)) {
        errors.push(`generator: ${rel} lacks ComponentPage guidance prop for "${label}".`);
      }
    }
    return;
  }
  if (!text.includes("## At a glance")) {
    errors.push(`generator: ${rel} lacks the At-a-glance guidance block.`);
  }
  for (const label of GUIDANCE_BULLETS) {
    if (!text.includes(label)) {
      errors.push(`generator: ${rel} lacks guidance bullet "${label}".`);
    }
  }
  if (!text.includes('<Tabs groupId="package-manager"')) {
    errors.push(`generator: ${rel} lacks install tabs.`);
  }
  if (!text.includes('```tsx title="Usage"')) {
    errors.push(`generator: ${rel} lacks a titled TSX example.`);
  }
  const a11y = a11yByTitle?.get(readFrontmatterTitle(text) ?? "");
  if (a11y && (!text.includes("## Accessibility") || !text.includes(a11y))) {
    errors.push(`generator: ${rel} lacks the catalog Accessibility section.`);
  }
}
