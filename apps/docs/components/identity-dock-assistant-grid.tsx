"use client";

import type { RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import { ConversationPane, PreviewPane } from "@/components/identity-assistant-panes";
import { ReferenceReportList } from "@/components/identity-references";
import type { Unavailable } from "@/lib/identity-assistant";
import type { SessionState } from "@/lib/identity-creator-session";
import type { View } from "@/components/identity-assistant-parts";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

export function IdentityDockAssistantGrid(props: {
  view: View;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  previewTokens: IdentityTokens;
  domainBrief: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onQuickRefine: (prompt: string) => void;
  onCancel: () => void;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  return (
    <Stack gap={4} className="min-w-0 lg:grid lg:grid-cols-2 lg:items-start">
      <ConversationPane
        view={props.view}
        session={props.session}
        off={props.off}
        brief={props.brief}
        busy={props.busy}
        onBrief={props.onBrief}
        onSubmit={props.onSubmit}
        onQuickRefine={props.onQuickRefine}
        onCancel={props.onCancel}
        textareaRef={props.textareaRef}
      />
      <Stack gap={4} className="min-w-0">
        <ReferenceReportList report={props.session.references} />
        <PreviewPane
          view={props.view}
          proposal={props.session.proposal}
          tokens={props.previewTokens}
          domainBrief={props.domainBrief}
          busy={props.busy}
          onUse={props.onUse}
          onDiscard={props.onDiscard}
        />
      </Stack>
    </Stack>
  );
}
