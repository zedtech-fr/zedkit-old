import { tokensToCss, type IdentityTokens } from "@zedtech/zedkit-ui";

/** `:root` CSS string shared by the editor export field and dock copy (parity: identity-export-preview-parity). */
export function identityExportCss(tokens: IdentityTokens): string {
  return tokensToCss(tokens, ":root");
}

export const IDENTITY_UI_INSTALL_COMMAND = "pnpm add @zedtech/zedkit-ui";
