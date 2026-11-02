import { Input, Label, Stack, Text } from "@zedtech/zedkit-ui";
import { labelCopy } from "@/components/demos/i18n/label-copy";

export function LabelRequiredDemo() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Label htmlFor="label-email">
          {labelCopy.required.email}{" "}
          <Text as="span" aria-hidden="true" className="text-destructive">
            {labelCopy.required.mark}
          </Text>
        </Label>
        <Input id="label-email" type="email" required placeholder={labelCopy.required.emailPlaceholder} />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="label-company">{labelCopy.required.company}</Label>
        <Input id="label-company" placeholder={labelCopy.required.companyPlaceholder} />
      </Stack>
    </Stack>
  );
}
