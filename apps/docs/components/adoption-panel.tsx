"use client";

import type { ReactNode } from "react";
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@zedtech/zedkit-ui";

import { ModeView, type Highlighted } from "@/components/adoption-steps";
import { adoptionCopy } from "@/components/i18n/adoption-copy";
import type { AdoptionMode, AdoptionPlan } from "@/lib/adoption-types";
import { createStoredChoice } from "@/lib/use-stored-choice";
import { usePackageManager } from "@/lib/use-package-manager";

const groupChoice = createStoredChoice("zk-adoption-group", ["package", "copy"] as const);
const methodChoice = createStoredChoice("zk-adoption-method", ["cli", "manual"] as const);

/** Quiet underline tabs for the one primary choice: two peers, so no box and no raised segment. */
const PRIMARY_TRIGGER_CLASS =
  "h-auto! min-h-control-height flex-none rounded-none border-b-2 border-transparent bg-transparent px-3 py-0 text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";
const PRIMARY_LIST_CLASS = "h-auto! w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0";

/** The choice inside "Copy source": a smaller segmented control, so it reads as a detail of that path. */
const SECONDARY_LIST_CLASS = "h-control-height-sm! w-fit";
const SECONDARY_TRIGGER_CLASS = "min-h-0 px-3";

function ModeTabs({
  label,
  items,
  listClass,
  triggerClass,
}: {
  label: string;
  items: readonly { id: string; label: string }[];
  listClass: string;
  triggerClass: string;
}) {
  return (
    <TabsList aria-label={label} className={listClass}>
      {items.map((item) => (
        <TabsTrigger key={item.id} value={item.id} className={triggerClass}>
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

type ViewProps = Pick<Parameters<typeof ModeView>[0], "highlighted" | "choice" | "result" | "summaryClassName">;

function CopyMethods({ modes, highlighted, choice, result, summaryClassName }: ViewProps & { modes: AdoptionMode[] }) {
  const [method, setMethod] = methodChoice.useChoice();
  const active = modes.find((mode) => mode.id === method) ?? modes[0]!;
  return (
    <Tabs value={active.id} onValueChange={(next) => methodChoice.isValue(next) && setMethod(next)} className="flex flex-col gap-5">
      <ModeTabs
        label={adoptionCopy.copyMethodLabel}
        items={modes.map((mode) => ({ id: mode.id as "cli" | "manual", label: adoptionCopy.copyMethods[mode.id as "cli" | "manual"] }))}
        listClass={SECONDARY_LIST_CLASS}
        triggerClass={SECONDARY_TRIGGER_CLASS}
      />
      {modes.map((mode) => (
        <TabsContent key={mode.id} value={mode.id} className="mt-0">
          <ModeView mode={mode} highlighted={highlighted} choice={choice} result={result} {...(summaryClassName ? { summaryClassName } : {})} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * The adoption panel: one primary choice (install the package, or copy the source), the way in inside that
 * choice, and the steps for it in order. The same panel serves the home page and every component page.
 */
export function AdoptionPanel({
  plan,
  highlighted,
  result = null,
  summaryClassName,
}: {
  plan: AdoptionPlan;
  highlighted: Highlighted;
  /** What the final step renders, shown as a labelled example. */
  result?: ReactNode;
  summaryClassName?: string;
}) {
  const [pm, setPm] = usePackageManager();
  const [group, setGroup] = groupChoice.useChoice();
  const choice = { pm, onPm: setPm };
  const packageMode = plan.modes.find((mode) => mode.group === "package")!;
  const copyModes = plan.modes.filter((mode) => mode.group === "copy");

  if (copyModes.length === 0) {
    return (
      <Stack gap={4} data-adoption-panel="">
        <Text variant="muted" className="text-sm">
          {adoptionCopy.npmOnly}
        </Text>
        <ModeView mode={packageMode} highlighted={highlighted} choice={choice} result={result} {...(summaryClassName ? { summaryClassName } : {})} />
      </Stack>
    );
  }

  return (
    <Tabs
      value={group}
      onValueChange={(next) => groupChoice.isValue(next) && setGroup(next)}
      className="flex flex-col gap-5"
      data-adoption-panel=""
    >
      <ModeTabs
        label={adoptionCopy.panelLabel}
        items={[
          { id: "package", label: adoptionCopy.modes.package },
          { id: "copy", label: adoptionCopy.modes.copy },
        ]}
        listClass={PRIMARY_LIST_CLASS}
        triggerClass={PRIMARY_TRIGGER_CLASS}
      />
      <TabsContent value="package" className="mt-0">
        <ModeView mode={packageMode} highlighted={highlighted} choice={choice} result={result} {...(summaryClassName ? { summaryClassName } : {})} />
      </TabsContent>
      <TabsContent value="copy" className="mt-0">
        <CopyMethods modes={copyModes} highlighted={highlighted} choice={choice} result={result} {...(summaryClassName ? { summaryClassName } : {})} />
      </TabsContent>
    </Tabs>
  );
}
