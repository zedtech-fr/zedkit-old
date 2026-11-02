"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useSearchContext } from "fumadocs-ui/contexts/search";

const iconButtonClassName =
  "inline-flex min-h-overlay-touch-target min-w-overlay-touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-ring-control";

/** Opens the shared docs search dialog from the phone header (no floating control). */
export function MobileSearchTrigger({ className }: { className?: string }) {
  const { setOpenSearch } = useSearchContext();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = () => {
      triggerRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("zedkit:search-closed", onOpen);
    return () => window.removeEventListener("zedkit:search-closed", onOpen);
  }, []);

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-label="Search the documentation"
      data-mobile-search=""
      className={className ?? iconButtonClassName}
      onClick={() => setOpenSearch(true)}
    >
      <Search aria-hidden="true" className="size-4" />
    </button>
  );
}
