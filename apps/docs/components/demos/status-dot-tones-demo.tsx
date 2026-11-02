import { Stack, StatusDot, Text } from "@zedtech/zedkit-ui";
import { statusDotCopy } from "@/components/demos/i18n/status-dot-copy";

const SERVICES = [
  { name: statusDotCopy.services.checkout.name, tone: "success", label: statusDotCopy.services.checkout.label },
  { name: statusDotCopy.services.search.name, tone: "warning", label: statusDotCopy.services.search.label },
  { name: statusDotCopy.services.payments.name, tone: "danger", label: statusDotCopy.services.payments.label },
  { name: statusDotCopy.services.images.name, tone: "idle", label: statusDotCopy.services.images.label },
  { name: statusDotCopy.services.export.name, tone: "active", label: statusDotCopy.services.export.label },
] as const;

export function StatusDotTonesDemo() {
  return (
    <Stack gap={2}>
      {SERVICES.map((service) => (
        <Stack key={service.name} direction="horizontal" gap={2} className="items-center">
          <StatusDot tone={service.tone} />
          <Text>{statusDotCopy.line(service.name, service.label)}</Text>
        </Stack>
      ))}
    </Stack>
  );
}
