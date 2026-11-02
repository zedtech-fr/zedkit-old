import dynamic from "next/dynamic";
import { Container, Stack } from "@zedtech/zedkit-ui";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";
import { HOME_HERO_PREVIEW_SHELL_CLASS, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const HomeHeroPreview = dynamic(
  () => import("@/ui/home/home-hero-preview").then((mod) => ({ default: mod.HomeHeroPreview })),
  {
    loading: () => (
      <Stack
        aria-hidden="true"
        className={`${HOME_HERO_PREVIEW_SHELL_CLASS} rounded-xl border border-border bg-card`}
        data-home-hero-preview
      >
        <Stack className="min-h-14 border-b border-border" />
        <Stack className="min-h-72" />
      </Stack>
    ),
  },
);

/** Hero band: the proposition, and one working example the visitor can switch and try beside it. */
export function HomeHero() {
  return (
    <Container width="wide" data-home-hero-band="">
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0" data-home-hero="">
        <HomeHeroLead className="min-w-0" />
        <HomeHeroPreview />
      </Stack>
    </Container>
  );
}
