import { SectionScroll } from "@zedtech/zedkit-ui";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeBelowHero } from "@/ui/home/home-below-hero";
import { HomeHero } from "@/ui/home/home-hero";

export function HomeView({
  featuredPackage,
  uiGalleryStats,
  entryPoints,
}: {
  featuredPackage: string;
  uiGalleryStats: { components: number; livePreviews: number };
  entryPoints: HomeEntryPoint[];
}) {
  return (
    <SectionScroll id="home-page" className="min-w-0" data-home-marketing="">
      <HomeHero />
      <HomeBelowHero
        featuredPackage={featuredPackage}
        uiGalleryStats={uiGalleryStats}
        entryPoints={entryPoints}
      />
    </SectionScroll>
  );
}
