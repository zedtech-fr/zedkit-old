import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { typographyCopy } from "@/components/demos/i18n/typography-copy";

export function TypographyDemo() {
  return (
    <Stack gap={2}>
      <Heading level={1} as="h2">{typographyCopy.page}</Heading>
      <Heading level={2}>{typographyCopy.section}</Heading>
      <Text>{typographyCopy.body}</Text>
      <Text variant="muted">{typographyCopy.secondary}</Text>
      <Heading level={2} asChild>
        <a href="#typography-as-link">{typographyCopy.link}</a>
      </Heading>
    </Stack>
  );
}
