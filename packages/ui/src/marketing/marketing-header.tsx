"use client";

import { Children } from "react";
import type * as React from "react";
import { Menu } from "lucide-react";

import { Container } from "../layout.js";
import { useUiMessages } from "../ui-provider.js";
import { cn } from "../utils.js";

export type MarketingHeaderProps = Omit<React.ComponentProps<"header">, "children"> & {
  /** Logo and name, usually one link to the home page. */
  brand: React.ReactNode;
  /** Page links (anchors or your router's links), shown in the bar from `md` and in the menu below it. */
  links?: React.ReactNode[] | undefined;
  /** Right side: language switch, sign-in and sign-up. Moves into the menu on phones. */
  actions?: React.ReactNode;
  /** Stick to the top of the viewport while scrolling (default true). */
  sticky?: boolean | undefined;
};

const linkClass =
  "[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-md [&_a]:px-3 [&_a]:text-sm [&_a]:font-medium [&_a]:text-muted-foreground [&_a]:hover:text-foreground [&_a[aria-current]]:text-foreground";

/**
 * Compact public-page header: brand, links, actions. On phones the links and
 * actions open from a native disclosure (no script). Chrome labels come from
 * `ZedkitUiProvider`.
 */
function MarketingHeader({ brand, links = [], actions, sticky = true, className, ...props }: MarketingHeaderProps) {
  const messages = useUiMessages();
  const items = Children.toArray(links);
  return (
    <header
      data-slot="marketing-header"
      className={cn("z-header w-full border-b bg-card text-card-foreground", sticky ? "sticky top-0" : "relative", className)}
      {...props}
    >
      <Container width="default" className="flex min-h-14 items-center gap-4">
        <div data-slot="marketing-header-brand" className="flex min-w-0 shrink-0 items-center">
          {brand}
        </div>
        {items.length > 0 ? (
          <nav aria-label={messages.mainNavigation} className="hidden flex-1 md:block">
            <ul className={cn("flex list-none items-center gap-1 p-0", linkClass)}>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </nav>
        ) : null}
        {actions ? (
          <div data-slot="marketing-header-actions" className="ml-auto hidden items-center gap-2 md:flex">
            {actions}
          </div>
        ) : null}
        <details data-slot="marketing-header-menu" className="group ml-auto md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-sm font-medium focus-ring-control [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-4" />
            {messages.menu}
          </summary>
          <div className="absolute inset-x-0 top-full flex flex-col gap-4 border-b bg-card p-4 shadow-lg">
            {items.length > 0 ? (
              <nav aria-label={messages.mainNavigation}>
                <ul className={cn("flex list-none flex-col gap-1 p-0", linkClass)}>
                  {items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </nav>
            ) : null}
            {actions ? <div className="flex flex-col gap-2 *:w-full">{actions}</div> : null}
          </div>
        </details>
      </Container>
    </header>
  );
}

export { MarketingHeader };
