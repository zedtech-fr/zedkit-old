import { Alert, AlertDescription, AlertTitle, Stack } from "@zedtech/zedkit-ui";
import { alertCopy } from "@/components/demos/i18n/alert-copy";

export function AlertDemo() {
  return (
    <Stack gap={2}>
      <Alert>
        <AlertTitle>{alertCopy.demo.headsUpTitle}</AlertTitle>
        <AlertDescription>{alertCopy.demo.headsUpDescription}</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>{alertCopy.demo.failedTitle}</AlertTitle>
        <AlertDescription>{alertCopy.demo.failedDescription}</AlertDescription>
      </Alert>
      <Alert asChild>
        <section aria-label={alertCopy.demo.maintenanceAriaLabel}>
          <AlertTitle>{alertCopy.demo.maintenanceTitle}</AlertTitle>
          <AlertDescription>{alertCopy.demo.maintenanceDescription}</AlertDescription>
        </section>
      </Alert>
    </Stack>
  );
}
