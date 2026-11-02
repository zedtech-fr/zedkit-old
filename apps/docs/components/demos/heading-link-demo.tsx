import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { headingLinkCopy } from "@/components/demos/i18n/heading-link-copy";

export function HeadingLinkDemo() {
  return (
    <Stack gap={1} className="min-w-0">
      <Text variant="muted">{headingLinkCopy.eyebrow}</Text>
      <Heading level={2} asChild>
        <a href="#section">{headingLinkCopy.linkText}</a>
      </Heading>
      <Text variant="muted">{headingLinkCopy.hint}</Text>
    </Stack>
  );
}
