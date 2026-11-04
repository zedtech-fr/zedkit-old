import dynamic from "next/dynamic";
import { SectionScroll, Stack } from "@zedtech/zedkit-ui";
import type { HomeEntryPoint } from "@/content/home-entry-points";

const HomeHero = dynamic(() => import("@/ui/home/home-hero").then((mod) => ({ default: mod.HomeHero })));

const HomeBelowHero = dynamic(
  () => import("@/ui/home/home-below-hero").then((mod) => ({ default: mod.HomeBelowHero })),
  {
    loading: () => (
      <Stack aria-busy="true" className="min-h-screen w-full" data-home-below-loading="">
        <div className="sr-only" data-home-section-placeholder="ai-setup" />
        <div className="sr-only" data-home-section-placeholder="identities" />
        <div className="sr-only" data-home-section-placeholder="get-started" />
        <div className="sr-only" data-home-section-placeholder="components" />
        <div className="sr-only" data-home-section-placeholder="entry-points" />
      </Stack>
    ),
  },
);

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
