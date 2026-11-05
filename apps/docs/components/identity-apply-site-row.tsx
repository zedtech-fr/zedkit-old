"use client";

import type { ReactNode } from "react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";

function Row({ children }: { children: ReactNode }) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-end">
      {children}
    </Stack>
  );
}

/** Apply the current look to this site, or remove it. Shared by the editor KeepBar and the identity dock. */
function ApplySiteRow({
  appliedSite,
  onApplySite,
  onRemoveFromSite,
  hint = false,
}: {
  appliedSite: boolean;
  onApplySite: () => void;
  onRemoveFromSite: () => void;
  /** When true, show the editor apply hint under the row. */
  hint?: boolean;
}) {
  return (
    <Stack gap={2} data-slot="identity-apply-site">
      <Row>
        <Button
          type="button"
          variant="outline"
          className="scroll-mt-28 scroll-mb-24 max-lg:[@media(min-height:48rem)]:scroll-mt-80"
          onClick={onApplySite}
        >
          {identityEditorCopy.toolbar.applySite}
        </Button>
        {appliedSite ? (
          <Button type="button" variant="outline" onClick={onRemoveFromSite}>
            {identityEditorCopy.library.removeFromSite}
          </Button>
        ) : null}
      </Row>
      {hint ? (
        <Text variant="muted" typeRole="label">
          {identityEditorCopy.toolbar.applyHint}
        </Text>
      ) : null}
    </Stack>
  );
}

export { ApplySiteRow };
