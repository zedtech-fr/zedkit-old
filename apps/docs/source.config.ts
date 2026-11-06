import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      componentPage: z.boolean().optional(),
      /** Sections a component page renders, from `componentPageSections` (drives its contents list). */
      componentSections: z.array(z.string()).optional(),
      /** When true, the layout skips DocsTitle so the MDX supplies the visible H1 (SEO title stays in frontmatter). */
      hidePageTitle: z.boolean().optional(),
    }),
  },
});

export default defineConfig();
