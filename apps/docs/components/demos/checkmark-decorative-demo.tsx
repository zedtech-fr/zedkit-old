import { Checkmark, Stack, Text } from "@zedtech/zedkit-ui";
import { checkmarkCopy } from "@/components/demos/i18n/checkmark-copy";

export function CheckmarkDecorativeDemo() {
  return (
    <Stack direction="horizontal" gap={3} className="items-center">
      <Checkmark />
      <Stack gap={1}>
        <Text className="font-medium">{checkmarkCopy.decorative.title}</Text>
        <Text variant="muted">{checkmarkCopy.decorative.subtitle}</Text>
      </Stack>
    </Stack>
  );
}
