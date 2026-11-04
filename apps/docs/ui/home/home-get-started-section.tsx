import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Button, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { GlassSurface } from "@zedtech/zedkit-ui/marketing";

import { AdoptionPanelView, featuredAdoptionPlan } from "@/components/adoption-panel-view";
import { adoptionCopy } from "@/components/i18n/adoption-copy";
import { DocsActionLabel } from "@/components/docs-action-label";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_REVEAL_CLASS,
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

function HomeQuickStartExample() {
  return (
    <GlassSurface padding="md" className="min-w-0 lg:sticky lg:top-28">
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
      className={HOME_SECTION_REVEAL_CLASS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack gap={4} className="min-w-0">
        <div
          id="install-or-copy"
          className="grid min-w-0 scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,1fr)_min(18rem,34%)] lg:items-start"
        >
          <AdoptionPanelView plan={plan} summaryClassName={HOME_PERSUASION_TEXT_CLASS} />
          <HomeQuickStartExample />
        </div>
        <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
          <Link href={homeCopy.getStarted.quickStart.fullStepsHref}>
            <DocsActionLabel>{homeCopy.getStarted.quickStart.fullSteps}</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Section>
  );
}
