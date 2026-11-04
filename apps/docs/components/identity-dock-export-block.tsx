"use client";

import {
  Heading,
  Stack,
  identityContrastWarnings,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityDockExportCopy as exportCopy } from "@/components/i18n/identity-dock-export-copy";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { IdentityDockExportCopyRow } from "@/components/identity-dock-export-copy-row";
import { AI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { identityExportCss, IDENTITY_UI_INSTALL_COMMAND } from "@/lib/identity-export-css";

export function IdentityDockExportBlock({ tokens }: { tokens: IdentityTokens }) {
  const css = identityExportCss(tokens);
  const blocked = identityContrastWarnings(tokens).length > 0;
  const editorExport = identityEditorCopy.export;

  return (
    <Stack
      gap={3}
      className="shrink-0 border-t border-border bg-muted/20 px-3 py-3"
      data-slot="identity-dock-export"
    >
      <Heading level={3} className="text-sm font-medium">
        {exportCopy.heading}
      </Heading>
      <IdentityDockExportCopyRow label={exportCopy.install} value={IDENTITY_UI_INSTALL_COMMAND} />
      <IdentityDockExportCopyRow
        label={exportCopy.css}
        value={css}
        blocked={blocked}
        blockedTitle={editorExport.contrastTitle}
        blockedDescription={editorExport.contrastDescription}
        confirmLabel={editorExport.confirmLabel}
      />
      <IdentityDockExportCopyRow label={exportCopy.aiPrompt} value={AI_SETUP_MINI_PROMPT} />
    </Stack>
  );
}
