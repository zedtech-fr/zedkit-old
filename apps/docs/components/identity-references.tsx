"use client";

import { Button, Stack, Text } from "@zedtech/zedkit-ui";

import { identityAssistantCopy } from "@/components/i18n/identity-assistant-copy";
import type { ReferenceReport } from "@/lib/identity-assistant";
import { linksInText, removeLink } from "@/lib/identity-links-in-text";

const copy = identityAssistantCopy;

const hostOf = (url: string) => (URL.canParse(url) ? new URL(url).host : url);

/**
 * The links found in the brief, so the visitor sees what will be read and can drop one. There is nothing to fill in:
 * a link is read because it is in the text, and removing it here removes it from the text.
 */
export function DetectedLinks({ text, onText, disabled = false }: { text: string; onText: (next: string) => void; disabled?: boolean }) {
  const { urls, skipped } = linksInText(text);
  if (urls.length === 0 && skipped.length === 0) return null;
  const tooMany = skipped.some((item) => item.why === "too-many");
  const onlyHttps = skipped.some((item) => item.why === "http");
  return (
    <Stack gap={2} data-assistant-links="">
      {urls.length > 0 ? (
        <>
          <Text as="span" className="text-sm font-medium text-foreground">
            {copy.links.found}
          </Text>
          <ul aria-label={copy.links.list} className="m-0 flex list-none flex-col gap-2 p-0">
            {urls.map((url) => (
              <li key={url} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border px-3 py-1">
                <Text as="span" className="min-w-0 truncate text-sm" title={url}>
                  {url}
                </Text>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} aria-label={copy.links.remove(hostOf(url))} onClick={() => onText(removeLink(text, url))}>
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
      {onlyHttps ? <Text className="text-sm text-muted-foreground">{copy.links.onlyHttps}</Text> : null}
    </Stack>
  );
}

/** What happened to each link: read as text, or why not. Never "analysed". */
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
            {item.status === "used" ? copy.references.textOnly : copy.references.failed(item.reason ?? "")}
          </li>
        ))}
      </ul>
    </Stack>
  );
}
