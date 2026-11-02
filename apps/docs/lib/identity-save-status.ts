import { freeLabel } from "./identity-library.ts";
import type { SaveResult, SavedIdentity } from "./identity-library.ts";

/** What the editor tells the visitor after a save or a rename: done, a name clash to settle, or why it could not. */
export type SaveStatus =
  | { kind: "saved" | "renamed"; label: string }
  | { kind: "exists"; label: string; free: string }
  | { kind: "failed"; reason: "unavailable" | "full" | "invalid" | "limit" | "missing" };

export function saveStatus(result: SaveResult, items: readonly SavedIdentity[], intent: "saved" | "renamed" = "saved"): SaveStatus {
  if (result.ok) return { kind: intent, label: result.item.label };
  if (result.reason === "exists") {
    const label = result.existing?.label ?? "";
    return { kind: "exists", label, free: freeLabel(items, label) };
  }
  return { kind: "failed", reason: result.reason };
}
