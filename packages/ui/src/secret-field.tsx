"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button.js";
import { Input } from "./input.js";
import { Textarea } from "./textarea.js";
import { useUiMessages } from "./ui-provider.js";

export interface SecretFieldProps {
  /** Element id, so a Label can point at it. */
  id?: string;
  /** The secret text (shown once by the caller, never logged). */
  value: string;
  /** Accessible label for the copy button. */
  copyLabel?: string;
  /**
   * Render the value in a read-only textarea that wraps (at spaces, and
   * inside a token that is longer than the line) and grows to show all of
   * it, so long values (install commands, short file snippets) read in full
   * on narrow screens. Shown-once secrets should stay single-line (default).
   * Browsers without `field-sizing` start at one row per line of the value
   * and scroll inside the box when a line wraps.
   */
  multiline?: boolean | undefined;
  /**
   * Accessible name for the value input. Required unless an external
   * Label points at `id` — every input must have a label.
   */
  "aria-label"?: string;
}

/**
 * Shown-once secret with a copy button: read-only value, clipboard
 * on click, check feedback for 2s. Falls back to no-op when the
 * clipboard API is unavailable (insecure contexts).
 */
function SecretField({ id, value, copyLabel, multiline = false, "aria-label": ariaLabel }: SecretFieldProps) {
  const messages = useUiMessages();
  const [copied, setCopied] = React.useState(false);
  const copy = (): void => {
    const clipboard = navigator.clipboard;
    if (!clipboard) return;
    clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  };
  return (
    <div
      data-slot="secret-field"
      className={multiline ? "flex w-full items-start gap-2" : "flex w-full items-center gap-2"}
    >
      {multiline ? (
        <Textarea
          id={id}
          readOnly
          value={value}
          rows={Math.max(1, value.split("\n").length)}
          spellCheck={false}
          autoComplete="off"
          className="field-sizing-content max-h-64 min-h-control-height resize-none overflow-y-auto font-mono wrap-anywhere whitespace-pre-wrap"
          aria-label={ariaLabel}
        />
      ) : (
        <Input id={id} readOnly value={value} className="font-mono" aria-label={ariaLabel} />
      )}
      <Button type="button" variant="outline" size="icon" aria-label={copyLabel ?? messages.copyToClipboard} onClick={copy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

export { SecretField };
