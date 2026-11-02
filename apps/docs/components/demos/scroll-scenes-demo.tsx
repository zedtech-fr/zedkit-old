"use client";

import {
  Badge,
  Button,
  Heading,
  ProgressBar,
  ScrollScenes,
  Stack,
  Text,
  ThemeScope,
} from "@zedtech/zedkit-ui";
import { scrollScenesCopy } from "@/components/demos/i18n/scroll-scenes-copy";

/**
 * Scene visuals are decorative: the caption carries the message, so each
 * visual is hidden from assistive tech and made inert (no tab stops inside).
 */
const VISUAL_CLASS = "min-w-0 rounded-xl border border-border bg-background p-4";

type SceneStatus = (typeof scrollScenesCopy.status)[keyof typeof scrollScenesCopy.status];

function Caption({ step, title, children }: { step: string; title: string; children: string }) {
  return (
    <Stack gap={2} className="min-w-0">
      <Text variant="muted" className="m-0! text-xs">
        {step}
      </Text>
      <Heading level={2} className="m-0!">{title}</Heading>
      <Text variant="muted" className="m-0!">{children}</Text>
    </Stack>
  );
}

function Visual({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Stack gap={3} aria-hidden="true" inert data-demo-scene-visual={id} className={VISUAL_CLASS}>
      {children}
    </Stack>
  );
}

function TaskRow({ name, owner, status }: { name: string; owner: string; status: SceneStatus }) {
  return (
    <Stack direction="horizontal" gap={3} className="min-w-0 items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0">
      <Stack gap={1} className="min-w-0">
        <Text className="m-0! truncate font-medium">{name}</Text>
        <Text variant="muted" className="m-0! truncate text-xs">
          {owner}
        </Text>
      </Stack>
      <Badge variant={status === scrollScenesCopy.status.done ? "secondary" : "outline"}>{status}</Badge>
    </Stack>
  );
}

/** A three-step product tour for a fictional app, pinned under a 4.5rem header. */
export function ScrollScenesDemo() {
  const { plan, track, ship } = scrollScenesCopy.tour;
  return (
    <ScrollScenes
      className="[--zk-scenes-top:4.5rem]"
      scenes={[
        {
          id: "plan",
          caption: (
            <Caption step={plan.step} title={plan.title}>
              {plan.body}
            </Caption>
          ),
          children: (
            <Visual id="plan">
              {plan.rows.map((row) => (
                <TaskRow key={row.name} name={row.name} owner={row.owner} status={row.status} />
              ))}
            </Visual>
          ),
        },
        {
          id: "track",
          caption: (
            <Caption step={track.step} title={track.title}>
              {track.body}
            </Caption>
          ),
          children: (
            <Visual id="track">
              {track.rows.map((row) => (
                <TaskRow key={row.name} name={row.name} owner={row.owner} status={row.status} />
              ))}
              <ProgressBar value={55} label={track.progress} />
            </Visual>
          ),
        },
        {
          id: "ship",
          caption: (
            <Caption step={ship.step} title={ship.title}>
              {ship.body}
            </Caption>
          ),
          children: (
            <Visual id="ship">
              {ship.rows.map((row) => (
                <TaskRow key={row.name} name={row.name} owner={row.owner} status={row.status} />
              ))}
              <ProgressBar value={100} label={ship.progress} />
            </Visual>
          ),
        },
      ]}
    />
  );
}

/** Two scenes with a shorter scroll per scene: before / after on a changelog page. */
export function ScrollScenesBeforeAfterDemo() {
  const { before, after } = scrollScenesCopy.compare;
  return (
    <ScrollScenes
      className="[--zk-scenes-step:45svh] [--zk-scenes-top:4.5rem]"
      scenes={[
        {
          id: "before",
          caption: (
            <Caption step={before.step} title={before.title}>
              {before.body}
            </Caption>
          ),
          children: (
            <Visual id="before">
              <ProgressBar value={18} label={before.progress} />
              <Text variant="muted" className="m-0!">{before.result}</Text>
            </Visual>
          ),
        },
        {
          id: "after",
          caption: (
            <Caption step={after.step} title={after.title}>
              {after.body}
            </Caption>
          ),
          children: (
            <Visual id="after">
              <ProgressBar value={64} label={after.progress} />
              <Text variant="muted" className="m-0!">{after.result}</Text>
            </Visual>
          ),
        },
      ]}
    />
  );
}

/** The same product card, restyled by ThemeScope as the page scrolls. */
export function ScrollScenesLooksDemo() {
  const { product, tagline, save, cancel, scenes } = scrollScenesCopy.looks;
  return (
    <ScrollScenes
      className="[--zk-scenes-top:4.5rem]"
      scenes={scenes.map((scene) => ({
        id: scene.id,
        caption: (
          <Caption step={scene.step} title={scene.title}>
            {scene.body}
          </Caption>
        ),
        children: (
          <ThemeScope identity={scene.id}>
            <Visual id={scene.id}>
              <Stack direction="horizontal" gap={2} className="items-center justify-between">
                <Text className="m-0! font-semibold">{product}</Text>
                <Badge variant="secondary">{scene.badge}</Badge>
              </Stack>
              <Text variant="muted" className="m-0!">
                {tagline}
              </Text>
              <Stack direction="horizontal" gap={2}>
                <Button size="sm">{save}</Button>
                <Button size="sm" variant="outline">
                  {cancel}
                </Button>
              </Stack>
            </Visual>
          </ThemeScope>
        ),
      }))}
    />
  );
}

/** Three prices on one pinned stage — a marketing page that scrolls instead of tabbing. */
export function ScrollScenesPricingDemo() {
  return (
    <ScrollScenes
      className="[--zk-scenes-top:4.5rem]"
      scenes={scrollScenesCopy.pricing.plans.map((plan) => ({
        id: plan.id,
        caption: (
          <Caption step={plan.step} title={plan.title}>
            {plan.body}
          </Caption>
        ),
        children: (
          <Visual id={plan.id}>
            <Stack direction="horizontal" gap={2} className="items-baseline">
              <Text className="m-0! text-3xl font-semibold">{plan.price}</Text>
              <Text variant="muted" className="m-0!">
                {scrollScenesCopy.pricing.period}
              </Text>
            </Stack>
            <Stack gap={1}>
              {plan.features.map((feature) => (
                <Text key={feature} className="m-0! text-sm">
                  {feature}
                </Text>
              ))}
            </Stack>
          </Visual>
        ),
      }))}
    />
  );
}
