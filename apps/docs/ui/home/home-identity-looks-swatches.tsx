"use client";

import { cn, Stack, Text, ThemeScope } from "@zedtech/zedkit-ui";
import type { IdentityId, IdentityPaletteSwatch, IdentityPaletteToken } from "@/ui/home/home-identity-facts";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

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

export function HomeIdentityPaletteSwatches({
  identity,
  mode,
  palette,
}: {
  identity: IdentityId;
  mode: "light" | "dark";
  palette: readonly IdentityPaletteSwatch[];
}) {
  return (
    <Stack direction="horizontal" gap={3} className="flex-wrap">
      {palette.map((swatch) => (
        <Stack key={swatch.token} gap={1} className="items-start">
          <span className="size-10 shrink-0 overflow-hidden rounded-md border border-border">
            <ThemeScope identity={identity} mode={mode} className="block size-full">
              <span className={cn("block size-full", SWATCH_BG[swatch.token])} />
            </ThemeScope>
          </span>
          <Text as="span" variant="muted" className={HOME_METADATA_TEXT_CLASS}>
            {swatch.label}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
