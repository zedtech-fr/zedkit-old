"use client";

import type { ReactNode } from "react";
import { Heading, Stack, Text, cn } from "@zedtech/zedkit-ui";

import { CommandBlock, FileBlock, SnippetBlock } from "@/components/adoption-blocks";
import { adoptionCopy } from "@/components/i18n/adoption-copy";
import { blockKey, type AdoptionBlock, type AdoptionMode, type AdoptionStep } from "@/lib/adoption-types";
import type { PackageManager } from "@/lib/package-manager-commands";

/** Rendered code by block key; see `blockKey`. */
export type Highlighted = Record<string, ReactNode>;

type Choice = { pm: PackageManager; onPm: (pm: PackageManager) => void };

function highlightedCommands(highlighted: Highlighted, key: string) {
  return {
    pnpm: highlighted[`${key}:pnpm`],
    npm: highlighted[`${key}:npm`],
    yarn: highlighted[`${key}:yarn`],
  };
}

function Block({
  block,
  highlighted,
  keyId,
  choice,
  picker,
}: {
  block: AdoptionBlock;
  highlighted: Highlighted;
  keyId: string;
  choice: Choice;
  picker: boolean;
}) {
  if (block.kind === "command") {
    return (
      <CommandBlock
        commands={block.commands}
        pm={choice.pm}
        onPm={choice.onPm}
        picker={picker}
        highlighted={highlightedCommands(highlighted, keyId)}
      />
    );
  }
  if (block.kind === "snippet") {
    return <SnippetBlock title={block.title ?? adoptionCopy.importTitle} code={block.code} highlighted={highlighted[keyId]} />;
  }
  return (
    <FileBlock path={block.path} action={block.action} code={block.code} tall={block.code.split("\n").length > 14} highlighted={highlighted[keyId]} />
  );
}

/** What the code above produces, labelled as an example so it is never mistaken for a control of the site. */
function RenderedExample({ children }: { children: ReactNode }) {
  return (
    <Stack gap={2} role="group" aria-label={adoptionCopy.result.label} data-adoption-result="">
      <Text as="span" className="text-xs font-medium text-muted-foreground">
        {adoptionCopy.result.label}
      </Text>
      <Stack direction="horizontal" className="rounded-lg border border-border p-4">
        {/* Inert: a specimen, not a control. It leaves the tab order and the page's own actions. */}
        <Text as="span" inert>
          {children}
        </Text>
      </Stack>
      <Text variant="muted" className="text-xs">
        {adoptionCopy.result.caption}
      </Text>
    </Stack>
  );
}

function CompanionFiles({ count, children }: { count: number; children: ReactNode }) {
  return (
    <details className="group min-w-0 rounded-lg border border-border">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-medium focus-ring">
        {adoptionCopy.companions(count)}
        <Text as="span" className="font-normal text-muted-foreground">
          {adoptionCopy.companionsHint}
        </Text>
      </summary>
      <Stack gap={3} className="p-3 pt-0">
        {children}
      </Stack>
    </details>
  );
}

function StepBlocks({
  mode,
  step,
  highlighted,
  choice,
  firstCommand,
}: {
  mode: AdoptionMode;
  step: AdoptionStep;
  highlighted: Highlighted;
  choice: Choice;
  firstCommand: boolean;
}) {
  let pickerUsed = !firstCommand;
  const rows = step.blocks.map((block, index) => {
    const keyId = blockKey(mode.id, step.id, index);
    const picker = block.kind === "command" && !pickerUsed;
    if (picker) pickerUsed = true;
    return { block, keyId, picker, companion: block.kind === "file" && block.role === "companion" };
  });
  const companions = rows.filter((row) => row.companion);
  const render = (row: (typeof rows)[number]) => (
    <Block key={row.keyId} block={row.block} keyId={row.keyId} highlighted={highlighted} choice={choice} picker={row.picker} />
  );
  return (
    <>
      {rows.filter((row) => !row.companion).map(render)}
      {companions.length > 0 ? <CompanionFiles count={companions.length}>{companions.map(render)}</CompanionFiles> : null}
    </>
  );
}

function Step({
  mode,
  step,
  index,
  highlighted,
  choice,
  firstCommand,
  result,
}: {
  mode: AdoptionMode;
  step: AdoptionStep;
  index: number;
  highlighted: Highlighted;
  choice: Choice;
  firstCommand: boolean;
  result: ReactNode;
}) {
  const words = adoptionCopy.step(step.id, step.params ?? {}, mode.id);
  return (
    <li className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2" data-adoption-step={step.id}>
      <Text as="span" aria-hidden className="pt-0.5 font-mono text-sm text-muted-foreground">
        {index + 1}
      </Text>
      <Stack gap={3} className="min-w-0">
        <Stack gap={1}>
          <Heading level={4} as="h3" className="text-base">
            {words.title}
          </Heading>
          {words.note ? (
            <Text variant="muted" className="text-sm">
              {words.note}
            </Text>
          ) : null}
        </Stack>
        <StepBlocks mode={mode} step={step} highlighted={highlighted} choice={choice} firstCommand={firstCommand} />
        {step.id === "render" && result ? <RenderedExample>{result}</RenderedExample> : null}
      </Stack>
    </li>
  );
}

/** One way in, start to finish: what it gives, what it needs, then the steps in order. */
export function ModeView({
  mode,
  highlighted,
  choice,
  result,
  summaryClassName = "text-sm",
}: {
  mode: AdoptionMode;
  highlighted: Highlighted;
  choice: Choice;
  result: ReactNode;
  /** Type role of the "You get / You need" lines: docs pages read at the dense size, the home page at its own. */
  summaryClassName?: string;
}) {
  const firstCommandStep = mode.steps.findIndex((step) => step.blocks.some((block) => block.kind === "command"));
  return (
    <Stack gap={6} data-adoption-mode={mode.id}>
      <dl className={cn("m-0 grid gap-x-6 gap-y-2 text-muted-foreground sm:grid-cols-[max-content_1fr] sm:items-baseline", summaryClassName)}>
        <dt className="m-0 font-normal text-foreground">{adoptionCopy.youGet}</dt>
        <dd className="m-0 min-w-0">{adoptionCopy.gives[mode.gives]}</dd>
        <dt className="m-0 font-normal text-foreground">{adoptionCopy.youNeed}</dt>
        <dd className="m-0 min-w-0">
          <ul className="m-0 list-none space-y-1 p-0">
            {mode.requires.map((need) => (
              <li key={need}>{adoptionCopy.requires[need]}</li>
            ))}
          </ul>
        </dd>
      </dl>
      <ol className="m-0 flex list-none flex-col gap-6 p-0">
        {mode.steps.map((step, index) => (
          <Step
            key={step.id}
            mode={mode}
            step={step}
            index={index}
            highlighted={highlighted}
            choice={choice}
            firstCommand={index === firstCommandStep}
            result={result}
          />
        ))}
      </ol>
    </Stack>
  );
}
