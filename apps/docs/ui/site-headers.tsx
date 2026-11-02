"use client";

import { Header } from "fumadocs-ui/layouts/home/slots/header";
import {
  featuredPackageChangelogUrl,
  featuredPackageReleasesUrl,
  featuredPackageVersion,
} from "@/content/gallery";
import { MobileHeader } from "@/ui/mobile-header";

/** Marketing header slot: phone header below md, stock desktop header from md up. */
export function MarketingSiteHeader() {
  return (
    <>
      <MobileHeader
        mode="home"
        version={featuredPackageVersion}
        releasesHref={featuredPackageReleasesUrl}
        changelogHref={featuredPackageChangelogUrl}
      />
      <Header className="max-md:hidden" />
    </>
  );
}

/** Docs layout phone header (desktop docs chrome has no top bar). */
export function DocsSiteHeader() {
  return (
    <MobileHeader
      mode="docs"
      version={featuredPackageVersion}
      releasesHref={featuredPackageReleasesUrl}
      changelogHref={featuredPackageChangelogUrl}
      className="sticky top-(--fd-docs-row-1) z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-2 backdrop-blur-sm [grid-area:header] md:hidden"
    />
  );
}
