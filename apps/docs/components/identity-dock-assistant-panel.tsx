"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { IconButton, Stack, Text } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { identityDockCopy } from "@/components/i18n/identity-dock-copy";
import { AssistantHeading, ViewSwitch, noticeText } from "@/components/identity-assistant-parts";
import { IdentityDockAssistantGrid } from "@/components/identity-dock-assistant-grid";
import { useAssistantView } from "@/components/use-assistant-view";
import { useIdentityAssistant } from "@/components/use-identity-assistant";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { checkInput } from "@/lib/identity-assistant";
import { applyWidgetSpecimenPreview } from "@/lib/identity-widget-specimen-preview";
import { linksInText } from "@/lib/identity-links-in-text";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

function assistantFeedbackText(session: ReturnType<typeof useIdentityAssistant>["session"], busy: boolean): string | null {
  if (busy) return copy.working;
  if (session.notice && session.notice.kind !== "unavailable") return noticeText(session.notice);
  if (session.proposal) return copy.views.proposalReady;
  return null;
}

export function IdentityDockAssistantPanel({
  previewTokens,
  onPreviewTokens,
}: {
  previewTokens: IdentityTokens;
  onPreviewTokens: (tokens: IdentityTokens) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { brief, setBrief, setExpanded } = useIdentityAssistantStore();
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(previewTokens, true);
  const ui = useAssistantView({ proposalId: session.proposal?.requestId, onBrief: setBrief });
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("textarea:not([disabled])")?.focus({ preventScroll: true });
  }, []);

  function send() {
    const references = linksInText(brief).urls;
    if (checkInput({ prompt: brief, references }) !== "ok") return;
    submit(brief, references);
  }

  return (
    <Stack ref={panelRef} className="min-h-0 flex-1 gap-0 overflow-hidden" data-slot="identity-dock-body">
      <Stack direction="horizontal" gap={2} className="items-center border-b border-border px-3 py-2">
        <Text typeRole="label" className="min-w-0 flex-1">{identityDockCopy.panelTitle}</Text>
        <IconButton type="button" variant="ghost" size="sm" label={identityDockCopy.closeLabel} onClick={() => setExpanded(false)}>
          <X aria-hidden="true" />
        </IconButton>
      </Stack>
      <Stack gap={4} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <AssistantHeading />
        <ViewSwitch view={ui.view} onView={ui.setView} waiting={session.proposal !== null} previewRef={ui.previewButton} />
        <IdentityDockAssistantGrid
          view={ui.view}
          session={session}
          off={off}
          brief={brief}
          busy={busy}
          feedbackText={assistantFeedbackText(session, busy)}
          previewTokens={previewTokens}
          textareaRef={ui.textarea}
          onBrief={setBrief}
          onSubmit={send}
          onCancel={cancel}
          onUse={(next) =>
            ui.backToConversation(() => {
              onPreviewTokens(next);
              applyWidgetSpecimenPreview(next);
              dispatch({ type: "accept" });
              setBrief("");
            })
          }
          onDiscard={() => ui.backToConversation(() => dispatch({ type: "discard" }))}
        />
      </Stack>
    </Stack>
  );
}
