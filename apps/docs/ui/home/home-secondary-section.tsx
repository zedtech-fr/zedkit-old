import { HomeLink } from "@/ui/home/home-link";
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
          className="flex-wrap items-center justify-between gap-y-2 border-b border-border/60 pb-3 last:border-0 md:grid md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:items-baseline md:gap-x-8"
        >
          <Stack gap={1} className="min-w-0">
            <Text className="font-medium">{entry.title}</Text>
            <Text variant="muted" typeRole="caption" className={`line-clamp-2 md:line-clamp-none ${HOME_METADATA_TEXT_CLASS}`}>
              {entry.summary}
            </Text>
          </Stack>
          <Button asChild variant="outline" size="sm" className="min-h-11 w-fit shrink-0 md:min-h-0">
            <HomeLink href={entry.href}>
              <DocsActionLabel>{entry.linkLabel}</DocsActionLabel>
            </HomeLink>
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
