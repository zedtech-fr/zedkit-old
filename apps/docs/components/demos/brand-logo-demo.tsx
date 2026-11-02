"use client";

import type { MouseEvent } from "react";
import { BrandLogo, Stack, Text } from "@zedtech/zedkit-ui";
import { brandLogoCopy } from "@/components/demos/i18n/brand-logo-copy";

/** Harbor Studio's own mark: a sail over a wave. Replace the shapes and the viewBox with yours. */
function HarborMark({ className, title = "" }: { className?: string; title?: string }) {
  return (
    <BrandLogo title={title} viewBox="0 0 32 24" className={className}>
      <path d="M16 1 25 15H7Z" />
      <path d="M0 19c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3v5H0Z" />
    </BrandLogo>
  );
}

const stay = (event: MouseEvent) => event.preventDefault();

export function BrandLogoHeaderDemo() {
  return (
    <a href="/" onClick={stay} className="flex min-w-0 items-center gap-2 text-foreground">
      <HarborMark className="h-6 text-primary" />
      <Text as="span" className="truncate font-semibold">
        {brandLogoCopy.brandName}
      </Text>
    </a>
  );
}

export function BrandLogoDemo() {
  return (
    <Stack gap={4} className="min-w-0">
      <Stack className="min-w-0 rounded-lg border border-border bg-background">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          {/* Logo + visible name in one link to the home page: the name labels the link, so the mark is decorative. */}
          <a href="/" onClick={stay} className="flex min-w-0 items-center gap-2 text-foreground">
            <HarborMark className="h-6 text-primary" />
            <Text as="span" className="truncate font-semibold">
              {brandLogoCopy.brandName}
            </Text>
          </a>
          <nav aria-label={brandLogoCopy.navAriaLabel} className="flex shrink-0 gap-3 text-sm text-muted-foreground">
            <a href="/work" onClick={stay}>
              {brandLogoCopy.work}
            </a>
            <a href="/about" onClick={stay}>
              {brandLogoCopy.about}
            </a>
          </nav>
        </header>
        <Stack gap={2} className="p-4">
          <Text variant="muted" className="text-xs">
            {brandLogoCopy.sizesHint}
          </Text>
          <Stack direction="horizontal" gap={4} className="flex-wrap items-end">
            <HarborMark className="h-5 text-foreground" title={brandLogoCopy.logoTitle} />
            <HarborMark className="h-8 text-primary" title={brandLogoCopy.logoTitle} />
            <HarborMark className="h-12 text-muted-foreground" title={brandLogoCopy.logoTitle} />
            <HarborMark className="h-16 text-foreground" title={brandLogoCopy.logoTitle} />
          </Stack>
        </Stack>
        <footer className="flex items-center gap-2 border-t border-border px-4 py-3 text-muted-foreground">
          <HarborMark className="h-4" />
          <Text variant="muted" className="text-xs">
            {brandLogoCopy.copyright}
          </Text>
        </footer>
      </Stack>
      <Stack
        role="img"
        aria-label={brandLogoCopy.sharePreviewAriaLabel}
        className="aspect-[1200/630] w-full items-center justify-center gap-3 rounded-lg bg-primary text-primary-foreground"
      >
        <HarborMark className="h-1/4 min-h-10" />
        <Text as="span" className="text-xl font-semibold" aria-hidden="true">
          {brandLogoCopy.brandName}
        </Text>
        <Text as="span" className="text-sm opacity-80" aria-hidden="true">
          {brandLogoCopy.tagline}
        </Text>
      </Stack>
    </Stack>
  );
}
