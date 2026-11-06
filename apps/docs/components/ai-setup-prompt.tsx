"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { adoptionCopy } from "@/components/i18n/adoption-copy";
import {
  AI_SETUP_DOCS_PATH,
  AI_SETUP_LLMS_URL,
  AI_SETUP_MINI_PROMPT,
} from "@/lib/ai-setup-onboarding.generated";

type CopyState = "idle" | "copied" | "failed";

function CopyPromptButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function settle(next: CopyState) {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  function copy() {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard) return settle("failed");
    clipboard.writeText(text).then(
      () => settle("copied"),
      () => settle("failed"),
    );
  }

  const label = adoptionCopy.copyLabel("Agent setup prompt");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 focus-visible:-outline-offset-(--ring-width)"
        aria-label={label}
        onClick={copy}
      >
        {state === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </Button>
      <Text as="span" role="status" className="sr-only">
        {state === "copied" ? adoptionCopy.copied : state === "failed" ? adoptionCopy.copyFailed : ""}
      </Text>
    </>
  );
}

/** One-line setup prompt + copy control; used on the AI setup guide. */
export function AiSetupPrompt() {
  return (
    <Stack
      gap={2}
      className={
        // not-prose is a fumadocs escape hatch, not a Tailwind utility.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        "not-prose rounded-lg border border-border bg-muted/40 p-4"
      }
    >
      <Text as="p" variant="muted" className="m-0">
        Paste this as the only message in a new chat at the repo root (Cursor, Muse, Claude Code, or your tool — agents should fetch{" "}
        <a href={AI_SETUP_LLMS_URL} className="underline underline-offset-2">
          {AI_SETUP_LLMS_URL}
        </a>
        ):
      </Text>
      <Stack gap={2} className="min-w-0 sm:flex-row sm:items-start sm:justify-between">
        <pre className="min-w-0 flex-1 overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap">
          {AI_SETUP_MINI_PROMPT}
        </pre>
        <CopyPromptButton text={AI_SETUP_MINI_PROMPT} />
      </Stack>
      <Text as="p" variant="muted" className="m-0">
        Full walkthrough:{" "}
        <a href={AI_SETUP_DOCS_PATH} className="underline underline-offset-2">
          {AI_SETUP_DOCS_PATH}
        </a>
      </Text>
    </Stack>
  );
}
