"use client";

import { HomeLink } from "@/ui/home/home-link";
import { useState, useSyncExternalStore, type ComponentType } from "react";
import { useTheme } from "next-themes";
import { Button, Stack, TabsContent, Text, ThemeScope } from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HOME_IDENTITY_FACTS, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityExampleMaison } from "@/ui/home/home-identity-example-maison";
import { HomeIdentityExampleMist } from "@/ui/home/home-identity-example-mist";
import { HomeIdentityExamplePress } from "@/ui/home/home-identity-example-press";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

const noop = () => () => {};

/** One product screen per look: each is shown doing the job it suits, not the same page restyled. */
const EXAMPLES: Record<IdentityId, ComponentType> = {
  mist: HomeIdentityExampleMist,
  press: HomeIdentityExamplePress,
  maison: HomeIdentityExampleMaison,
};

/** One stage, one example at a time. The page scrolls normally: nothing is pinned or clipped. */
export function HomeIdentityLooks() {
  const [identity, setIdentity] = useState<IdentityId>("mist");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const facts = HOME_IDENTITY_FACTS[identity];
  const Example = EXAMPLES[identity];

  return (
    <Stack gap={3} className="min-w-0 scroll-mt-24" data-home-identity-looks="">
      <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
        {homeIdentityLooksCopy.liveNote}
      </Text>
      <HomeIdentityLooksTabs value={identity} mode={mode} onValueChange={setIdentity}>
        <TabsContent value={identity} className="mt-0">
          <div className="min-w-0 rounded-xl border border-border" data-identity-frame-stage="">
            <ThemeScope
              identity={identity}
              mode={mode}
              data-home-identity-stage=""
              className="min-w-0 rounded-xl bg-background p-2 sm:p-4"
            >
              <div data-identity-example="" key={identity}>
                <Example />
              </div>
            </ThemeScope>
          </div>
        </TabsContent>
      </HomeIdentityLooksTabs>
      <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS} data-identity-caption="">
        {homeIdentityLooksCopy.caption(facts.label, facts.type, facts.shape)}
      </Text>
      <HomeIdentityLooksLinks />
    </Stack>
  );
}

function HomeIdentityLooksLinks() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Button asChild variant="outline" size="sm" className="w-fit">
        <HomeLink href={`${IDENTITY_EDITOR_HREF}#create`}>{homeIdentityLooksCopy.openEditor}</HomeLink>
      </Button>
      <Button asChild variant="link" size="sm" className="w-fit">
        <HomeLink href="/features/identity-kit-demos">{homeIdentityLooksCopy.seeInComponents}</HomeLink>
      </Button>
      <Button asChild variant="link" size="sm" className="w-fit">
        <HomeLink href="/docs/start-without-writing-code">{homeIdentityLooksCopy.startWithoutCode}</HomeLink>
      </Button>
    </Stack>
  );
}
