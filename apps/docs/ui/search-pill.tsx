"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";

import { useSearchPill } from "@/ui/search-pill-controller";

const iconButtonClassName =
  "inline-flex min-h-[max(2.75rem,44px)] min-w-[max(2.75rem,44px)] flex-none items-center justify-center rounded-full focus-ring-control";

const SearchPillBody = dynamic(() => import("@/ui/search-pill-body").then((mod) => mod.SearchPillBody));

/** Phone search: magnifier opens a top-anchored bar and results sheet (see search-pill-controller). */
export function SearchPill() {
  const { open, close, openSearch, bar, overlay, toggle, root, dialog } = useSearchPill();

  return (
    <div ref={root} className="md:hidden" data-search-pill>
      {open ? (
        <div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label="Search the documentation"
          className="fixed inset-0 z-overlay"
        >
          <button
            ref={overlay}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="fixed inset-0 z-overlay cursor-default bg-overlay/30 transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0"
          />
          <div
            ref={bar}
            data-search-bar
            className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] z-overlay origin-top-left"
          >
            <div
              role="search"
              className="relative isolate flex h-[max(2.75rem,44px)] items-center text-popover-foreground transition-none"
            >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-popover shadow-lg ring-1 ring-border"
              />
              <SearchPillBody onClose={close} />
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={`fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-overlay ${open ? "invisible" : ""}`}
      >
        <button
          ref={toggle}
          type="button"
          aria-label="Search the documentation"
          onClick={openSearch}
          className={`${iconButtonClassName} bg-primary text-primary-foreground shadow-lg active:scale-95 motion-reduce:transition-none`}
        >
          <Search aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
