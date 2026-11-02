import { Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

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
          <Heading level={1}>{identityEditorCopy.heading}</Heading>
          <Text variant="muted">{identityEditorCopy.body}</Text>
        </Stack>
        <IdentityEditorPanel />
      </Stack>
    </Container>
  );
}
