import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import type { HomeEntryPoint } from "@/content/home-entry-points";

const HomeHero = dynamic(() => import("@/ui/home/home-hero").then((mod) => ({ default: mod.HomeHero })));

const HomeBelowHero = dynamic(
  () => import("@/ui/home/home-below-hero").then((mod) => ({ default: mod.HomeBelowHero })),
  {
    loading: () => (
      <Stack aria-busy="true" className="min-h-screen w-full">
        <section id="identities" className="sr-only" />
        <section id="get-started" className="sr-only" />
        <section id="components" className="sr-only" />
        <section id="entry-points" className="sr-only" />
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
    <div id="home-page" className="min-w-0" data-home-marketing="">
      <HomeHero />
      <HomeBelowHero
        featuredPackage={featuredPackage}
        uiGalleryStats={uiGalleryStats}
        entryPoints={entryPoints}
      />
    </div>
  );
}
