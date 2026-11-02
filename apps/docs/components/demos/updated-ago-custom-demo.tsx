import { Stack, Text, UpdatedAgo } from "@zedtech/zedkit-ui";
import { updatedAgoCopy } from "@/components/demos/i18n/updated-ago-copy";

export function UpdatedAgoCustomDemo() {
  return (
    <Stack gap={1}>
      <Text className="font-medium">{updatedAgoCopy.title}</Text>
      <UpdatedAgo date={Date.now() - 4 * 60_000} prefix={updatedAgoCopy.prefix} />
    </Stack>
  );
}
