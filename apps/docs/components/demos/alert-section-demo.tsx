import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";
import { alertCopy } from "@/components/demos/i18n/alert-copy";

export function AlertSectionDemo() {
  return (
    <Alert asChild>
      <section aria-label={alertCopy.section.maintenanceAriaLabel}>
        <AlertTitle>{alertCopy.section.maintenanceTitle}</AlertTitle>
        <AlertDescription>{alertCopy.section.maintenanceDescription}</AlertDescription>
      </section>
    </Alert>
  );
}
