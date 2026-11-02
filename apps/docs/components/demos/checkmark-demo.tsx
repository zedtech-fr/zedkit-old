import { Checkmark, Stack } from "@zedtech/zedkit-ui";
import { checkmarkCopy } from "@/components/demos/i18n/checkmark-copy";

export function CheckmarkDemo() {
  return (
    <Stack gap={2}>
      <Checkmark label={checkmarkCopy.demo.savedLabel} />
      <Checkmark />
    </Stack>
  );
}
