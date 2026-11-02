import { Container, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { containerCopy } from "@/components/demos/i18n/container-copy";

export function ContainerDemo() {
  return (
    <Stack gap={4}>
      <Container width="narrow" className="border py-2">
        <Text>{containerCopy.narrow}</Text>
      </Container>
      <Container width="reading" className="border py-2">
        <Text>{containerCopy.reading}</Text>
      </Container>
      <Container className="border py-2">
        <Text>{containerCopy.default}</Text>
      </Container>
      <Container width="wide" className="border py-2">
        <Text>{containerCopy.wide}</Text>
      </Container>
      <Section bleed tone="muted" spacing="sm" title={containerCopy.bleedTitle} description={containerCopy.bleedDescription}>
        <Text>{containerCopy.bandContent}</Text>
      </Section>
    </Stack>
  );
}
