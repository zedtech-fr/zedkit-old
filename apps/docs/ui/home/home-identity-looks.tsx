"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ComponentType } from "react";
import { useTheme } from "next-themes";
import { Button, Stack, TabsContent, Text, ThemeScope } from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HOME_IDENTITY_FACTS, isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityExampleGlass } from "@/ui/home/home-identity-example-glass";
import { HomeIdentityExampleMaison } from "@/ui/home/home-identity-example-maison";
import { HomeIdentityExampleMist } from "@/ui/home/home-identity-example-mist";
import { HomeIdentityExamplePress } from "@/ui/home/home-identity-example-press";
import { HomeIdentityExampleTide } from "@/ui/home/home-identity-example-tide";
import { HomeIdentityExampleVolt } from "@/ui/home/home-identity-example-volt";
import { HomeIdentityLooksFacts } from "@/ui/home/home-identity-looks-facts";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import { HOME_CARD_TITLE_CLASS, HOME_METADATA_TEXT_CLASS, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";

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

  return (
    <Stack gap={3} className="min-w-0 scroll-mt-24" data-home-identity-looks="">
      <Text className={HOME_CARD_TITLE_CLASS}>{homeIdentityLooksCopy.title}</Text>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {homeIdentityLooksCopy.body}
      </Text>
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        {homeIdentityLooksCopy.liveNote}
      </Text>
      <HomeIdentityLooksTabs
        value={identity}
        mode={mode}
        onValueChange={(next) => {
          if (isIdentityId(next)) setIdentity(next);
        }}
      >
        <TabsContent value={identity} className="mt-0">
          <HomeIdentityLooksFrame identity={identity} mode={mode} facts={facts} />
        </TabsContent>
      </HomeIdentityLooksTabs>
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
  return (
    <Stack gap={3} className="min-w-0">
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-border lg:col-span-2">
          <ThemeScope
            identity={identity}
            mode={mode}
            data-home-identity-stage=""
            className="min-w-0 rounded-xl bg-background p-2 sm:p-4"
          >
            <Example />
          </ThemeScope>
        </div>
        <aside className="hidden min-w-0 lg:block">
          <HomeIdentityLooksFacts facts={facts} mode={mode} />
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
        <Link href={IDENTITY_EDITOR_HREF}>{homeIdentityLooksCopy.openEditor}</Link>
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
