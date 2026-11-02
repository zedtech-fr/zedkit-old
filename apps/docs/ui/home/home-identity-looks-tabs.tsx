"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";
import { HOME_IDENTITY_FACTS, IDENTITY_IDS, isIdentityId, type IdentityId } from "@/ui/home/home-identity-facts";
import { HomeIdentityPaletteDots } from "@/ui/home/home-identity-looks-swatches";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

const TAB_DOTS = ["background", "primary", "accent"] as const;

export function HomeIdentityLooksTabs({
  value,
  mode,
  onValueChange,
  children,
}: {
  value: IdentityId;
  mode: "light" | "dark";
  onValueChange: (id: IdentityId) => void;
  /** Panel(s): the active tab's `TabsContent`, so each trigger controls a real panel. */
  children: ReactNode;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (isIdentityId(next)) onValueChange(next);
      }}
      className="w-full min-w-0"
    >
      <TabsList
        aria-label={homeIdentityLooksCopy.tabsAriaLabel}
        // Phones: a 3x2 grid, so every name stays visible and the chosen one never scrolls out of sight.
        className="grid h-auto! min-h-11 w-full min-w-0 grid-cols-3 gap-1 xl:flex xl:snap-x xl:snap-mandatory xl:justify-start xl:overflow-x-auto"
      >
        {IDENTITY_IDS.map((id) => (
          <TabsTrigger
            key={id}
            value={id}
            className="min-h-11 shrink-0 snap-start flex-col gap-1 px-2 py-2 sm:flex-row sm:gap-2 sm:px-3 sm:py-1"
          >
            <HomeIdentityPaletteDots identity={id} mode={mode} tokens={TAB_DOTS} />
            <span data-tab-label="">{homeIdentityLooksCopy.products[id]}</span>
            <span className="text-xs font-normal text-muted-foreground">{HOME_IDENTITY_FACTS[id].label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {/* Only shown while the examples change with the scroll: how far through them the page is. */}
      <span data-identity-progress="" aria-hidden="true">
        <span />
      </span>
      {children}
    </Tabs>
  );
}
