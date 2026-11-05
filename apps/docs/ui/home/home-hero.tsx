import { Container, Stack, signatureMotionClass } from "@zedtech/zedkit-ui";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";
import { HomeHeroPreview } from "@/ui/home/home-hero-preview";

/** Hero band: the proposition, and one working example the visitor can switch and try beside it. */
export function HomeHero() {
  return (
    <Container width="wide" data-home-hero-band="" className={signatureMotionClass.settle}>
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0" data-home-hero="">
        <HomeHeroLead className="min-w-0" />
        <HomeHeroPreview />
      </Stack>
    </Container>
  );
}
