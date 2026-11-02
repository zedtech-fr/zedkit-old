import { Label, SecretField, Stack } from "@zedtech/zedkit-ui";
import { secretFieldCopy } from "@/components/demos/i18n/secret-field-copy";

export function SecretFieldDemo() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Label htmlFor="demo-key">{secretFieldCopy.key}</Label>
        <SecretField id="demo-key" value={secretFieldCopy.keyValue} />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="demo-command">{secretFieldCopy.command}</Label>
        <SecretField
          multiline
          id="demo-command"
          value="pnpm dlx shadcn@latest add https://zedkit.app/r/themes/volt.json"
          copyLabel={secretFieldCopy.copy}
        />
      </Stack>
    </Stack>
  );
}
