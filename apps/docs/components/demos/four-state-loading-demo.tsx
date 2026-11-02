import { Spinner, Stack, Text } from "@zedtech/zedkit-ui";
import { fourStateCopy } from "@/components/demos/i18n/four-state-copy";

export function FourStateLoadingDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <Spinner label={fourStateCopy.loading.spinnerLabel} />
      <Text>{fourStateCopy.loading.text}</Text>
    </Stack>
  );
}
