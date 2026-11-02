import { Separator, Stack, Text } from "@zedtech/zedkit-ui";
import { separatorCopy } from "@/components/demos/i18n/separator-copy";

export function SeparatorDemo() {
  return (
    <Stack gap={3}>
      <Text>{separatorCopy.above}</Text>
      <Separator />
      <Text>{separatorCopy.below}</Text>
      <Stack direction="horizontal" gap={3} className="h-6">
        <Text>{separatorCopy.left}</Text>
        <Separator orientation="vertical" />
        <Text>{separatorCopy.right}</Text>
      </Stack>
    </Stack>
  );
}
