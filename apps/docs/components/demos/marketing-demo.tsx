import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { CtaBand, GlassSurface, Hero } from "@zedtech/zedkit-ui/marketing";
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

export function HeroDemo() {
  const { hero } = marketingCopy;
  return (
    <Hero
      eyebrow={hero.eyebrow}
      title={hero.title}
      description={hero.description}
      headingLevel={2}
      actions={
        <>
          <Button size="lg">{hero.primary}</Button>
          <Button size="lg" variant="outline">
            {hero.secondary}
          </Button>
        </>
      }
    />
  );
}

export function CtaBandDemo() {
  const { cta } = marketingCopy;
  return <CtaBand title={cta.title} description={cta.description} actions={<Button size="lg">{cta.action}</Button>} />;
}
