"use client";

import { X } from "lucide-react";
import { Checkmark, Heading, IconButton, PromptInput, Stack, StatusDot, Surface, Text } from "@zedtech/zedkit-ui";
import { DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import { HERO_AGENT_PHASES, type HeroAgentStatus } from "@/ui/home/use-hero-agent";

const copy = homeCopy.heroApp.agent;

type PhaseState = "pending" | "running" | "done";

function phaseState(index: number, step: number, status: HeroAgentStatus): PhaseState {
  if (status === "idle") return "pending";
  return index < step ? "done" : index === step ? "running" : "pending";
}

function PhaseMark({ state }: { state: PhaseState }) {
  if (state === "done") return <Checkmark />;
  return <StatusDot tone={state === "running" ? "active" : "idle"} />;
}

function PhaseDetail({ id, state }: { id: (typeof HERO_AGENT_PHASES)[number]; state: PhaseState }) {
  if (state === "pending") return null;
  if (id === "rules" && state === "done") {
    return (
      <ul className="m-0 grid list-disc gap-0.5 pl-4">
        {copy.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    );
  }
  if (id === "validate" && state === "done") return <Text as="span" className="font-mono">{copy.validateOk}</Text>;
  return <Text as="span" className={id === "validate" ? "font-mono" : undefined}>{copy.phases[id].detail}</Text>;
}

function PhaseList({ step, status }: { step: number; status: HeroAgentStatus }) {
  return (
  <ol aria-label={copy.progressLabel} className="m-0 grid list-none gap-2 p-0">
    {HERO_AGENT_PHASES.map((phase, index) => {
      const state = phaseState(index, step, status);
      return (
        <li key={phase} data-phase={phase} data-state={state} className="flex min-w-0 gap-2 data-[state=pending]:opacity-60">
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center">
            <PhaseMark state={state} />
          </span>
          <Stack gap={1} className="min-w-0">
            <Text as="span" className="text-sm font-medium">
              {copy.phases[phase].title}
            </Text>
            <Text as="div" variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
              <PhaseDetail id={phase} state={state} />
            </Text>
          </Stack>
        </li>
      );
    })}
  </ol>
  );
}

type PanelProps = {
  id: string;
  draft: string;
  status: HeroAgentStatus;
  step: number;
  onDraft: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * The agent panel of the hero's example app: a composer and the phases of a scripted AI setup run. Loaded when it is
 * first opened (by the tour or the visitor), so it stays out of the first load. It sits over the window's right edge.
 */
export default function HeroAgentPanel({ id, draft, status, step, onDraft, onSubmit, onClose }: PanelProps) {
  const current = status === "running" ? copy.phases[HERO_AGENT_PHASES[Math.min(step, HERO_AGENT_PHASES.length - 1)]!].title : status === "done" ? copy.finished : "";
  return (
    <Surface
      as="section"
      id={id}
      variant="solid"
      elevation={3}
      radius="xl"
      padding="md"
      aria-label={copy.title}
      data-hero-agent-panel=""
      data-status={status}
      className="absolute inset-y-2 right-2 z-20 flex w-[calc(100%-1rem)] min-w-0 motion-reveal flex-col gap-3 overflow-y-auto md:w-80"
    >
      <Stack direction="horizontal" gap={2} className="items-center justify-between">
        <Heading level={2} typeRole="cardTitle">
          {copy.title}
        </Heading>
        <IconButton label={copy.close} variant="ghost" size="icon" onClick={onClose} data-hero-agent-close="">
          <X className="size-4" aria-hidden />
        </IconButton>
      </Stack>
      <PromptInput
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
        onSubmit={onSubmit}
        sendLabel={copy.sendLabel}
        aria-label={copy.composerLabel}
        placeholder={copy.placeholder}
        busy={status === "running"}
        disabled={status === "done"}
        data-hero-agent-field=""
      />
      <PhaseList step={step} status={status} />
      <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
        {copy.note}
      </Text>
      <Text as="span" role="status" className="sr-only">
        {current}
      </Text>
    </Surface>
  );
}
