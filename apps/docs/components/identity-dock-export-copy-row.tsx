"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, ConfirmDialog, Stack, Text } from "@zedtech/zedkit-ui";

import { identityDockExportCopy as rowCopy } from "@/components/i18n/identity-dock-export-copy";

type CopyState = "idle" | "copied" | "failed";

function writeClipboard(text: string): Promise<void> {
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (!clipboard) return Promise.reject(new Error("clipboard"));
  return clipboard.writeText(text);
}

function useCopyFeedback() {
  const [state, setState] = useState<CopyState>("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function settle(next: CopyState) {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
    buttonRef.current?.focus({ preventScroll: true });
  }

  function runCopy(value: string) {
    writeClipboard(value).then(
      () => settle("copied"),
      () => settle("failed"),
    );
  }

  return { state, buttonRef, runCopy };
}

export function IdentityDockExportCopyRow({
  label,
  copyLabel,
  value,
  blocked,
  blockedTitle,
  blockedDescription,
  confirmLabel,
}: {
  label: string;
  copyLabel: string;
  value: string;
  blocked?: boolean;
  blockedTitle?: string;
  blockedDescription?: string;
  confirmLabel?: string;
}) {
  const { state, buttonRef, runCopy } = useCopyFeedback();
  const liveId = useId();

  const iconButton = (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0 focus-visible:-outline-offset-(--ring-width)"
      aria-label={copyLabel}
      onClick={blocked ? undefined : () => runCopy(value)}
    >
      {state === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </Button>
  );

  return (
    <Stack gap={1} className="min-w-0" data-slot="identity-dock-export-row">
      <Text typeRole="label" className="text-xs text-muted-foreground">
        {label}
      </Text>
      <Stack gap={2} className="min-w-0 sm:flex-row sm:items-start">
        <pre className="min-w-0 flex-1 overflow-x-auto rounded-md border border-border bg-muted/30 px-2 py-1.5 font-mono text-xs break-words whitespace-pre-wrap">
          {value}
        </pre>
        {blocked && blockedTitle && blockedDescription && confirmLabel ? (
          <ConfirmDialog
            trigger={iconButton}
            title={blockedTitle}
            description={blockedDescription}
            confirmLabel={confirmLabel}
            onConfirm={() => runCopy(value)}
          />
        ) : (
          iconButton
        )}
      </Stack>
      <Text as="span" id={liveId} role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? rowCopy.copied(label) : state === "failed" ? rowCopy.copyFailed : ""}
      </Text>
    </Stack>
  );
}
