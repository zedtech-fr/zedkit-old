"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore, type ComponentType } from "react";
import { useTheme } from "next-themes";
import { Button, Stack, TabsContent, Text, ThemeScope } from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HOME_IDENTITY_FACTS, IDENTITY_IDS, isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityExampleGlass } from "@/ui/home/home-identity-example-glass";
import { HomeIdentityExampleMaison } from "@/ui/home/home-identity-example-maison";
import { HomeIdentityExampleMist } from "@/ui/home/home-identity-example-mist";
import { HomeIdentityExamplePress } from "@/ui/home/home-identity-example-press";
import { HomeIdentityExampleTide } from "@/ui/home/home-identity-example-tide";
import { HomeIdentityExampleVolt } from "@/ui/home/home-identity-example-volt";
import { HomeIdentityLooksFacts } from "@/ui/home/home-identity-looks-facts";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { useClippedStage } from "@/ui/home/use-clipped-stage";
import { usePinnedSteps } from "@/ui/home/use-pinned-steps";

const noop = () => () => {};

/** One product screen per identity: each look is shown doing the job it suits, not the same page restyled. */
const EXAMPLES: Record<IdentityId, ComponentType> = {
  mist: HomeIdentityExampleMist,
  press: HomeIdentityExamplePress,
  tide: HomeIdentityExampleTide,
  volt: HomeIdentityExampleVolt,
  maison: HomeIdentityExampleMaison,
  glass: HomeIdentityExampleGlass,
};

export function HomeIdentityLooks() {
  const [identity, setIdentity] = useState<IdentityId>("mist");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const facts = HOME_IDENTITY_FACTS[identity];
  const onStep = useCallback((step: number) => setIdentity(IDENTITY_IDS[step]!), []);
  const { track, pin, goTo } = usePinnedSteps({ count: IDENTITY_IDS.length, onStep });

  return (
    <Stack gap={3} className="min-w-0 scroll-mt-24" data-home-identity-looks="">
      <Stack gap={1} className="min-w-0">
        <Text as="p" variant="muted" typeRole="caption" className="text-xs leading-snug">
          {homeIdentityLooksCopy.liveNote}
        </Text>
        <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
          <span data-identity-pinned-hint="">{homeIdentityLooksCopy.scrollHint}</span>
        </Text>
      </Stack>
      {/* The track is as tall as the pin plus one stretch of scroll per example; see home-identity-scroll.css. */}
      <div ref={track} data-identity-track="" data-count={IDENTITY_IDS.length}>
        <div ref={pin} data-identity-pin="">
          <HomeIdentityLooksTabs
            value={identity}
            mode={mode}
            onValueChange={(next) => {
              if (!isIdentityId(next)) return;
              setIdentity(next);
              goTo(IDENTITY_IDS.indexOf(next));
            }}
          >
            <TabsContent value={identity} className="mt-0">
              <HomeIdentityLooksFrame identity={identity} mode={mode} facts={facts} />
            </TabsContent>
          </HomeIdentityLooksTabs>
        </div>
      </div>
      <HomeIdentityLooksLinks />
    </Stack>
  );
}

function HomeIdentityLooksFrame({
  identity,
  mode,
  facts,
}: {
  identity: IdentityId;
  mode: "light" | "dark";
  facts: (typeof HOME_IDENTITY_FACTS)[IdentityId];
}) {
  const Example = EXAMPLES[identity];
  const stage = useClippedStage(identity);

  return (
    <Stack gap={3} className="min-w-0" data-identity-frame="">
      <div className="grid min-w-0 gap-4 lg:grid-cols-3" data-identity-frame-grid="">
        <div className="min-w-0 rounded-xl border border-border lg:col-span-2" data-identity-frame-stage="">
          <ThemeScope
            ref={stage}
            identity={identity}
            mode={mode}
            data-home-identity-stage=""
            className="min-w-0 rounded-xl bg-background p-2 pb-[max(4.5rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4"
          >
            <div data-identity-example="" key={identity}>
              <Example />
            </div>
            <span
              aria-hidden="true"
              data-identity-fade=""
              className="pointer-events-none sticky bottom-0 -mt-12 block h-12 bg-linear-to-b from-transparent to-background"
            />
          </ThemeScope>
        </div>
        <aside className="hidden min-w-0 lg:block">
          <HomeIdentityLooksFacts key={identity} facts={facts} mode={mode} />
        </aside>
      </div>
      <details className="min-w-0 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">
          {homeIdentityLooksCopy.factsSummary(facts.label)}
        </summary>
        <div className="pt-2">
          <HomeIdentityLooksFacts facts={facts} mode={mode} />
        </div>
      </details>
    </Stack>
  );
}

function HomeIdentityLooksLinks() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Button asChild variant="outline" size="sm" className="w-fit">
        <Link href={`${IDENTITY_EDITOR_HREF}#create`}>{homeIdentityLooksCopy.openEditor}</Link>
      </Button>
      <Button asChild variant="link" size="sm" className="w-fit">
        <Link href="/features/identity-kit-demos">{homeIdentityLooksCopy.seeInComponents}</Link>
      </Button>
      <Button asChild variant="link" size="sm" className="w-fit">
        <Link href="/docs/start-without-writing-code">{homeIdentityLooksCopy.startWithoutCode}</Link>
      </Button>
    </Stack>
  );
}
