export interface StreamTextProps {
  text: string;
  /**
   * When true (default), this node is a polite live region that announces additions
   * without re-reading the whole text. Set false when a parent already announces.
   */
  live?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Incremental assistant text. No caret or motion of its own, so reduced-motion
 * visitors see the words arrive without extra animation.
 */
export function StreamText({ text, live = true, className }: StreamTextProps) {
  if (!text) return null;
  return (
    <span
      data-slot="stream-text"
      {...(live ? { role: "status" as const, "aria-live": "polite" as const, "aria-atomic": "false" as const } : {})}
      className={className}
    >
      {text}
    </span>
  );
}
