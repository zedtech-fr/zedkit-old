import Link from "next/link";
import { Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { identityKitDemosCopy } from "@/app/i18n/identity-kit-demos-copy";
import { ComponentPreview } from "@/components/component-preview";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/features/identity-kit-demos", {
  title: identityKitDemosCopy.metadata.title,
  description: identityKitDemosCopy.metadata.description,
});

export default function IdentityKitDemosPage() {
  return (
    <Container width="wide" className="py-section-lg">
      <Stack gap={8}>
        <Stack gap={2}>
          <Heading level={1}>{identityKitDemosCopy.heading}</Heading>
          <Text variant="muted">{identityKitDemosCopy.body}</Text>
        </Stack>
        <ComponentPreview demo="IdentitySwitcherDemo" hasProps={false} />
        <ComponentPreview demo="IdentityScopeDemo" hasProps={false} />
        <ComponentPreview demo="IdentityPickerDemo" hasProps={false} />
        <Text variant="muted" className="text-sm">
          <Link href="/docs/ui/pin-a-stage-and-change-scene-as-the-page-scrolls" className="text-primary underline-offset-4 hover:underline">
            {identityKitDemosCopy.scrollGuide}
          </Link>{" "}
          {identityKitDemosCopy.afterScrollGuide}
        </Text>
      </Stack>
    </Container>
  );
}
