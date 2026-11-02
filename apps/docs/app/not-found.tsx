import type { Metadata } from "next";

import { notFoundPageCopy } from "@/app/i18n/not-found-page-copy";
import { featuredPackageChangelogUrl, featuredPackageReleasesUrl, featuredPackageVersion } from "@/content/gallery";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { NotFoundView } from "@/ui/not-found/not-found-view";
import { SiteLayout } from "@/ui/site-layout";

export const metadata: Metadata = docsPageMetadata(
  "/404",
  {
    title: notFoundPageCopy.title,
    description: notFoundPageCopy.description,
  },
  { index: false },
);

export default function NotFound() {
  return (
    <SiteLayout
      version={featuredPackageVersion}
      changelogHref={featuredPackageChangelogUrl}
      releasesHref={featuredPackageReleasesUrl}
    >
      <NotFoundView />
    </SiteLayout>
  );
}
