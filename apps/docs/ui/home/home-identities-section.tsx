import { Section, Stack, Text } from "@zedtech/zedkit-ui";
import { HomeIdentityLooks } from "@/ui/home/home-identity-looks";
import { HomeYoursScene } from "@/ui/home/home-yours-scene";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";

/** Comparison: a different product in each look, right after the proof and before the visitor decides how to adopt. */
export function HomeIdentitiesSection() {
  return (
    <Section
      bleed
      tone="muted"
      spacing="md"
      containerWidth="wide"
      id="identities"
      title={homeIdentityLooksCopy.title}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack id="use-cases" gap={HOME_SECTION_CONTENT_GAP} className="scroll-mt-24">
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {homeIdentityLooksCopy.body}
        </Text>
        <HomeIdentityLooks />
        <HomeYoursScene />
      </Stack>
    </Section>
  );
}
