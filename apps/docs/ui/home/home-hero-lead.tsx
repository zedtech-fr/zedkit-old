import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { DOCS_TYPE_BODY_CLASS } from "@/lib/docs-type-roles";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import { HomeHeroLeadActions } from "@/ui/home/home-hero-lead-actions";

export function HomeHeroLead({ className }: { className?: string }) {
  return (
    <Stack gap={8} className={`min-w-0 items-start ${className ?? ""}`} data-home-hero-lead="">
      <Stack gap={2} className="min-w-0 items-start">
        <Text typeRole="label" className={`text-muted-foreground ${HOME_METADATA_TEXT_CLASS}`} data-home-hero-category="">
          {homeCopy.hero.titleCategory}
        </Text>
        <Heading level={1} typeRole="display" className="max-w-lg text-balance">
          {homeCopy.hero.title}
        </Heading>
      </Stack>
      <Text variant="muted" typeRole="body" className={`max-w-md ${DOCS_TYPE_BODY_CLASS}`} data-home-hero-sub="">
        {homeCopy.hero.sub}
      </Text>
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <HomeHeroLeadActions />
        <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
          {homeCopy.hero.facts}
        </Text>
      </Stack>
    </Stack>
  );
}
