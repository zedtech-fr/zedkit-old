"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button, Stack, TabsContent, Text, ThemeScope } from "@zedtech/zedkit-ui";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { HOME_IDENTITY_FACTS, isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HomeIdentityLooksFacts } from "@/ui/home/home-identity-looks-facts";
import { HomeIdentityLooksStage } from "@/ui/home/home-identity-looks-stage";
import { HomeIdentityLooksTabs } from "@/ui/home/home-identity-looks-tabs";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

const noop = () => () => {};

export function HomeIdentityLooks() {
  const [identity, setIdentity] = useState<IdentityId>("mist");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const facts = HOME_IDENTITY_FACTS[identity];

  return (
    <Stack gap={3} className="min-w-0 scroll-mt-24" data-home-identity-looks="">
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
            <HomeIdentityLooksStage identity={identity} />
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
