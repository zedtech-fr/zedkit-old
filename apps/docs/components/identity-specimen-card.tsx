"use client";

import { useLayoutEffect, useRef } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import type { SpecimenComposition } from "@/components/i18n/identity-specimen-compositions";
import { SpecimenScreen } from "@/components/identity-specimens/screen";

/** One small product screen for a proposal preview. */
export function IdentitySpecimenCard({
  dark,
  label,
  proposal,
  copy,
}: {
  dark: boolean;
  label: string;
  proposal: string;
  copy: SpecimenComposition;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Stack
      ref={ref}
      data-identity-scope=""
      data-identity-proposal={proposal}
      data-identity="proposal"
      role="group"
      aria-label={label}
      gap={3}
      className="min-w-0 rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-sm"
    >
      <Stack gap={3} inert>
        <SpecimenScreen copy={copy} />
      </Stack>
    </Stack>
  );
}
