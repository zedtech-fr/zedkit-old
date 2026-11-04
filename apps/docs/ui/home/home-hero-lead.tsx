import { ArrowRight } from "lucide-react";
import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { DOCS_TYPE_BODY_CLASS } from "@/lib/docs-type-roles";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import { HomeHeroLeadActions } from "@/ui/home/home-hero-lead-actions";

export function HomeHeroLead({ className }: { className?: string }) {
  return (
    <Stack
      gap={8}
      className={`min-w-0 items-start ${className ?? ""}`}
      data-home-hero-lead=""
    >
      <Heading level={1} typeRole="display" className="max-w-lg text-balance">
        {homeCopy.hero.title}
      </Heading>
      <Stack gap={2} className="items-start">
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS} data-home-hero-sub="">
          <span className="font-medium text-foreground">
            {homeCopy.hero.play}{" "}
            {/* The example is beside the text from lg up and under it before that, so the arrow turns with it. */}
            <ArrowRight aria-hidden="true" data-hero-play-arrow="" className="inline-block size-4 align-text-bottom max-lg:rotate-90" />
          </span>
        </Text>
        <Text variant="muted" typeRole="body" className={`max-w-md ${DOCS_TYPE_BODY_CLASS}`}>
          {homeCopy.hero.sub}
        </Text>
      </Stack>
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <HomeHeroLeadActions />
        <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
          {homeCopy.hero.facts}
        </Text>
      </Stack>
    </Stack>
  );
}
