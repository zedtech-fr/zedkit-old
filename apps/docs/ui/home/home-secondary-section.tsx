import Link from "next/link";
import { Button, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import {
  HOME_METADATA_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

function HomeSecondaryEntryLinks({ entryPoints }: { entryPoints: HomeEntryPoint[] }) {
  return (
    <Stack gap={2} className="min-w-0" data-home-secondary-links="">
      {entryPoints.map((entry) => (
        <Stack
          key={entry.href}
          direction="horizontal"
          gap={2}
          className="flex-wrap items-baseline justify-between gap-y-1 border-b border-border/60 pb-3 last:border-0"
        >
          <Stack gap={1} className="min-w-0">
            <Text className="font-medium">{entry.title}</Text>
            <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
              {homeCopy.secondary.entryNeedsLine(entry.needCount, entry.summary.split(".")[0]!)}
            </Text>
          </Stack>
          <Button asChild variant="ghost" size="sm" className="w-fit shrink-0">
            <Link href={entry.href}>
              <DocsActionLabel>{entry.linkLabel}</DocsActionLabel>
            </Link>
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}

/** Packages and agents: one quiet band after the main path. */
export function HomeSecondarySection({
  entryPoints,
}: {
  entryPoints: HomeEntryPoint[];
}) {
  return (
    <Section
      bleed
      tone="muted"
      spacing="md"
      containerWidth="wide"
      id="entry-points"
      title={homeCopy.secondary.section.title}
      description={homeCopy.secondary.section.description}
      {...HOME_SECTION_REVEAL_PROPS}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP}>
        <HomeSecondaryEntryLinks entryPoints={entryPoints} />
      </Stack>
    </Section>
  );
}
