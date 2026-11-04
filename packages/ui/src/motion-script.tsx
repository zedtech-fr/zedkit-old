import type * as React from "react";

import { MOTION_BOOTSTRAP_SOURCE } from "./motion-bootstrap.js";
import { MOTION_STORAGE_KEY } from "./motion-preference.js";

type MotionScriptProps = {
  storageKey?: string;
};

/**
 * Inline script that sets `data-motion="reduce"` on <html> before first paint
 * when that choice is stored. Render it once inside <head> of the root layout.
 * The html element needs `suppressHydrationWarning`.
 * No `use client`: this is a static tag, not a hydrated island.
 */
function MotionScript({ storageKey = MOTION_STORAGE_KEY }: MotionScriptProps): React.JSX.Element {
  return (
    <script
      data-slot="motion-script"
      data-storage-key={storageKey}
      dangerouslySetInnerHTML={{ __html: MOTION_BOOTSTRAP_SOURCE }}
      suppressHydrationWarning
    />
  );
}

export { MotionScript, type MotionScriptProps };
