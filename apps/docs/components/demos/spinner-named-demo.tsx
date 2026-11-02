import { Spinner, Stack, Text } from "@zedtech/zedkit-ui";
import { spinnerCopy } from "@/components/demos/i18n/spinner-copy";

export function SpinnerNamedDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <Spinner label={spinnerCopy.saving} />
      <Text>{spinnerCopy.saving}</Text>
    </Stack>
  );
}
