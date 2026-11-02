import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "#source";
import { featuredPackageChangelogUrl, featuredPackageReleasesUrl, featuredPackageVersion } from "@/content/gallery";
import { SiteBrand } from "@/ui/site-brand";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { docsChromeSlots } from "@/ui/site-chrome";
import { DocsSiteHeader } from "@/ui/site-headers";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: <SiteBrand />,
        url: "/",
        children: (
          <KitVersionLabel
            version={featuredPackageVersion}
            releasesHref={featuredPackageReleasesUrl}
            tone="shell"
          />
        ),
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks(featuredPackageChangelogUrl)}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
      slots={{ ...docsChromeSlots, header: DocsSiteHeader }}
    >
      {children}
    </DocsLayout>
  );
}
