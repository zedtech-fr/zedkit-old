"use client";

import { cn, Stack, ThemeScope } from "@zedtech/zedkit-ui";
import type { IdentityId, IdentityPaletteToken } from "@/ui/home/home-identity-facts";

const SWATCH_BG: Record<IdentityPaletteToken, string> = {
  background: "bg-background",
  primary: "bg-primary",
  accent: "bg-accent",
  card: "bg-card",
  border: "bg-border",
};

export function HomeIdentityPaletteDots({
  identity,
  mode,
  tokens,
}: {
  identity: IdentityId;
  mode: "light" | "dark";
  tokens: readonly IdentityPaletteToken[];
}) {
  return (
    <ThemeScope identity={identity} mode={mode} aria-hidden="true">
      {/* data-palette-dots pins --spacing (docs-shell-tokens.css): a look's own spacing must not resize its dots. */}
      <Stack direction="horizontal" gap={1} data-palette-dots="">
        {tokens.map((token) => (
          <span
            key={token}
            className={cn("size-3 shrink-0 rounded-full border border-border", SWATCH_BG[token])}
          />
        ))}
      </Stack>
    </ThemeScope>
  );
}
