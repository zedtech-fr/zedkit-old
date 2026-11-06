import { useEffect, useRef, useState } from "react";
import { AI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";

export type HeroAgentStatus = "idle" | "running" | "done";

/** How long each phase of the scripted run lasts. Fixed, so the run reads the same on every visit. */
export const HERO_AGENT_PHASE_MS = [1500, 1300, 1100, 900] as const;
export const HERO_AGENT_PHASES = ["read", "rules", "plan", "validate"] as const;

/**
 * State of the hero's agent panel: open or not, what is in the composer, and a scripted run through four phases.
 * `step` is the phase in progress while `running` (phases before it are done) and the phase count once `done`.
 * No network: the phases advance on timers, whoever pressed send (the tour or the visitor).
 */
export function useHeroAgent() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<HeroAgentStatus>("idle");
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const reset = (close = false) => {
    clear();
    setStatus("idle");
    setStep(0);
    setDraft("");
    if (close) setOpen(false);
  };

  const submit = () => {
    if (status !== "idle" || draft.trim() === "") return;
    setStatus("running");
    setStep(0);
    let elapsed = 0;
    HERO_AGENT_PHASE_MS.forEach((ms, index) => {
      elapsed += ms;
      timers.current.push(
        setTimeout(() => {
          setStep(index + 1);
          if (index === HERO_AGENT_PHASE_MS.length - 1) setStatus("done");
        }, elapsed),
      );
    });
  };

  const toggle = () => {
    if (!open && status === "done") reset();
    // One tap to run: the composer opens with the prompt already in it (never over what the visitor typed).
    if (!open && (status === "done" || draft.trim() === "")) setDraft(AI_SETUP_MINI_PROMPT);
    setOpen((value) => !value);
  };

  return { open, draft, status, step, setDraft, submit, toggle, reset };
}

export type HeroAgent = ReturnType<typeof useHeroAgent>;
