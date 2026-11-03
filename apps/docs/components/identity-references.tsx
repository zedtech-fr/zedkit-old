"use client";

import { Button, Stack, Text } from "@zedtech/zedkit-ui";

import { identityAssistantCopy } from "@/components/i18n/identity-assistant-copy";
import type { ReferenceReport } from "@/lib/identity-assistant";
import { linksInText, removeLink } from "@/lib/identity-links-in-text";

const copy = identityAssistantCopy;

const hostOf = (url: string) => (URL.canParse(url) ? new URL(url).host : url);
/** Host and path: two links on one host stay told apart. */
const urlLabel = (url: string) => (URL.canParse(url) ? `${new URL(url).host}${new URL(url).pathname === "/" ? "" : new URL(url).pathname}` : url);

/**
 * The links found in the brief, so the visitor sees what will be read and can drop one. There is nothing to fill in:
 * a link is read because it is in the text, and removing it here removes it from the text.
 */
export function DetectedLinks({ text, onText, fieldId, disabled = false }: { text: string; onText: (next: string) => void; fieldId: string; disabled?: boolean }) {
  const { urls, skipped } = linksInText(text);
  if (urls.length === 0 && skipped.length === 0) return null;
  const tooMany = skipped.some((item) => item.why === "too-many");
  return (
    <Stack gap={2} data-assistant-links="">
      {urls.length > 0 ? (
        <>
          <Text as="span" className="text-sm font-medium text-foreground">
            {copy.links.found}
          </Text>
          <ul aria-label={copy.links.list} className="m-0 flex list-none flex-wrap gap-2 p-0">
            {urls.map((url) => (
              <li key={url} data-assistant-link-chip="" className="flex max-w-full min-w-0 items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pr-0.5 pl-3">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
                <Text as="span" data-assistant-link-label="" className="min-w-0 truncate text-sm" title={url}>
                  {urlLabel(url)}
                </Text>
                <Button type="button" variant="ghost" size="sm" className="min-w-11 rounded-full" disabled={disabled} aria-label={copy.links.remove(urlLabel(url))} onClick={() => {
                    onText(removeLink(text, url));
                    document.getElementById(fieldId)?.focus();
                  }}>
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <Text variant="muted" className="text-sm">
            {copy.links.note}
          </Text>
        </>
      ) : null}
      {tooMany ? <Text className="text-sm text-muted-foreground">{copy.links.tooMany}</Text> : null}
    </Stack>
  );
}

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
      <Text as="span" className="text-sm font-medium text-foreground">
        {copy.references.report}
      </Text>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {report.map((item) => (
          <li key={item.url} className="text-sm text-muted-foreground">
            <Text as="span" className="font-medium text-foreground">
              {item.title || hostOf(item.url)}
            </Text>{" "}
            {item.status === "used"
              ? item.analysis === "styles-and-text"
                ? copy.references.styles(signalsLine(item))
                : copy.references.textOnly
              : copy.references.failed(item.reason ?? "")}
          </li>
        ))}
      </ul>
    </Stack>
  );
}
