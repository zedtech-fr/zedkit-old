"use client";

import { useEffect, useState } from "react";
import { Heading, Text, useMotionPreference, WordRoll } from "@zedtech/zedkit-ui";

const WORDS = ["Cursor", "Muse", "Claude", "your choice"] as const;

/** Stable accessible name: the rotating segment is decorative (`aria-hidden` on the slot). */
export const AI_SETUP_PAGE_H1_LABEL = "Set up zedkit AI in Cursor, Muse, Claude, or your choice";

const ROTATE_MS = 2800;
const ROLL_DWELL_MS = 300;

const LEAD = "Give your coding agent one prompt to set up ZedKit AI in your project.";

/** Accent the rolling word only; inherit Heading weight/size — no type size on the slot. */
const ROLL_ACCENT =
  "[&_[data-word-roll=in]]:text-primary [&_[data-word-roll=in]]:underline [&_[data-word-roll=in]]:decoration-primary/50 [&_[data-word-roll=in]]:underline-offset-4 [&_[data-word-roll=exit]]:text-primary [&_[data-word-roll=exit]]:underline [&_[data-word-roll=exit]]:decoration-primary/50 [&_[data-word-roll=exit]]:underline-offset-4";

/**
 * Page H1 for the AI setup guide. SSR and the client paint the same tree
 * (first word + WordRoll) so hydration does not swap a long title for a short
 * one. The interval only starts when motion is allowed.
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

  const word = WORDS[index] ?? WORDS[0];

  return (
    <>
      <Heading level={1} typeRole="title" className="mb-2 text-balance" aria-label={AI_SETUP_PAGE_H1_LABEL}>
        Set up zedkit AI in{" "}
        <WordRoll words={WORDS} value={word} dwellMs={ROLL_DWELL_MS} className={ROLL_ACCENT} aria-hidden />
      </Heading>
      <Text as="p" variant="muted" className="mb-6 text-balance">
        {LEAD}
      </Text>
    </>
  );
}
