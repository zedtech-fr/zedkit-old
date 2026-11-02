import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      componentPage: z.boolean().optional(),
      /** Sections a component page renders, from `componentPageSections` (drives its contents list). */
      componentSections: z.array(z.string()).optional(),
    }),
  },
});

export default defineConfig();
