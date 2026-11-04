"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const ThemeScopeContext = React.createContext<HTMLElement | null>(null);
/** Identity of the nearest enclosing scope, so a nested scope that only pins a mode keeps the look. */
const ThemeIdentityContext = React.createContext<string | undefined>(undefined);
/** Pinned mode of the nearest enclosing scope; unset inherits the page mode. */
const ThemeModeContext = React.createContext<"light" | "dark" | undefined>(undefined);
/**
 * Nearest open dialog/drawer panel node. Dropdown panels opened inside an overlay mount here so they stay
 * above the dim layer even though the layer scale ranks them below it; unset outside overlays.
 */
const OverlayMountContext = React.createContext<HTMLElement | null>(null);

/** Portal mount for overlays opened inside a `ThemeScope`. Unset at the document root. */
function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(ThemeScopeContext) ?? undefined;
}

/** Effective identity+mode at the call site (nearest explicit pin of each, else unset). */
function useScopeTheme(): { identity: string | undefined; mode: "light" | "dark" | undefined } {
  return {
    identity: React.useContext(ThemeIdentityContext),
    mode: React.useContext(ThemeModeContext),
  };
}

/** Nearest open dialog/drawer panel node, for dropdown panels opened inside an overlay. */
function useOverlayMount(): HTMLElement | null {
  return React.useContext(OverlayMountContext);
}

/**
 * Body-level twin of the nearest `ThemeScope`: dialog/drawer portals mount to `document.body` so no consumer
 * stacking context (a transform, filter, or `isolation`) can trap them under the site header, and this plain
 * static wrapper carries the scope's identity, mode, and type so the panel keeps the specimen's look. It adds
 * no positioning or paint effects of its own, so the overlay and panel still compete in the root layer scale.
 */
function ScopeMirror({ children }: { children: React.ReactNode }) {
  const { identity, mode } = useScopeTheme();
  // Nothing to mirror outside a scope: no wrapper, so unscoped overlays keep their exact old DOM.
  if (identity == null && mode == null) return <>{children}</>;
  return (
    <div
      data-slot="theme-scope"
      {...(identity == null ? {} : { "data-identity-scope": "", "data-identity": identity })}
      className={cn(
        "font-sans text-foreground",
        // `dark` is the mode marker the `dark:` variant and identity CSS key on.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        mode === "dark" && "dark",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Dialog/drawer portal: `ScopeMirror` into `container ?? document.body`, with no Presence of its own, so
 * the overlay and panel inner Presences own the exit lifecycle (closed state, exit animation,
 * animationend/cancel unmount). Mount-gated for SSR (no `document` on the server, no hydration mismatch).
 */
function ScopePortal({
  container,
  children,
}: {
  container?: Element | DocumentFragment | null | undefined;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(<ScopeMirror>{children}</ScopeMirror>, container ?? document.body);
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
 * Nearest identity+mode boundary. Dropdown panels read `usePortalContainer()` and mount here so they keep
 * `data-identity`, `.dark` and font tokens; dialog/drawer portals mount to `document.body` (trapping-proof)
 * with a `ScopeMirror` twin carrying the same look. Without a provider, Radix/Sonner keep their root
 * (`document.body`) behaviour.
 */
function ThemeScope({ identity, mode, className, children, ref, ...props }: ThemeScopeProps) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const inherited = React.useContext(ThemeIdentityContext);
  const inheritedMode = React.useContext(ThemeModeContext);
  const scopeIdentity = identity ?? inherited;
  const scopeMode = mode ?? inheritedMode;
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
        <ThemeModeContext.Provider value={scopeMode}>
          <ThemeScopeContext.Provider value={container}>{children}</ThemeScopeContext.Provider>
        </ThemeModeContext.Provider>
      </ThemeIdentityContext.Provider>
    </div>
  );
}

export {
  OverlayMountContext,
  ScopeMirror,
  ScopePortal,
  ThemeScope,
  useOverlayMount,
  usePortalContainer,
  useScopeTheme,
  type ThemeScopeProps,
};
