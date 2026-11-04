import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Button, Section, Stack } from "@zedtech/zedkit-ui";

import { AdoptionPanelView, featuredAdoptionPlan } from "@/components/adoption-panel-view";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HOME_MARKETING_ROOT_PROPS, HOME_PERSUASION_TEXT_CLASS, HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

export function loadHomeInitCommand() {
  const initCommand = readFileSync(join(SNIPPETS_DIR, "ai-init.sh"), "utf8").trim();
  if (initCommand !== "npx @zedtech/zedkit-ai init") {
    throw new Error("home-quickstart/snippets/ai-init.sh must be exactly: npx @zedtech/zedkit-ai init");
  }
  return initCommand;
}

/** The adoption panel for the featured brick: the same steps and primitives as every component page. */
export function HomeGetStartedSection({ npmPackage }: { npmPackage: string }) {
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
        <div id="install-or-copy" className="min-w-0 scroll-mt-24">
          <AdoptionPanelView plan={featuredAdoptionPlan(npmPackage)} result={<Button>Save</Button>} summaryClassName={HOME_PERSUASION_TEXT_CLASS} />
        </div>
        <Button asChild variant="ghost" size="sm" className="w-fit" data-home-full-steps="">
          <Link href={homeCopy.getStarted.quickStart.fullStepsHref}>
            <DocsActionLabel>{homeCopy.getStarted.quickStart.fullSteps}</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Section>
  );
}
