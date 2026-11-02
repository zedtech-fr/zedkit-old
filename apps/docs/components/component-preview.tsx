import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { highlight } from "fumadocs-core/highlight";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { PreviewFrame } from "./preview-viewport";
import { demoRegistry, type DemoEntry } from "./demos/registry";
import { componentPreviewCopy } from "@/components/i18n/component-preview-copy";

interface ComponentPreviewProps {
  /** Registry key, e.g. `ButtonDemo`. */
  demo: string;
  /** Whether the page renders a Props section to link to. */
  hasProps: boolean;
  /** Scope a11y gates to this preview (hero on component pages). */
  a11yRoot?: boolean;
}

/**
 * One framed live demo: Preview/Code tabs, a quiet Display row, and Shiki source.
 */
export async function ComponentPreview({ demo, hasProps, a11yRoot }: ComponentPreviewProps) {
  const entry = (demoRegistry as Record<string, DemoEntry | undefined>)[demo];
  if (!entry) return <Text>{componentPreviewCopy.unknownDemo(demo)}</Text>;
  const code = await readFile(join(process.cwd(), "components", "demos", entry.file), "utf8");
  const highlighted = await highlight(code, { lang: "tsx", components: { pre: Pre } });
  const { Demo } = entry;
  return (
    <Stack gap={2} className="w-full min-w-0">
      <div
        className="w-full min-w-0"
        data-component-preview={a11yRoot ? "primary" : true}
        {...(a11yRoot ? { "data-a11y-preview-root": "" } : {})}
      >
        <PreviewFrame
          center={entry.center ?? false}
          pinned={entry.pinned ?? false}
          codePanel={
            <CodeBlock title={entry.file} allowCopy>
              {highlighted}
            </CodeBlock>
          }
        >
          <Demo />
        </PreviewFrame>
      </div>
      {hasProps ? (
        <Link href="#props" className="w-fit text-sm text-primary underline underline-offset-4 hover:no-underline">
          {componentPreviewCopy.viewPropsTable}
        </Link>
      ) : null}
    </Stack>
  );
}
