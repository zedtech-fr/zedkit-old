import { HomeLink } from "@/ui/home/home-link";
import { Button, Section, Stack, StickyAside, Text } from "@zedtech/zedkit-ui";
import { GlassSurface } from "@zedtech/zedkit-ui/marketing";

import { AdoptionPanelView, featuredAdoptionPlan } from "@/components/adoption-panel-view";
import { adoptionCopy } from "@/components/i18n/adoption-copy";
import { DocsActionLabel } from "@/components/docs-action-label";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const otherWays = homeCopy.getStarted.otherWays;

/** The two ways in that are not the install panel. */
function HomeOtherWays() {
  return (
      <Stack gap={3} className="min-w-0" role="group" aria-label={otherWays.label} data-home-other-ways="">
        <Text variant="muted" typeRole="label">
          {otherWays.label}
        </Text>
        <Stack className="min-w-0 divide-y divide-border border-y border-border">
          {([otherWays.agent, otherWays.noCode] as const).map((way) => (
            <Stack
              key={way.title}
              direction="horizontal"
              gap={3}
              className="flex-wrap items-center justify-between py-3"
              data-home-way=""
            >
              <Stack gap={1} className="min-w-0">
                <Text className="font-medium">{way.title}</Text>
                <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                  {way.body}
                </Text>
              </Stack>
              <Button asChild variant="outline" size="sm" className="min-h-11 w-fit shrink-0 md:min-h-0" {...(way === otherWays.agent ? { "data-home-ai-setup": "" } : {})}>
                <HomeLink href={way.href}>
                  <DocsActionLabel>{way.link}</DocsActionLabel>
                </HomeLink>
              </Button>
            </Stack>
          ))}
        </Stack>
      </Stack>
  );
}

/** The live result of the install steps: the rendered Button, labelled as an example. */
function HomeResultCard() {
  return (
        <GlassSurface padding="md" className="min-w-0">
          <Stack gap={HOME_CARD_CONTENT_GAP} role="group" aria-label={adoptionCopy.result.label} data-adoption-result="">
            <Text typeRole="label" className="text-muted-foreground">
              {adoptionCopy.result.label}
            </Text>
            <Stack direction="horizontal" className="rounded-lg border border-border bg-background/80 p-4">
              <Text as="span" inert>
                <Button>Save</Button>
              </Text>
            </Stack>
            <Text variant="muted" typeRole="label">
              {adoptionCopy.result.caption}
            </Text>
          </Stack>
        </GlassSurface>
  );
}

/** Composed quick-start: adoption steps in a reading column, live example beside (V7-D02). */
export function HomeGetStartedSection({ npmPackage }: { npmPackage: string }) {
  const plan = featuredAdoptionPlan(npmPackage);
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="get-started"
      title={homeCopy.getStarted.section.title}
      description={homeCopy.getStarted.section.description}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack gap={4} className="min-w-0">
        <StickyAside
          id="install-or-copy"
          className="scroll-mt-24 [--zk-sticky-gap:2rem] [--zk-sticky-top:7rem]"
          side="right"
        >
          <StickyAside.Main>
            <AdoptionPanelView plan={plan} summaryClassName={HOME_PERSUASION_TEXT_CLASS} />
          </StickyAside.Main>
          <StickyAside.Aside asChild>
            <Stack gap={4} className="min-w-0">
              <HomeResultCard />
              <GlassSurface padding="md" className="min-w-0">
                <HomeOtherWays />
              </GlassSurface>
            </Stack>
          </StickyAside.Aside>
        </StickyAside>
        <Button asChild variant="ghost" size="sm" className="w-fit" data-home-full-steps="">
          <HomeLink href={homeCopy.getStarted.quickStart.fullStepsHref}>
            <DocsActionLabel>{homeCopy.getStarted.quickStart.fullSteps}</DocsActionLabel>
          </HomeLink>
        </Button>
      </Stack>
    </Section>
  );
}
