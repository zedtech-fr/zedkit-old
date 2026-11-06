"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as React from "react";

import { cn } from "./utils.js";

export type WordRollProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Cycle of words rendered in the slot (caller owns ordering and timing). */
  words: readonly string[];
  /** Current word; must be an entry in `words`. */
  value: string;
  /**
   * Exit duration in ms (match `--zk-reveal-duration` / identity).
   * Incoming uses `data-animate="fade-up"` (enter-only appear contract).
   */
  dwellMs?: number;
};

const DEFAULT_DWELL_MS = 300;

const LAYER_CLASS = "absolute top-[var(--zk-word-roll-pad-block,0.2em)] left-0 whitespace-nowrap";

const CLIP_CLASS =
  "pointer-events-none absolute inset-x-0 [top:calc(-1*var(--zk-word-roll-pad-block,0.2em))] [bottom:calc(-1*var(--zk-word-roll-pad-block,0.35em))] overflow-hidden";

function pickWord(words: readonly string[], value: string): string {
  return words.includes(value) ? value : (words[0] ?? value);
}

/**
 * Inline vertical word roll: outgoing text glides up, incoming rises from below,
 * clipped without shifting the line baseline.
 *
 * Critical layout: the in-flow host stays `inline-block` with **visible** overflow
 * and an invisible strut word so CSS uses the text baseline. `overflow: hidden`
 * on an in-flow inline-block makes the baseline the bottom margin edge and lifts
 * the visible word above the surrounding title — never put clip on the host.
 *
 * Uses `data-animate="fade-up"` for enter (mount `<AnimateObserver />` /
 * `observeAnimate()` once). Outgoing uses `data-word-roll="exit"` + `motion.css`.
 * Decorative — pair with `aria-hidden` when the accessible name is on a parent.
 */
function WordRoll({ words, value, dwellMs = DEFAULT_DWELL_MS, className, ...props }: WordRollProps) {
  const safe = pickWord(words, value);
  const [displayed, setDisplayed] = useState(safe);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [exitKey, setExitKey] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);

  const strut = useMemo(
    () => words.reduce((longest, word) => (word.length > longest.length ? word : longest), safe),
    [words, safe],
  );

  useEffect(() => {
    const next = pickWord(words, value);
    if (next === displayed) {
      setIncoming(null);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
      return;
    }
    setIncoming(next);
  }, [value, words, displayed]);

  useEffect(() => {
    if (incoming === null || incoming === displayed) return;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      setDisplayed(incoming);
      setIncoming(null);
      setExitKey((k) => k + 1);
    }, dwellMs);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [incoming, displayed, dwellMs]);

  const outgoing = incoming !== null && incoming !== displayed ? displayed : null;
  const visible = incoming ?? displayed;
  const appear = outgoing != null;

  return (
    <span
      data-slot="word-roll"
      data-word-roll=""
      className={cn("relative inline-block align-baseline", className)}
      {...props}
    >
      {/* In-flow strut: width + real text baseline (overflow must stay visible). */}
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {strut}
      </span>
      <WordRollClip outgoing={outgoing} visible={visible} exitKey={exitKey} appear={appear} />
    </span>
  );
}

function WordRollClip({
  outgoing,
  visible,
  exitKey,
  appear,
}: {
  outgoing: string | null;
  visible: string;
  exitKey: number;
  appear: boolean;
}) {
  return (
    <span data-word-roll-clip="" className={CLIP_CLASS} aria-hidden="true">
      <span className="relative block h-full w-full">
        {outgoing != null ? (
          <span key={`${outgoing}-out-${exitKey}`} data-word-roll="exit" className={LAYER_CLASS}>
            {outgoing}
          </span>
        ) : null}
        <span
          key={`${visible}-in-${exitKey}`}
          data-word-roll="in"
          {...(appear ? { "data-animate": "fade-up" as const } : {})}
          className={LAYER_CLASS}
        >
          {visible}
        </span>
      </span>
    </span>
  );
}

export { WordRoll };
