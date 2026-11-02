import Link from "next/link";
import type { ReactNode } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { inheritedPropsCopy } from "@/components/i18n/inherited-props-copy";

const MDN_HTML_ATTRS = "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes";

export function InheritedPropsPanel({
  children,
  referenceHref = MDN_HTML_ATTRS,
  summary = inheritedPropsCopy.summary,
}: {
  children?: ReactNode;
  referenceHref?: string;
  summary?: string;
}) {
  return (
    <details className="group rounded-md border border-border/40 open:border-border/60">
      <summary className="min-h-[max(2.75rem,44px)] cursor-pointer list-none px-3 py-2 text-sm font-medium text-foreground focus-ring-control [&::-webkit-details-marker]:hidden">
        <Text as="span" className="text-muted-foreground group-open:hidden">
          {inheritedPropsCopy.show(summary)}
        </Text>
        <Text as="span" className="hidden group-open:inline">
          {inheritedPropsCopy.hide(summary)}
        </Text>
      </summary>
      <Stack gap={2} className="border-t border-border/40 px-3 pt-2 pb-3">
        <Text variant="muted" className="text-xs">
          {inheritedPropsCopy.referenceLead}
          <Link href={referenceHref} className="text-primary underline-offset-4 hover:underline">
            {inheritedPropsCopy.referenceLink}
          </Link>
          {inheritedPropsCopy.referenceTail}
        </Text>
        {children ?? null}
      </Stack>
    </details>
  );
}
