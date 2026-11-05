import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeAiSetupSection } from "@/ui/home/home-ai-setup-section";
import { HomeComponentFamiliesSection } from "@/ui/home/home-component-families-section";
import { HomeGetStartedSection } from "@/ui/home/home-get-started-section";
import { HomeIdentitiesSection } from "@/ui/home/home-identities-section";
import { HomeSecondarySection } from "@/ui/home/home-secondary-section";

export type HomeBelowHeroProps = {
  featuredPackage: string;
  uiGalleryStats: { components: number; livePreviews: number };
  entryPoints: HomeEntryPoint[];
};

/**
 * Marketing sections below the hero, in the order a visitor decides: the proof is above,
 * then the one-prompt AI setup, then the same task in six looks, then how to adopt, then where to look next.
 * Kept in the main home payload (not dynamically imported) so section anchors stay in the live layout on first paint.
 */
export function HomeBelowHero({
  featuredPackage,
  uiGalleryStats,
  entryPoints,
}: HomeBelowHeroProps) {
  return (
    <div data-home-below-hero="">
      <HomeAiSetupSection />
      <HomeIdentitiesSection />
      <HomeGetStartedSection npmPackage={featuredPackage} />
      <HomeComponentFamiliesSection componentCount={uiGalleryStats.components} />
      <HomeSecondarySection entryPoints={entryPoints} />
    </div>
  );
}
