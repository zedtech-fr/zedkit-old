import type { TOCItemType } from "fumadocs-core/toc";

/** Every section anchor `ComponentPage` can render (Fumadocs TOC only sees MDX headings). */
const SECTION_TOC: Record<string, TOCItemType> = {
  example: { title: "Preview", url: "#example", depth: 2 },
  guidance: { title: "Guidance", url: "#guidance", depth: 2 },
  "install-or-copy": { title: "Install or copy", url: "#install-or-copy", depth: 2 },
  "usage-and-states": { title: "Usage and states", url: "#usage-and-states", depth: 2 },
  props: { title: "Props", url: "#props", depth: 2 },
  accessibility: { title: "Accessibility", url: "#accessibility", depth: 2 },
  related: { title: "Related", url: "#related", depth: 2 },
  troubleshooting: { title: "Troubleshooting", url: "#troubleshooting", depth: 2 },
};

/** Contents for a component page: only the sections the page renders, then any MDX headings. */
export function mergeComponentPageToc(mdxToc: TOCItemType[], sections: readonly string[]): TOCItemType[] {
  const own = sections.flatMap((id) => SECTION_TOC[id] ?? []);
  const urls = new Set(own.map((item) => item.url));
  return [...own, ...mdxToc.filter((item) => !urls.has(item.url))];
}
