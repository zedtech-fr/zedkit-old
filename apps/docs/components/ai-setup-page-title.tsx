"use client";

import { useEffect, useState } from "react";
import { Heading, useMotionPreference } from "@zedtech/zedkit-ui";

const WORDS = ["Cursor", "Muse", "Claude", "your choice"] as const;

/** Stable accessible name: the rotating segment is decorative (`aria-hidden` on the slot). */
export const AI_SETUP_PAGE_H1_LABEL = "Set up zedkit AI in Cursor, Muse, Claude, or your choice";

const ROTATE_MS = 2800;

const STATIC_INCLUSIVE = "Set up zedkit AI in Cursor, Muse, Claude, or your choice";

/**
 * Page H1 for the AI setup guide: cycles the last word with kit `data-animate` appear motion
 * (Animate uses a `div` host, so this applies the same contract on an inline `span` inside the `h1`).
 * Under reduced motion, shows a static inclusive title (no cycling).
 */
export function AiSetupPageTitle() {
  const motion = useMotionPreference();
  const motionOk = motion === "no-preference";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!motionOk) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [motionOk]);

  const word = WORDS[index];

  if (!motionOk) {
    return (
      <Heading level={1} typeRole="title" className="mb-2 text-balance">
        {STATIC_INCLUSIVE}
      </Heading>
    );
  }

  return (
    <Heading level={1} typeRole="title" className="mb-2 text-balance" aria-label={AI_SETUP_PAGE_H1_LABEL}>
      <span className="inline">Set up zedkit AI in </span>
      <span className="inline-block min-w-[11ch] align-baseline" aria-hidden>
        <span key={word} data-animate="fade-in">
          {word}
        </span>
      </span>
    </Heading>
  );
}
