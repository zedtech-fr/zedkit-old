import { identityDockCopy } from "@/components/i18n/identity-dock-copy";

/** Visible label for the dock reset control (EN site vs FR). */
export function dockNewConversationLabel(documentLang: string | undefined): string {
  return documentLang?.toLowerCase().startsWith("fr")
    ? identityDockCopy.newConversationFr
    : identityDockCopy.newConversationEn;
}
