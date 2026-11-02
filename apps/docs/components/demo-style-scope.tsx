"use client";

import { useId, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { identities, Stack, ThemeScope, useIdentity } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { demoStyleScopeCopy } from "@/components/i18n/demo-style-scope-copy";

type ScopeAttrs = { "data-identity-scope": ""; "data-identity": string };

/**
 * Demo look, separate from the site identity on `<html>`.
 * The preview inherits the page until someone picks a style.
 * A pick sets `data-identity-scope` on this demo only.
 * State stays in the component: a shared hook was memoized on the site
 * identity and ignored later picks. The home hero can use `DemoStyleScope`.
 */
function usePinnedLook() {
  const site = useIdentity(DEFAULT_IDENTITY);
  const [pinned, setPinned] = useState<string | null>(null);
  const look = pinned ?? site;
  const scopeAttrs: ScopeAttrs | Record<string, never> = pinned
    ? { "data-identity-scope": "", "data-identity": pinned }
    : {};
  return { look, pinned: pinned !== null, pin: setPinned, scopeAttrs };
}

function DemoStyleSelect({
  look,
  pinned,
  onPin,
  fieldLabel = demoStyleScopeCopy.fieldLabel,
  labelHidden = false,
}: {
  look: string;
  pinned: boolean;
  onPin: (id: string | null) => void;
  fieldLabel?: string;
  /** Keep the label for assistive tech only (a surrounding row already names it). */
  labelHidden?: boolean;
}) {
  const selectId = useId();
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <label htmlFor={selectId} className={labelHidden ? "sr-only" : "text-xs text-muted-foreground"}>
        {fieldLabel}
      </label>
      {/* Uncontrolled: a controlled select here reports the previous value on change. */}
      <select
        key={pinned ? look : "follow-site"}
        id={selectId}
        defaultValue={pinned ? look : "follow-site"}
        onChange={(event) => onPin(event.target.value === "follow-site" ? null : event.target.value)}
        className="h-8 max-w-36 rounded-md border border-input bg-background px-2 text-control text-foreground focus-ring-control"
      >
        <option value="follow-site">{demoStyleScopeCopy.followSite}</option>
        {identities.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </Stack>
  );
}

function DemoStyleScope({ children }: { children: ReactNode }) {
  const demo = usePinnedLook();
  const { resolvedTheme } = useTheme();
  return (
    <Stack gap={2} className="min-w-0">
      <DemoStyleSelect look={demo.look} pinned={demo.pinned} onPin={demo.pin} />
      <ThemeScope
        identity={demo.look}
        mode={resolvedTheme === "dark" ? "dark" : "light"}
        className="min-w-0"
      >
        {children}
      </ThemeScope>
    </Stack>
  );
}

export { DemoStyleScope, DemoStyleSelect, usePinnedLook };
