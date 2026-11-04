import type { IdentityTokens } from "@zedtech/zedkit-ui";

export const IDENTITY_EDITOR_DRAFT_APPLY = "zk-identity-editor-draft-apply";

/** Lets the demo editor draft follow “Use this look” from IdentityDock on the editor route. */
export function dispatchIdentityEditorDraftApply(tokens: IdentityTokens): void {
  window.dispatchEvent(new CustomEvent(IDENTITY_EDITOR_DRAFT_APPLY, { detail: tokens }));
}
