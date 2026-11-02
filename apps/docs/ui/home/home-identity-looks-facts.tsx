"use client";

import { cn, Heading, Stack, Text, ThemeScope } from "@zedtech/zedkit-ui";
import type { IdentityFacts } from "@/ui/home/home-identity-facts";
import { HomeIdentityPaletteSwatches } from "@/ui/home/home-identity-looks-swatches";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

const labels = homeIdentityLooksCopy.factLabels;

function FactLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={1} className="min-w-0">
      <Text className={cn("font-medium", HOME_METADATA_TEXT_CLASS)}>{label}</Text>
      <Text className="min-w-0 text-sm">{value}</Text>
    </Stack>
  );
}

/** The identity describes itself in its own type, shape and colour. */
export function HomeIdentityLooksFacts({
  facts,
  mode,
}: {
  facts: IdentityFacts;
  mode: "light" | "dark";
}) {
  return (
    <ThemeScope
      identity={facts.id}
      mode={mode}
      data-home-identity-facts=""
      className="min-w-0 rounded-xl border border-border bg-background p-4"
    >
      <Stack gap={4} className="min-w-0">
        <Stack gap={1} className="min-w-0">
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            {homeIdentityLooksCopy.factsEyebrow}
          </Text>
          <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
            {facts.label}
          </Heading>
          <Text variant="muted" className="text-sm">
            {facts.character}
          </Text>
        </Stack>
        <HomeIdentityPaletteSwatches identity={facts.id} mode={mode} palette={facts.palette} />
        <Stack gap={2} className="min-w-0">
          <FactLine label={labels.type} value={facts.type} />
          <FactLine label={labels.shape} value={facts.shape} />
          <FactLine label={labels.density} value={facts.density} />
        </Stack>
      </Stack>
    </ThemeScope>
  );
}
