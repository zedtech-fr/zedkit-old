"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Stack, Text, cn, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { BriefForm, ProposalCard, Thread, type View } from "@/components/identity-assistant-parts";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import { IdentityRefinementChips } from "@/components/identity-refinement-chips";
import { DetectedLinks } from "@/components/identity-references";
import type { Unavailable } from "@/lib/identity-assistant";
import type { Proposal, SessionState } from "@/lib/identity-creator-session";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";

/** The assistant's first word, where the exchange will continue. Shown until the first exchange replaces it. */
function AssistantGreeting() {
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0" data-assistant-greeting="">
      <li className="text-sm">
        <Text as="span" className="font-medium text-foreground">
          {copy.assistant}
        </Text>{" "}
        <Text as="span" className="text-muted-foreground">
          {copy.intro}
        </Text>
      </li>
    </ol>
  );
}

/** The chat: the exchange so far, quick refinements, the links found, the composer, and a way to the full editor. */
export function ConversationPane(props: {
  view: View;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onQuickRefine: (prompt: string) => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const refining = props.session.thread.length > 0;
  const chipsVisible = refining && props.session.proposal === null && props.session.pending === null;
  const pathname = usePathname();
  return (
    <Stack gap={4} className={cn("min-w-0", props.view === "preview" && "max-lg:hidden")} data-assistant-pane="conversation">
      {refining ? <Thread turns={props.session.thread} /> : <AssistantGreeting />}
      <IdentityRefinementChips
        visible={chipsVisible}
        disabled={props.busy || props.off !== null}
        onSelect={props.onQuickRefine}
      />
      <DetectedLinks text={props.brief} onText={props.onBrief} fieldId="identity-assistant-brief" disabled={props.busy} />
      <BriefForm
        value={props.brief}
        onValue={props.onBrief}
        refining={refining}
        busy={props.busy}
        blocked={props.off !== null}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        inputRef={props.inputRef}
      />
      {pathname === IDENTITY_EDITOR_HREF ? null : (
        <Button asChild variant="link" size="sm" className="w-fit px-0 text-muted-foreground" data-assistant-editor-link="">
          <Link href={IDENTITY_EDITOR_HREF}>{copy.detailedEditorLink}</Link>
        </Button>
      )}
    </Stack>
  );
}

/** The proposal to look at, or (on a phone, before there is one) the draft as it is. Wide screens show the draft elsewhere. */
export function PreviewPane(props: {
  view: View;
  proposal: Proposal | null;
  tokens: IdentityTokens;
  domainBrief: string;
  busy: boolean;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  const className = cn("min-w-0", props.view === "conversation" && "max-lg:hidden", !props.proposal && "lg:hidden");
  return (
    <Stack gap={4} className={className} data-assistant-pane="preview">
      {props.proposal ? (
        <ProposalCard
          proposal={props.proposal}
          current={props.tokens}
          domainBrief={props.domainBrief}
          busy={props.busy}
          onUse={props.onUse}
          onDiscard={props.onDiscard}
        />
      ) : (
        <Stack gap={3}>
          <Text variant="muted" className="text-sm">
            {copy.views.draftNow}
          </Text>
          <IdentityMiniPreview tokens={props.tokens} id="draft-now" />
        </Stack>
      )}
    </Stack>
  );
}
