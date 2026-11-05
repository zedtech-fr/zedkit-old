"use client";

import { type RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import { ViewSwitch, type View } from "@/components/identity-assistant-parts";
import { IdentityDockAssistantGrid } from "@/components/identity-dock-assistant-grid";
import { IdentityDockComposerFooter } from "@/components/identity-dock-composer-footer";
import { IdentityDockExportBlock } from "@/components/identity-dock-export-block";
import { IdentityDockPanelToolbar } from "@/components/identity-dock-panel-toolbar";
import { useIdentityDockAssistantPanel } from "@/components/use-identity-dock-assistant-panel";
import { specimenDomainFromBrief, type SpecimenDomain } from "@/lib/brief-specimen-domain";
import { applyWidgetSpecimenPreview } from "@/lib/identity-widget-specimen-preview";
import { dispatchIdentityEditorDraftApply } from "@/lib/identity-editor-draft-apply";
import { repairContrast } from "@/lib/identity-contrast-repair";
import { useDocsSiteIdentityApply } from "@/lib/use-docs-site-identity-apply";
import type { ApplySiteTokenHandlers } from "@/components/identity-apply-site-row";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import type { Unavailable } from "@/lib/identity-assistant";
import type { SessionState } from "@/lib/identity-creator-session";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

function acceptProposal(
  backToConversation: (action: () => void) => void,
  onPreviewTokens: (tokens: IdentityTokens) => void,
  onPreviewDomain: (domain: SpecimenDomain) => void,
  dispatch: (action: { type: "accept" }) => void,
  setBrief: (value: string) => void,
  next: IdentityTokens,
  domain: SpecimenDomain,
) {
  backToConversation(() => {
    onPreviewTokens(next);
    onPreviewDomain(domain);
    applyWidgetSpecimenPreview(next);
    if (typeof window !== "undefined" && window.location.pathname === IDENTITY_EDITOR_HREF) {
      dispatchIdentityEditorDraftApply(next);
    }
    dispatch({ type: "accept" });
    setBrief("");
  });
}


function DockViewSwitch(props: {
  view: View;
  setView: (view: View) => void;
  waiting: boolean;
  previewRef: RefObject<HTMLButtonElement | null>;
  always: boolean;
}) {
  return (
    <ViewSwitch
      view={props.view}
      onView={props.setView}
      waiting={props.waiting}
      previewRef={props.previewRef}
      always={props.always}
    />
  );
}

function IdentityDockPanelScroll(props: {
  scrollRef: RefObject<HTMLDivElement | null>;
  viewSwitchAlways: boolean;
  view: View;
  setView: (view: View) => void;
  previewRef: RefObject<HTMLButtonElement | null>;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  previewTokens: IdentityTokens;
  domainBrief: string;
  previewDomain: SpecimenDomain | null;
  setPreviewDomain: (domain: SpecimenDomain | null) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  setBrief: (value: string) => void;
  send: () => void;
  quickRefine: (prompt: string) => void;
  cancel: () => void;
  backToConversation: (action: () => void) => void;
  dispatch: (action: { type: "accept" } | { type: "discard" }) => void;
  onPreviewTokens: (tokens: IdentityTokens) => void;
  acceptedExportTokens: IdentityTokens | null;
  siteApply: ApplySiteTokenHandlers;
}) {
  return (
    <Stack ref={props.scrollRef} gap={3} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pt-3 pb-2">
      <DockViewSwitch
        view={props.view}
        setView={props.setView}
        waiting={props.session.proposal !== null}
        previewRef={props.previewRef}
        always={props.viewSwitchAlways}
      />
      <IdentityDockAssistantGrid
        view={props.view}
        session={props.session}
        off={props.off}
        brief={props.brief}
        busy={props.busy}
        previewTokens={props.previewTokens}
        domainBrief={props.domainBrief}
        narrowSplit={!props.viewSwitchAlways}
        {...(props.previewDomain != null ? { previewDomain: props.previewDomain } : {})}
        inputRef={props.inputRef}
        onBrief={props.setBrief}
        onSubmit={props.send}
        onQuickRefine={props.quickRefine}
        onCancel={props.cancel}
        onUse={(next) => acceptProposal(props.backToConversation, props.onPreviewTokens, props.setPreviewDomain, props.dispatch, props.setBrief, next, specimenDomainFromBrief(props.domainBrief))}
        onDiscard={() => props.backToConversation(() => props.dispatch({ type: "discard" }))}
        hideComposer
        siteApply={props.siteApply}
      />
      {props.acceptedExportTokens !== null ? (
        <IdentityDockExportBlock tokens={props.acceptedExportTokens} />
      ) : null}
    </Stack>
  );
}

export function IdentityDockAssistantPanel({
  previewTokens,
  onPreviewTokens,
  viewSwitchAlways = true,
}: {
  previewTokens: IdentityTokens;
  onPreviewTokens: (tokens: IdentityTokens) => void;
  /** Home dock keeps the phone switch at every width; the editor page shows both panes from `lg`. */
  viewSwitchAlways?: boolean;
}) {
  const panel = useIdentityDockAssistantPanel(previewTokens);
  const site = useDocsSiteIdentityApply();
  const siteApply = {
    appliedSite: site.appliedSite,
    onApplySite: (tokens: IdentityTokens) => site.applySite(repairContrast(tokens).tokens),
    onRemoveFromSite: site.removeFromSite,
  };

  return (
    <Stack ref={panel.panelRef} className="min-h-0 flex-1 gap-0 overflow-hidden" data-slot="identity-dock-body">
      <IdentityDockPanelToolbar onClose={() => panel.setExpanded(false)} />
      <IdentityDockPanelScroll
        scrollRef={panel.scrollRef}
        viewSwitchAlways={viewSwitchAlways}
        view={panel.ui.view}
        setView={panel.ui.setView}
        previewRef={panel.ui.previewButton}
        session={panel.session}
        off={panel.off}
        brief={panel.brief}
        busy={panel.busy}
        previewTokens={previewTokens}
        domainBrief={panel.domainBrief}
        previewDomain={panel.previewDomain}
        setPreviewDomain={panel.setPreviewDomain}
        inputRef={panel.ui.field}
        setBrief={panel.setBrief}
        send={panel.send}
        quickRefine={panel.quickRefine}
        cancel={panel.cancel}
        backToConversation={panel.ui.backToConversation}
        dispatch={panel.dispatch}
        onPreviewTokens={onPreviewTokens}
        acceptedExportTokens={panel.acceptedTokens}
        siteApply={siteApply}
      />
      <IdentityDockComposerFooter
        session={panel.session}
        brief={panel.brief}
        busy={panel.busy}
        off={panel.off}
        onBrief={panel.setBrief}
        onSubmit={panel.send}
        onCancel={panel.cancel}
        inputRef={panel.ui.field}
      />
    </Stack>
  );
}
