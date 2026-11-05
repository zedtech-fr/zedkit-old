"use client";

import { useEffect, useRef } from "react";
import { StreamStatus, StreamText, Text, cn, isAssistantStreamStage } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { noticeText } from "@/components/identity-assistant-parts";
import type { ChatMessage } from "@/lib/identity-creator-session";

export type PendingWork = { stage?: string; draft?: string };

function PendingBody({ pending }: { pending: PendingWork }) {
  const stage = pending.stage && isAssistantStreamStage(pending.stage) ? pending.stage : undefined;
  return (
    <>
      <Text as="span" className="font-medium text-foreground">
        {copy.assistant}
      </Text>
      <StreamStatus stage={stage} label={stage ? undefined : copy.working} live={false} className="mt-1" />
      {pending.draft ? (
        <StreamText text={pending.draft} live={false} className="mt-1 block whitespace-pre-wrap" />
      ) : null}
    </>
  );
}

/** Status and growing text while an answer is on its way. The parent already announces. */
export function PendingAssistant({ pending, as = "div" }: { pending: PendingWork; as?: "div" | "li" }) {
  const Tag = as;
  return (
    <Tag className="self-start text-sm text-muted-foreground" aria-live="polite">
      <PendingBody pending={pending} />
    </Tag>
  );
}

/** The whole exchange as a chat: every request on the right, every reply or failure on the left, oldest first. */
export function ChatLog({
  messages,
  pending,
  noticeInComposerFooter = false,
}: {
  messages: readonly ChatMessage[];
  pending: PendingWork | null;
  /** Dock keeps the live notice beside the composer; log lines stay readable without a second test hook. */
  noticeInComposerFooter?: boolean;
}) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, pending]);
  return (
    <ol aria-label={copy.thread} className="m-0 flex list-none flex-col gap-2 p-0" data-assistant-log="">
      {messages.map((message, index) => {
        const user = message.role === "user";
        const text = message.role === "notice" ? noticeText(message.notice) : message.text;
        return (
          <li
            key={`${index}-${message.role}`}
            data-role={message.role}
            {...(message.role === "notice" && !noticeInComposerFooter ? { "data-assistant-notice": "" } : {})}
            className={cn(
              "flex max-w-[90%] flex-col gap-1 rounded-2xl px-3 py-2 text-sm",
              user ? "self-end rounded-tr-sm bg-primary text-primary-foreground" : "self-start rounded-tl-sm border border-border bg-muted",
            )}
          >
            <Text as="span" className={cn("font-medium", user ? "text-primary-foreground" : "text-foreground")}>
              {user ? copy.you : copy.assistant}
            </Text>
            <Text
              as="span"
              {...(message.role === "notice" ? { role: "status" } : {})}
              className={cn("whitespace-pre-wrap", user ? "text-primary-foreground" : "text-muted-foreground")}
            >
              {text}
            </Text>
          </li>
        );
      })}
      {pending ? <PendingAssistant pending={pending} as="li" /> : null}
      <li ref={end} aria-hidden="true" className="h-0" />
    </ol>
  );
}
