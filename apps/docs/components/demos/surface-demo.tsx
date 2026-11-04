import { Stack, Surface, Text, WidgetButton } from "@zedtech/zedkit-ui";

/** Solid and glass panel chrome from the kit (elevation and radius tokens). */
export function SurfaceDemo() {
  return (
    <Stack gap={4} className="max-w-md">
      <Surface variant="solid" elevation={2} radius="xl" padding="md">
        <Text typeRole="label">Solid panel</Text>
        <Text className="text-muted-foreground">Border, card fill, and shadow-md from one Surface.</Text>
      </Surface>
      <Surface variant="glass" elevation={3} radius="xl" padding="md">
        <Text typeRole="label">Glass panel</Text>
        <Text className="text-muted-foreground">Frosted under the glass identity; solid popover elsewhere.</Text>
      </Surface>
      <WidgetButton type="button">Widget trigger</WidgetButton>
    </Stack>
  );
}
