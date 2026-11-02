import { Badge, Section, Stack } from "@zedtech/zedkit-ui";
import { stackCopy } from "@/components/demos/i18n/stack-copy";

export function StackDemo() {
  return (
    <Section title={stackCopy.title} description={stackCopy.description}>
      <Stack direction="horizontal" gap={2}>
        <Badge>{stackCopy.ada}</Badge>
        <Badge variant="secondary">{stackCopy.bo}</Badge>
      </Stack>
    </Section>
  );
}
