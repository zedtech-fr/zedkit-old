import { Suspense } from "react";
import { buildWebPageJsonLd } from "@zedtech/zedkit-seo";

import { catalogCopy } from "@/app/i18n/catalog-copy";
import { JsonLd } from "@/components/json-ld";
import { catalogIndex } from "@/content/catalog-index";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { homePage, pageUrl } from "@/lib/site";
import { CatalogViewFromUrl } from "@/ui/catalog/catalog-view";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/catalog", {
  title: catalogCopy.metadata.title(homePage.title),
  description: catalogCopy.metadata.description,
});

export default function CatalogPage() {
  const jsonLd = buildWebPageJsonLd({
    title: catalogCopy.jsonLd.title,
    description: catalogCopy.jsonLd.description,
    url: pageUrl("/catalog"),
  });
  return (
    <div data-catalog-shell>
      <JsonLd data={jsonLd} />
      <Suspense
        fallback={
          <div data-catalog-shell className="py-section-lg">
            {catalogCopy.loading}
          </div>
        }
      >
        <CatalogViewFromUrl entries={catalogIndex} />
      </Suspense>
    </div>
  );
}
