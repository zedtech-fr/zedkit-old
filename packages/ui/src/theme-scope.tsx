"use client";

import * as React from "react";

import { cn } from "./utils.js";

const ThemeScopeContext = React.createContext<HTMLElement | null>(null);
/** Identity of the nearest enclosing scope, so a nested scope that only pins a mode keeps the look. */
const ThemeIdentityContext = React.createContext<string | undefined>(undefined);

/** Portal mount for overlays opened inside a `ThemeScope`. Unset at the document root. */
function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(ThemeScopeContext) ?? undefined;
}

type ThemeScopeProps = React.ComponentProps<"div"> & {
  /** When set, this node is the nearest identity+mode authority for its subtree and portals. */
  identity?: string | undefined;
  /**
   * Pins light or dark for this subtree; unset inherits the surrounding mode.
   * Pinned inside another scope without an `identity`, the node takes that
   * scope's identity, so the nearer scope (not the page root) decides its tokens.
   */
  mode?: "light" | "dark" | undefined;
};

/**
 * Nearest identity+mode boundary. Overlays read `usePortalContainer()` and
 * mount here so they keep `data-identity`, `.dark` and font tokens. Without
 * a provider, Radix/Sonner keep their root (`document.body`) behaviour.
 */
function ThemeScope({ identity, mode, className, children, ref, ...props }: ThemeScopeProps) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const inherited = React.useContext(ThemeIdentityContext);
  const scopeIdentity = identity ?? inherited;
  // Identity and mode tokens are declared per node (`[data-identity-scope][data-identity].dark`), so a
  // node that pins a mode must carry the identity itself instead of leaving it to an ancestor.
  const pinned = identity ?? (mode ? inherited : undefined);
  // One ref callback feeds the portal context and the consumer's ref (object or
  // callback, with or without a cleanup function), so neither replaces the other.
  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      setContainer(node);
      if (typeof ref === "function") {
        const cleanup = ref(node);
        return () => {
          setContainer(null);
          if (typeof cleanup === "function") cleanup();
          else ref(null);
        };
      }
      if (ref) ref.current = node;
      return () => {
        setContainer(null);
        if (ref) ref.current = null;
      };
    },
    [ref],
  );
  return (
    <div
      ref={attach}
      data-slot="theme-scope"
      {...(pinned ? { "data-identity-scope": "", "data-identity": pinned } : {})}
      {...props}
      className={cn(
        "font-sans text-foreground",
        // `dark` is the mode marker the `dark:` variant and identity CSS key on.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        mode === "dark" && "dark",
        className,
      )}
    >
      <ThemeIdentityContext.Provider value={scopeIdentity}>
        <ThemeScopeContext.Provider value={container}>{children}</ThemeScopeContext.Provider>
      </ThemeIdentityContext.Provider>
    </div>
  );
}

export { ThemeScope, usePortalContainer, type ThemeScopeProps };
