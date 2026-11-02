import { buildWebPageJsonLd } from "@zedtech/zedkit-seo";

import { JsonLd } from "@/components/json-ld";
import { featuredPackage, uiGalleryStats } from "@/content/gallery";
import { homeEntryPoints } from "@/content/home-entry-points";
import { homePage, pageUrl } from "@/lib/site";
import { HomeView } from "@/ui/home/home-view";

export default function Home() {
  const jsonLd = buildWebPageJsonLd({
    title: homePage.title,
    description: homePage.description,
    url: pageUrl("/"),
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeView
        featuredPackage={featuredPackage}
        uiGalleryStats={uiGalleryStats}
        entryPoints={homeEntryPoints}
      />
    </>
  );
}
