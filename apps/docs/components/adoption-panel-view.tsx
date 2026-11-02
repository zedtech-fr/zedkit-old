import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { highlight } from "fumadocs-core/highlight";
import { Pre } from "fumadocs-ui/components/codeblock";

import { AdoptionPanel } from "@/components/adoption-panel";
import type { Highlighted } from "@/components/adoption-steps";
import { featuredRegistryBrick } from "@/content/registry-site";
import { FEATURED_EXAMPLE, buildAdoptionPlan, loadRegistry } from "@/lib/adoption-plan.mjs";
import { blockKey, type AdoptionPlan } from "@/lib/adoption-types";
import { packageManagers } from "@/lib/package-manager-commands";
import { PUBLIC_SITE_URL } from "@/lib/site";

type PlanInput = Parameters<typeof buildAdoptionPlan>[0];

/** The repository root: the docs app builds from `apps/docs`. */
const repoRoot = () => join(process.cwd(), "..", "..");

/** The plan for one need, as the site renders it. Install commands point at the published site, never a preview. */
export function adoptionPlanFor(input: Omit<PlanInput, "siteUrl">): AdoptionPlan {
  return buildAdoptionPlan({ ...input, siteUrl: PUBLIC_SITE_URL }, { registry: loadRegistry(repoRoot()) }) as AdoptionPlan;
}

/** The home page's plan: the featured brick (Button) with the one-line example the page renders live. */
export function featuredAdoptionPlan(packageName: string): AdoptionPlan {
  const catalog = JSON.parse(readFileSync(join(repoRoot(), "docs/catalog/catalog.json"), "utf8"));
  const need = catalog.packages[packageName]?.needs.find((item: { registry?: string }) => item.registry === featuredRegistryBrick);
  if (!need) throw new Error(`catalog: no need of ${packageName} is the featured brick "${featuredRegistryBrick}"`);
  return adoptionPlanFor({ need, packageName, example: FEATURED_EXAMPLE });
}

function code(text: string, lang: string) {
  return highlight(text, { lang, components: { pre: Pre } });
}

/** Every block of every mode, highlighted on the server; the client chooses which to show. */
async function highlightPlan(plan: AdoptionPlan): Promise<Highlighted> {
  const entries: Promise<[string, ReactNode]>[] = [];
  for (const mode of plan.modes) {
    for (const step of mode.steps) {
      step.blocks.forEach((block, index) => {
        const key = blockKey(mode.id, step.id, index);
        if (block.kind === "command") {
          for (const pm of packageManagers) entries.push(code(block.commands[pm], "bash").then((node) => [`${key}:${pm}`, node]));
        } else {
          entries.push(code(block.code, block.lang).then((node) => [key, node]));
        }
      });
    }
  }
  return Object.fromEntries(await Promise.all(entries));
}

/** The adoption panel for a plan: pages hand it a plan and, optionally, the live result of the final step. */
export async function AdoptionPanelView({
  plan,
  result,
  summaryClassName,
}: {
  plan: AdoptionPlan;
  result?: ReactNode;
  summaryClassName?: string;
}) {
  return (
    <AdoptionPanel
      plan={plan}
      highlighted={await highlightPlan(plan)}
      {...(result ? { result } : {})}
      {...(summaryClassName ? { summaryClassName } : {})}
    />
  );
}
