"use client";

import { Stack, Text } from "@zedtech/zedkit-ui";

import { identityAssistantCopy } from "@/components/i18n/identity-assistant-copy";
import type { ReferenceReport } from "@/lib/identity-assistant";

const copy = identityAssistantCopy;

const hostOf = (url: string) => (URL.canParse(url) ? new URL(url).host : url);
/** The design signals read from one page, in a few words: colours, fonts, radius. */
function signalsLine(item: ReferenceReport): string {
  const hints = item.hints ?? {};
  const parts = [
    ...(hints.colors ?? []).slice(0, 3),
    ...(hints.fonts ?? []).slice(0, 2),
    ...(hints.radius ? [copy.references.radius(hints.radius)] : []),
  ];
  if (parts.length === 0 && hints.themeColor) parts.push(hints.themeColor);
  return parts.join(" · ");
}

/** What happened to each link: which styles and text were read, or why not. Never "analysed" or "seen". */
export function ReferenceReportList({ report }: { report: readonly ReferenceReport[] }) {
  if (report.length === 0) return null;
  return (
    <Stack gap={1} role="status" data-assistant-reference-report="">
      <Text as="span" typeRole="body" className="font-medium text-foreground">
        {copy.references.report}
      </Text>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {report.map((item) => {
          const used = item.status === "used";
          return (
            <li key={item.url} data-assistant-reference-status={used ? "used" : "failed"} className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-zk-type-body text-muted-foreground">
              <Text
                as="span"
                data-assistant-reference-chip=""
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-zk-type-label font-medium ${used ? "border-primary/40 bg-primary/10 text-foreground" : "border-destructive/50 bg-destructive/10 text-foreground"}`}
              >
                <Text as="span" aria-hidden="true" className={`size-1.5 rounded-full ${used ? "bg-primary" : "bg-destructive"}`} />
                {used ? copy.references.used : copy.references.notUsed}
              </Text>{" "}
              <Text as="span" className="min-w-0 truncate font-medium text-foreground" title={item.url}>
                {item.title || hostOf(item.url)}
              </Text>{" "}
              <Text as="span" className="basis-full">
                {used
                  ? item.analysis === "styles-and-text"
                    ? copy.references.styles(signalsLine(item))
                    : copy.references.textOnly
                  : copy.references.failed(item.reason ?? "")}
              </Text>
            </li>
          );
        })}
      </ul>
    </Stack>
  );
}
