import { Container, Stack, signatureMotionClass } from "@zedtech/zedkit-ui";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";
import { HomeHeroPreview } from "@/ui/home/home-hero-preview";

/**
 * Colour behind the window and the cards over its edges: glass has nothing to refract without it. Glass only (CSS).
 * It lives in the band, inside its box, so nothing in the window or the page grows or scrolls because of it.
 */
function HeroShapes() {
  return (
    <span aria-hidden="true" data-hero-shapes="" className="pointer-events-none absolute inset-0 -z-10">
      <span data-shape="1" />
      <span data-shape="2" />
      <span data-shape="3" />
    </span>
  );
}

/** Hero band: the proposition, and one working example the visitor can switch and try beside it. */
export function HomeHero() {
  return (
    <Container width="wide" data-home-hero-band="" className={`relative ${signatureMotionClass.settle}`}>
      <HeroShapes />
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0" data-home-hero="">
        <HomeHeroLead className="min-w-0" />
        <HomeHeroPreview />
      </Stack>
    </Container>
  );
}
