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
import { IDENTITY_KIT_STYLES_CSS, identityExportCss, identityExportFonts, identityExportInstall } from "@/lib/identity-export-css";

export function IdentityDockExportBlock({ tokens }: { tokens: IdentityTokens }) {
  const css = identityExportCss(tokens);
  const fonts = identityExportFonts(tokens);
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
      <IdentityDockExportCopyRow
        label={exportCopy.install}
        copyLabel={exportCopy.copyInstall}
        value={identityExportInstall(tokens)}
      />
      {fonts ? (
        <IdentityDockExportCopyRow label={exportCopy.fonts} copyLabel={exportCopy.copyFonts} value={fonts.imports} />
      ) : null}
      <IdentityDockExportCopyRow label={exportCopy.styles} copyLabel={exportCopy.copyStyles} value={IDENTITY_KIT_STYLES_CSS} />
      <IdentityDockExportCopyRow
        label={exportCopy.css}
        copyLabel={exportCopy.copyCss}
        value={css}
        blocked={blocked}
        blockedTitle={editorExport.contrastTitle}
        blockedDescription={editorExport.contrastDescription}
        confirmLabel={editorExport.confirmLabel}
      />
      <IdentityDockExportCopyRow
        label={exportCopy.aiPrompt}
        copyLabel={exportCopy.copyAiPrompt}
        value={AI_SETUP_MINI_PROMPT}
      />
    </Stack>
  );
}
