"use client";

import type * as React from "react";

import { useUiMessages } from "../ui-provider.js";
import { cn } from "../utils.js";

export interface LocaleOption {
  /** Language tag, for example `en` or `fr`; also sets `lang` on the item. */
  code: string;
  /** Name in its own language, for example `Français`. */
  label: string;
  /** Where the item goes. Without it the item is a button that calls `onSelect`. */
  href?: string | undefined;
}

export type LocaleSwitchProps = Omit<React.ComponentProps<"nav">, "children" | "onSelect"> & {
  locales: LocaleOption[];
  /** Code of the language the page is in now. */
  current: string;
  /** Called with the chosen code when an item is activated (links still navigate). */
  onSelect?: ((code: string) => void) | undefined;
};

const itemClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-medium focus-ring-control hover:bg-muted aria-[current=true]:bg-secondary aria-[current=true]:text-secondary-foreground";

/** Language switch: one item per language, the current one marked. Name comes from `ZedkitUiProvider`. */
function LocaleSwitch({ locales, current, onSelect, className, ...props }: LocaleSwitchProps) {
  const messages = useUiMessages();
  return (
    <nav data-slot="locale-switch" aria-label={messages.language} className={className} {...props}>
      <ul className={cn("flex list-none items-center gap-1 p-0")}>
        {locales.map((locale) => {
          const isCurrent = locale.code === current;
          const state = isCurrent ? ("true" as const) : undefined;
          return (
            <li key={locale.code}>
              {locale.href ? (
                <a
                  href={locale.href}
                  lang={locale.code}
                  hrefLang={locale.code}
                  aria-current={state}
                  className={itemClass}
                  onClick={onSelect ? () => onSelect(locale.code) : undefined}
                >
                  {locale.label}
                </a>
              ) : (
                <button
                  type="button"
                  lang={locale.code}
                  aria-current={state}
                  className={itemClass}
                  onClick={() => onSelect?.(locale.code)}
                >
                  {locale.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { LocaleSwitch };
