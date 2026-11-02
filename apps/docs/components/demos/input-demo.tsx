import { Input, Label, Stack, Text } from "@zedtech/zedkit-ui";
import { inputCopy } from "@/components/demos/i18n/input-copy";

export function InputDemo() {
  return (
    <Stack gap={4} className="min-w-0">
      <Stack gap={2}>
        <Label htmlFor="demo-name">{inputCopy.name}</Label>
        <Input id="demo-name" autoComplete="name" defaultValue={inputCopy.nameValue} />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="demo-email">{inputCopy.email}</Label>
        <Input id="demo-email" type="email" autoComplete="email" placeholder={inputCopy.emailPlaceholder} />
        <Text variant="muted" className="text-xs">
          {inputCopy.emailHint}
        </Text>
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="demo-company">{inputCopy.company}</Label>
        <Input id="demo-company" disabled defaultValue={inputCopy.companyValue} />
      </Stack>
    </Stack>
  );
}
