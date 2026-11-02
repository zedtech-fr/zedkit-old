import { Button, Stack } from "@zedtech/zedkit-ui";
import { buttonCopy } from "@/components/demos/i18n/button-copy";

/** Sizes side by side, then the disabled in-flight state. */
export function ButtonSizesDemo() {
  return (
    <Stack gap={4}>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button size="sm">{buttonCopy.small}</Button>
        <Button>{buttonCopy.default}</Button>
        <Button size="lg">{buttonCopy.large}</Button>
      </Stack>
      <Stack direction="horizontal" gap={2}>
        <Button disabled>{buttonCopy.saving}</Button>
      </Stack>
    </Stack>
  );
}
