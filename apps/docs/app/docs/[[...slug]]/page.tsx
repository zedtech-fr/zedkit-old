import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@zedtech/zedkit-seo";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";

import { Stack } from "@zedtech/zedkit-ui";

import { docsPageCopy } from "@/app/i18n/docs-page-copy";
import { JsonLd } from "@/components/json-ld";
import { featuredPackageChangelogUrl } from "@/content/gallery";
import { mergeComponentPageToc } from "@/lib/component-page-toc";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { pageUrl } from "@/lib/site";
import { getMDXComponents } from "@/mdx-components";
import { SiteMaintainerFooter } from "@/ui/site-footer";
import { source } from "#source";

export async function generateStaticParams() {
  return source.generateParams();
}

function docsPath(slug?: string[]): string {
  if (slug === undefined || slug.length === 0) return "/docs";
  return `/docs/${slug.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  const description = page.data.description ?? page.data.title;
  return docsPageMetadata(docsPath(slug), {
    title: page.data.title,
    description,
  });
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const pathname = docsPath(slug);
  const url = pageUrl(pathname);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: docsPageCopy.breadcrumbHome, url: pageUrl("/") },
    { name: docsPageCopy.breadcrumbDocs, url: pageUrl("/docs") },
    { name: page.data.title, url },
  ]);
  const description = page.data.description ?? page.data.title;
  const jsonLd = buildWebPageJsonLd({
    title: page.data.title,
    description,
    url,
    breadcrumb,
  });
  const MDX = page.data.body;
  return (
    <>
      <JsonLd data={jsonLd} />
      <DocsPage
        toc={page.data.componentPage
          ? mergeComponentPageToc(page.data.toc, page.data.componentSections ?? [])
          : page.data.toc}
        tableOfContentPopover={{
          trigger: {
            "aria-label": docsPageCopy.tableOfContents,
            title: docsPageCopy.tableOfContents,
          },
        }}
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        {page.data.componentPage ? null : <DocsDescription>{page.data.description}</DocsDescription>}
        {page.data.componentPage ? (
          // Component pages are composed from kit components; the `prose` reset DocsBody adds would restyle them.
          <Stack className="flex-1">
            <MDX components={getMDXComponents()} />
          </Stack>
        ) : (
          <DocsBody>
            <MDX components={getMDXComponents()} />
          </DocsBody>
        )}
        <Stack className="mt-section-md">
          <SiteMaintainerFooter changelogHref={featuredPackageChangelogUrl} embeddedInMain />
        </Stack>
      </DocsPage>
    </>
  );
}
