import Link from "next/link";
import { Button, Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { notFoundCopy } from "@/ui/not-found/i18n/not-found-copy";

export function NotFoundView() {
  return (
    <Container width="narrow" className="py-section-lg">
      <Stack gap={4}>
        <Heading level={1}>{notFoundCopy.title}</Heading>
        <Text variant="muted">{notFoundCopy.body}</Text>
        <Button asChild>
          <Link href="/">{notFoundCopy.backLink}</Link>
        </Button>
      </Stack>
    </Container>
  );
}
