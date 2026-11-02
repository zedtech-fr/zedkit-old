import dynamic from "next/dynamic";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { loadHomeInitCommand } from "@/ui/home/home-get-started-section";
import { HomeIdentitiesSection } from "@/ui/home/home-identities-section";
import { HomeSecondarySection } from "@/ui/home/home-secondary-section";

const HomeGetStartedSection = dynamic(
  () => import("@/ui/home/home-get-started-section").then((mod) => ({ default: mod.HomeGetStartedSection })),
  {
    loading: () => (
      <section id="get-started" aria-busy="true" className="min-h-96 w-full scroll-mt-24">
        <section id="install-or-copy" className="sr-only" />
      </section>
    ),
  },
);

const HomeComponentFamiliesSection = dynamic(
  () =>
    import("@/ui/home/home-component-families-section").then((mod) => ({
      default: mod.HomeComponentFamiliesSection,
    })),
  {
    loading: () => <section id="components" aria-busy="true" className="min-h-48 w-full scroll-mt-24" />,
  },
);

export type HomeBelowHeroProps = {
  featuredPackage: string;
  uiGalleryStats: { components: number; livePreviews: number };
  entryPoints: HomeEntryPoint[];
};

/**
 * Marketing sections below the hero, code-split from the first home payload (#618), in the order a visitor
 * decides: the proof is above, then the same task in six looks, then how to adopt, then where to look next.
 */
export function HomeBelowHero({
  featuredPackage,
  uiGalleryStats,
  entryPoints,
}: HomeBelowHeroProps) {
  const initCommand = loadHomeInitCommand();
  return (
    <div data-home-below-hero="">
      <HomeIdentitiesSection />
      <HomeGetStartedSection npmPackage={featuredPackage} />
      <HomeComponentFamiliesSection componentCount={uiGalleryStats.components} />
      <HomeSecondarySection entryPoints={entryPoints} initCommand={initCommand} />
    </div>
  );
}
