"use client";

import type { RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import {
  ConversationComposer,
  ConversationMessages,
  PreviewPane,
  type View,
} from "@/components/identity-assistant-panes";
import { ReferenceReportList } from "@/components/identity-references";
import type { Unavailable } from "@/lib/identity-assistant";
import type { SessionState } from "@/lib/identity-creator-session";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

function compactPaneProps(narrowSplit: boolean | undefined) {
  return {
    compact: true as const,
    ...(narrowSplit !== undefined ? { narrowSplit } : {}),
  };
}

function DockAssistantPreviewColumn(props: {
  view: View;
  proposal: SessionState["proposal"];
  previewTokens: IdentityTokens;
  domainBrief: string;
  busy: boolean;
  references: SessionState["references"];
  narrowSplit: boolean | undefined;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  const pane = compactPaneProps(props.narrowSplit);
  return (
    <Stack gap={4} className="min-w-0">
      <ReferenceReportList report={props.references} />
      <PreviewPane
        view={props.view}
        proposal={props.proposal}
        tokens={props.previewTokens}
        domainBrief={props.domainBrief}
        busy={props.busy}
        onUse={props.onUse}
        onDiscard={props.onDiscard}
        {...pane}
      />
    </Stack>
  );
}

function DockGridComposer(props: {
  hideComposer?: boolean;
  composerRef?: RefObject<HTMLDivElement | null>;
  session: SessionState;
  brief: string;
  busy: boolean;
  off: Unavailable | null;
  onBrief: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  if (props.hideComposer) return null;
  return (
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
  );
}

export function IdentityDockAssistantGrid(props: {
  view: View;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  previewTokens: IdentityTokens;
  domainBrief: string;
  narrowSplit?: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onQuickRefine: (prompt: string) => void;
  onCancel: () => void;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
  composerRef?: RefObject<HTMLDivElement | null>;
  hideComposer?: boolean;
}) {
  const pane = compactPaneProps(props.narrowSplit);
  return (
    <Stack gap={4} className="min-w-0">
      <ConversationMessages
        view={props.view}
        session={props.session}
        brief={props.brief}
        busy={props.busy}
        onBrief={props.onBrief}
        onQuickRefine={props.onQuickRefine}
        off={props.off}
        noticeInComposerFooter={props.hideComposer === true}
        {...pane}
      />
      <DockAssistantPreviewColumn
        view={props.view}
        proposal={props.session.proposal}
        previewTokens={props.previewTokens}
        domainBrief={props.domainBrief}
        busy={props.busy}
        references={props.session.references}
        narrowSplit={props.narrowSplit}
        onUse={props.onUse}
        onDiscard={props.onDiscard}
      />
      <DockGridComposer
        session={props.session}
        brief={props.brief}
        busy={props.busy}
        off={props.off}
        onBrief={props.onBrief}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        inputRef={props.inputRef}
        {...(props.hideComposer === true ? { hideComposer: true } : {})}
        {...(props.composerRef !== undefined ? { composerRef: props.composerRef } : {})}
      />
    </Stack>
  );
}
