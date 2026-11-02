import { Stack, Text, Wizard, WizardStep } from "@zedtech/zedkit-ui";
import { wizardCopy } from "@/components/demos/i18n/wizard-copy";

export function WizardComposedDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Wizard>
        <WizardStep step={wizardCopy.composed.cart} index={0} state="done" showConnector />
        <WizardStep step={wizardCopy.composed.delivery} index={1} state="done" showConnector />
        <WizardStep step={wizardCopy.composed.payment} index={2} state="current" showConnector />
        <WizardStep step={wizardCopy.composed.confirmation} index={3} state="todo" />
      </Wizard>
      <Text variant="muted">{wizardCopy.composed.note}</Text>
    </Stack>
  );
}
