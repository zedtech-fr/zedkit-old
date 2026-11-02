import Link from "next/link";
import { Stack, Text } from "@zedtech/zedkit-ui";

import { noteListExampleCopy } from "@/app/i18n/note-list-example-copy";
import { NoteListFeature } from "@/features/note-list";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/examples/note-list", {
  title: noteListExampleCopy.metadata.title,
  description: noteListExampleCopy.metadata.description,
});

export default function NoteListExamplePage() {
  return (
    <>
      <Stack gap={2} className="mx-auto w-full max-w-lg px-6 pt-8">
        <Text variant="muted">{noteListExampleCopy.intro}</Text>
        <Text variant="muted">
          {noteListExampleCopy.read}{" "}
          <Link
            href="/docs/quality/enforce-feature-folder-ports-and-adapters"
            className="underline underline-offset-4"
          >
            {noteListExampleCopy.patternLink}
          </Link>
          {noteListExampleCopy.patternLinkEnd}
        </Text>
      </Stack>
      <NoteListFeature />
    </>
  );
}
