"use client";

import type { RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import {
  ConversationComposer,
  ConversationMessages,
  PreviewPane,
} from "@/components/identity-assistant-panes";
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
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onQuickRefine: (prompt: string) => void;
  onCancel: () => void;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
  /** When set, the composer renders in the footer instead of inside this grid. */
  composerRef?: RefObject<HTMLDivElement | null>;
  hideComposer?: boolean;
}) {
  return (
    <Stack gap={4} className="min-w-0">
      <ConversationMessages
        view={props.view}
        session={props.session}
        brief={props.brief}
        busy={props.busy}
        compact
        onBrief={props.onBrief}
        onQuickRefine={props.onQuickRefine}
        off={props.off}
      />
      <Stack gap={4} className="min-w-0">
        <ReferenceReportList report={props.session.references} />
        <PreviewPane
          view={props.view}
          proposal={props.session.proposal}
          tokens={props.previewTokens}
          domainBrief={props.domainBrief}
          busy={props.busy}
          compact
          onUse={props.onUse}
          onDiscard={props.onDiscard}
        />
      </Stack>
      {props.hideComposer ? null : (
        <Stack ref={props.composerRef}>
          <ConversationComposer
            session={props.session}
            brief={props.brief}
            busy={props.busy}
            off={props.off}
            onBrief={props.onBrief}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            inputRef={props.inputRef}
          />
        </Stack>
      )}
    </Stack>
  );
}
