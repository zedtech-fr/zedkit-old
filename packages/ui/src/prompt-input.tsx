"use client";

import { ArrowUp } from "lucide-react";
import type * as React from "react";
import { IconButton } from "./icon-button.js";
import { cn } from "./utils.js";

export type PromptInputProps = Omit<
  React.ComponentProps<"textarea">,
  "onSubmit"
> & {
  /** Accessible name for the send control (and native tooltip). */
  sendLabel: string;
  onSubmit: () => void;
  /** When set with `busy`, renders a second control beside send. */
  onCancel?: () => void;
  cancelLabel?: string;
  busy?: boolean;
  /** Blocks sending while the field stays editable (`disabled` blocks both): a draft costs nothing, only sending does. */
  sendDisabled?: boolean;
  /** When true, an empty field can still submit (the handler supplies the last prompt). */
  allowEmptySubmit?: boolean;
};

type PromptInputActionsProps = {
  sendLabel: string;
  onCancel: (() => void) | undefined;
  cancelLabel: string | undefined;
  busy: boolean | undefined;
  sendDisabled: boolean;
};

function PromptInputActions({
  sendLabel,
  onCancel,
  cancelLabel,
  busy,
  sendDisabled,
}: PromptInputActionsProps) {
  return (
    <>
      {busy && onCancel && cancelLabel ? (
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-10 bottom-1.5"
          label={cancelLabel}
          onClick={onCancel}
        />
      ) : null}
      <IconButton
        type="submit"
        size="sm"
        className="absolute right-1.5 bottom-1.5 size-8 shrink-0 rounded-full"
        label={sendLabel}
        disabled={sendDisabled}
        aria-busy={busy || undefined}
      >
        <ArrowUp aria-hidden="true" className="size-4" />
      </IconButton>
    </>
  );
}

function promptInputTrySubmit(
  event: { preventDefault: () => void },
  empty: boolean,
  blocked: boolean,
  onSubmit: () => void,
) {
  event.preventDefault();
  if (!empty && !blocked) onSubmit();
}

/** Chat-style composer: one rounded surface, auto-growing field, send affordance inside at bottom-right. */
export function PromptInput({
  sendLabel,
  onSubmit,
  onCancel,
  cancelLabel,
  busy,
  sendDisabled: sendBlocked,
  allowEmptySubmit = false,
  className,
  value,
  disabled,
  onKeyDown,
  rows = 1,
  ref,
  ...props
}: PromptInputProps) {
  const empty = String(value ?? "").trim() === "" && !allowEmptySubmit;
  const blocked = disabled === true || busy === true || sendBlocked === true;

  return (
    <form
      data-slot="prompt-input"
      className={cn(
        "relative w-full rounded-md border border-input bg-background shadow-sm focus-within:focus-ring-control",
        className,
      )}
      onSubmit={(event) => promptInputTrySubmit(event, empty, blocked, onSubmit)}
    >
      <textarea
        ref={ref}
        data-slot="prompt-input-field"
        rows={rows}
        value={value}
        disabled={disabled}
        readOnly={busy}
        className={cn(
          "field-sizing-content max-h-40 min-h-textarea-min-height w-full min-w-0 resize-none border-0 bg-transparent py-2 pl-3 text-control shadow-none placeholder:text-muted-foreground",
          "focus-ring-control disabled:cursor-not-allowed disabled:opacity-50",
          busy && onCancel ? "pr-20" : "pr-12",
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) promptInputTrySubmit(event, empty, blocked, onSubmit);
          onKeyDown?.(event);
        }}
        {...props}
      />
      <PromptInputActions
        sendLabel={sendLabel}
        onCancel={onCancel}
        cancelLabel={cancelLabel}
        busy={busy}
        sendDisabled={empty || blocked}
      />
    </form>
  );
}
