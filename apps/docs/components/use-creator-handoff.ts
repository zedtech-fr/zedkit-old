import { useEffect } from "react";

import { readCreatorHandoff } from "@/lib/creator-handoff";

/**
 * Says once, on arrival, that the visitor came here to create: with a brief carried over from the home page, or
 * with `#create` in the address. `brief` is only placed in the form by the caller and nothing is sent, so arriving
 * never costs anything.
 */
export function useCreatorHandoff(onArrive: (brief: string | null) => void) {
  useEffect(() => {
    const handoff = readCreatorHandoff(window.sessionStorage);
    if (handoff || window.location.hash === "#create") onArrive(handoff ? handoff.brief : null);
    // Once, on arrival: the form is filled and focused a single time.
  }, []);
}
