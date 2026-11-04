import { tokensToCss, type IdentityTokens } from "@zedtech/zedkit-ui";

/** Matches `home-quickstart/snippets/install.sh`. */
export const IDENTITY_LEAVE_INSTALL = "pnpm add @zedtech/zedkit-ui";

/** Matches `home-quickstart/snippets/ai-init.sh`. */
export const IDENTITY_LEAVE_AI_INIT = "npx @zedtech/zedkit-ai init";

/** Same slash command as the home AI setup block. */
export const IDENTITY_LEAVE_AI_SLASH = "/setup-ai";

/**
 * One paste block: install, theme CSS from the same tokens as the dock preview, and AI setup commands.
 */
export function identityLeaveBundle(tokens: IdentityTokens): string {
  const css = tokensToCss(tokens, ":root");
  return [
    "# Install",
    IDENTITY_LEAVE_INSTALL,
    "",
    "# Theme CSS (matches preview)",
    css,
    "",
    "# AI setup",
    IDENTITY_LEAVE_AI_INIT,
    IDENTITY_LEAVE_AI_SLASH,
    "",
    "Paste the CSS block above into your app globals, then run init and /setup-ai so agents follow zedkit signature rules.",
  ].join("\n");
}
