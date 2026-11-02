"use client";

import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import type { ComponentProps } from "react";
import { mdxPreCopy } from "@/components/i18n/mdx-pre-copy";

/** MDX fenced blocks: Fumadocs CodeBlock + Pre (copy, tokens, scroll viewport). */
export function MdxPre(props: ComponentProps<"pre">) {
  return (
    <CodeBlock allowCopy viewportProps={{ "aria-label": mdxPreCopy.codeSample }} {...props}>
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}
