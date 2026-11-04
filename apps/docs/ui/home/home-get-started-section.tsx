import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

export function loadHomeInitCommand() {
  const initCommand = readFileSync(join(SNIPPETS_DIR, "ai-init.sh"), "utf8").trim();
  if (initCommand !== "npx @zedtech/zedkit-ai init") {
    throw new Error("home-quickstart/snippets/ai-init.sh must be exactly: npx @zedtech/zedkit-ai init");
  }
  return initCommand;
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
          </StickyAside.Aside>
        </StickyAside>
        <Button asChild variant="ghost" size="sm" className="w-fit" data-home-full-steps="">
          <Link href={homeCopy.getStarted.quickStart.fullStepsHref}>
            <DocsActionLabel>{homeCopy.getStarted.quickStart.fullSteps}</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Section>
  );
}
