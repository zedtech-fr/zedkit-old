import { Badge, Stack, Text } from "@zedtech/zedkit-ui";
import { badgeCopy } from "@/components/demos/i18n/badge-copy";

const RUNS = badgeCopy.variants.runs;

export function BadgeVariantsDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Text variant="muted">{badgeCopy.variants.subtitle}</Text>
      <Stack gap={2}>
        {RUNS.map((run) => (
          <Stack key={run.name} direction="horizontal" gap={3} className="items-center justify-between">
            <Text>{run.name}</Text>
            {run.variant === "default" ? (
              <Badge>{run.badge}</Badge>
            ) : (
              <Badge variant={run.variant}>{run.badge}</Badge>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
