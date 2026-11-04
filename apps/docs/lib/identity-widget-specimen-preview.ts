import { applyIdentityTokenSheet, type IdentityTokens } from "@zedtech/zedkit-ui";

/** Demo specimens only — never the docs site shell (D1). */
export const WIDGET_SPECIMEN_SELECTOR = "[data-demo-specimen]";
const SHEET_SLOT = "identity-widget-specimen-preview";

export function applyWidgetSpecimenPreview(tokens: IdentityTokens, doc: Document = document): void {
  const sheet = applyIdentityTokenSheet(tokens, WIDGET_SPECIMEN_SELECTOR, doc);
  sheet.dataset.slot = SHEET_SLOT;
}

export function clearWidgetSpecimenPreview(doc: Document = document): void {
  doc.querySelector(`style[data-slot="${SHEET_SLOT}"]`)?.remove();
}
