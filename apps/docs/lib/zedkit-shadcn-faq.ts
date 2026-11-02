export interface FaqEntry {
  question: string;
  answer: string;
}

/** Factual FAQ for /docs/zedkit-and-shadcn (also drives FAQPage JSON-LD). */
export function zedkitShadcnFaq(registryBrickCount: number): FaqEntry[] {
  const brickLine =
    registryBrickCount === 1
      ? "One registry brick is published today"
      : `${registryBrickCount} registry bricks are published today`;
  return [
    {
      question: "How is zedkit different from shadcn/ui?",
      answer:
        "shadcn/ui is a copy-into-your-repo workflow around Radix primitives. zedkit ships a versioned npm UI package plus optional registry JSON for some bricks. It adds composed admin patterns, shared theme tokens, and generated docs aligned with catalog needs. It does not replace upstream shadcn when you want every file local-only.",
    },
    {
      question: "Can I copy zedkit components like shadcn/ui?",
      answer:
        `Yes, for published registry items: npx shadcn@latest add https://zedkit.app/r/<brick>.json in a project with components.json. ${brickLine}; the rest of the kit is npm-only. Copied files live in your repo — you own them (MIT). Updates are manual unless you run shadcn add again with --overwrite.`,
    },
    {
      question: "Does zedkit lock me in?",
      answer:
        "On the npm path you depend on @zedtech/zedkit-ui like any MIT package — remove it if you outgrow it. On the copy path the source is yours with no proprietary runtime. Registry URLs always serve the latest published item (not version-pinned). Full theme tokens and styles.css still come from the npm package today.",
    },
    {
      question: "Is zedkit production-ready?",
      answer:
        "It is public MIT software under active development. Catalog maturity labels apply: stable needs have no badge and follow semver on 1.0 packages; alpha and beta entries can still change. Use the maturity legend and compatibility matrix before betting a critical launch on a specific need.",
    },
  ];
}
