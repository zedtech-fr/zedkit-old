import { Input, Label, Stack } from "@zedtech/zedkit-ui";
import { labelCopy } from "@/components/demos/i18n/label-copy";

export function LabelDemo() {
  return (
    <Stack gap={2}>
      <Label htmlFor="label-project">{labelCopy.project}</Label>
      <Input id="label-project" placeholder={labelCopy.projectPlaceholder} />
    </Stack>
  );
}
