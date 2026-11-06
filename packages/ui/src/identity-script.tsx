"use client";

import { useSyncExternalStore } from "react";
import type * as React from "react";

import { IDENTITY_BOOTSTRAP_SOURCE } from "./identity-bootstrap.js";
import { IDENTITY_STORAGE_KEY, customIdentityStorageKey, identities } from "./identity-data.js";

type IdentityScriptProps = {
  /** Allowed ids; anything else stored is ignored. Default: built-in identities. */
  ids?: readonly string[];
  /** Applied when nothing valid is stored. Without it, the attribute is left unset (stock look). */
  defaultIdentity?: string;
  storageKey?: string;
  /** When set, stored look applies only if this localStorage key is `"1"`. */
  optInStorageKey?: string;
};

const subscribe = (): (() => void) => () => {};

/**
 * Inline script that sets `data-identity` on <html> before first paint,
 * so the stored identity never flashes. Render it once inside <head>
 * of the root layout. The html element needs `suppressHydrationWarning`.
 *
 * Emits the tag on the server and during hydration only. React 19 never
 * runs scripts created on a client render (Next.js 16 logs that as an error);
 * the SSR HTML still contains the IIFE, so it runs before paint.
 */
function IdentityScript({
  ids = identities.map((item) => item.id),
  defaultIdentity,
  storageKey = IDENTITY_STORAGE_KEY,
  optInStorageKey,
}: IdentityScriptProps): React.JSX.Element | null {
  const emitScript = useSyncExternalStore(subscribe, () => false, () => true);
  if (!emitScript) return null;
  return (
    <script
      data-slot="identity-script"
      data-ids={JSON.stringify(ids)}
      data-storage-key={storageKey}
      data-custom-key={customIdentityStorageKey(storageKey)}
      {...(optInStorageKey !== undefined ? { "data-opt-in-key": optInStorageKey } : {})}
      {...(defaultIdentity !== undefined ? { "data-default": defaultIdentity } : {})}
      dangerouslySetInnerHTML={{ __html: IDENTITY_BOOTSTRAP_SOURCE }}
      suppressHydrationWarning
    />
  );
}

export { IdentityScript, type IdentityScriptProps };
