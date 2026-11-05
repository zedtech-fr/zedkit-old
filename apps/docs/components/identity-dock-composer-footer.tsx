"use client";

import type { RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import { ConversationComposer } from "@/components/identity-assistant-panes";
import { noticeText } from "@/components/identity-assistant-parts";
import type { Unavailable } from "@/lib/identity-assistant";
import type { SessionState } from "@/lib/identity-creator-session";

export function IdentityDockComposerFooter(props: {
  session: SessionState;
  brief: string;
  busy: boolean;
  off: Unavailable | null;
  onBrief: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const notice = props.session.notice;
  const showNotice = notice !== null;
  return (
    <Stack gap={2} className="shrink-0 border-t border-border bg-background px-3 py-3">
      {showNotice ? (
        <div
          role="status"
          className="rounded-md border border-border bg-muted px-3 py-2 text-zk-type-body text-muted-foreground"
          data-assistant-notice=""
        >
          {noticeText(notice)}
        </div>
      ) : null}
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
