"use client";

import { StatusDot } from "./status-dot.js";
import { useUiMessages } from "./ui-provider.js";
import { cn } from "./utils.js";
import type { AssistantStreamStage } from "./assistant-stream.js";

export interface StreamStatusProps {
  /** A named step; worded from the UI messages when `label` is omitted. */
  stage?: AssistantStreamStage | undefined;
  /** Override the named step's wording, or stand in before the first stage arrives. */
  label?: string | undefined;
  /**
   * When true (default), this node is its own polite live region.
   * Set false when a parent already announces (`aria-live="polite"`).
   */
  live?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Evolving work status: a motion-safe pulse and a named step
 * ("Reading the site", "Choosing a palette"), announced politely.
 */
export function StreamStatus({ stage, label, live = true, className }: StreamStatusProps) {
  const messages = useUiMessages();
  const text = label ?? (stage ? messages.streamStatus[stage] : "");
  if (!text) return null;
  return (
    <span
      data-slot="stream-status"
      {...(live ? { role: "status" as const, "aria-live": "polite" as const, "aria-atomic": "true" as const } : {})}
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}
    >
      <StatusDot tone="active" pulse />
      {text}
    </span>
  );
}
