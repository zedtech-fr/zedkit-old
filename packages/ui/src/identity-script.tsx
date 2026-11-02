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

/**
 * Inline script that sets `data-identity` on <html> before first paint,
 * so the stored identity never flashes. Render it once inside <head>
 * of the root layout. The html element needs `suppressHydrationWarning`.
 * No `use client`: this is a static tag, not a hydrated island.
 */
function IdentityScript({
  ids = identities.map((item) => item.id),
  defaultIdentity,
  storageKey = IDENTITY_STORAGE_KEY,
  optInStorageKey,
}: IdentityScriptProps): React.JSX.Element {
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
