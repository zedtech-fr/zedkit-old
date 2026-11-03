import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { GlassSurface } from "@zedtech/zedkit-ui/marketing";
import { marketingCopy } from "@/components/demos/i18n/marketing-copy";

export function GlassSurfaceDemo() {
  const { plain, raised, tinted } = marketingCopy.surface;
  return (
    <Stack direction="horizontal" gap={4} className="min-w-0 flex-wrap items-stretch">
      <GlassSurface className="min-w-0 flex-1 basis-48">
        <Heading level={3}>{plain.title}</Heading>
        <Text variant="muted">{plain.body}</Text>
      </GlassSurface>
      <GlassSurface tone="raised" className="min-w-0 flex-1 basis-48">
        <Heading level={3}>{raised.title}</Heading>
        <Text variant="muted">{raised.body}</Text>
      </GlassSurface>
      <GlassSurface tone="tinted" className="min-w-0 flex-1 basis-48">
        <Heading level={3}>{tinted.title}</Heading>
        <Text variant="muted">{tinted.body}</Text>
      </GlassSurface>
    </Stack>
  );
}
