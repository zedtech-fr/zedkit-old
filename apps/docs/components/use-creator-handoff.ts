import { useEffect } from "react";

import { readCreatorHandoff } from "@/lib/creator-handoff";
import { readCreatorSessionBrief } from "@/lib/creator-session-brief";

/**
 * Says once, on arrival, that the visitor came here to create: with a brief carried over from the home page, with
 * `#create` in the address, or with an unfinished brief still in this tab. `brief` is only placed in the form by
 * the caller and nothing is sent, so arriving never costs anything. The editor replaces `#create` with a look
 * query, so a reload restores from session storage, not from the hash.
 */
export function useCreatorHandoff(onArrive: (brief: string | null) => void) {
  useEffect(() => {
    const storage = window.sessionStorage;
    const handoff = readCreatorHandoff(storage);
    if (handoff) {
      onArrive(handoff.brief);
      return;
    }
    const saved = readCreatorSessionBrief(storage);
    if (saved || window.location.hash === "#create") onArrive(saved);
    // Once, on arrival: the form is filled and focused a single time.
  }, []);
}
