import Link from "next/link";
import { Button, Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import "@/app/identity-creator-type.css";
import { identityEditorCopy } from "@/app/i18n/identity-editor-copy";
import { IdentityEditorPanel } from "@/components/identity-editor-panel";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/features/identity-editor", {
  title: identityEditorCopy.metadata.title,
  description: identityEditorCopy.metadata.description,
});

export default function IdentityEditorFeaturePage() {
  return (
    <Container width="wide" className="py-section-lg">
      <Stack gap={6}>
        <Stack gap={2}>
          <Button asChild variant="link" size="sm" className="-mx-2 -mt-6 w-fit" data-editor-back="">
            <Link href="/#identities">{identityEditorCopy.back}</Link>
          </Button>
          <Heading level={1} typeRole="section">
            {identityEditorCopy.heading}
          </Heading>
          <Text variant="muted" typeRole="body">
            {identityEditorCopy.body}
          </Text>
        </Stack>
        <IdentityEditorPanel />
      </Stack>
    </Container>
  );
}
