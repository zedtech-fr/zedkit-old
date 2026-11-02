import { highlight } from "fumadocs-core/highlight";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";

/** A usage example, highlighted on the server, with a copy button and a named scroll area. */
export async function highlightedTs(code: string, title?: string) {
  return (
    <CodeBlock
      {...(title ? { title } : {})}
      viewportProps={{ ...(title ? { "aria-label": title } : {}) }}
      allowCopy
    >
      {await highlight(code, { lang: "tsx", components: { pre: Pre } })}
    </CodeBlock>
  );
}
