"use client";

import { useEffect, useRef } from "react";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsStaticSearch } from "@/lib/use-docs-static-search";

/**
 * Static search dialog: queries the build-time index
 * (app/api/search/route.ts) in the browser — no server needed.
 */
export default function StaticSearchDialog(props: SharedProps) {
  const { data, ...searchRest } = useDocsStaticSearch();
  const wasOpen = useRef(false);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (props.open) {
      triggerRef.current = document.activeElement;
    }
  }, [props.open]);

  useEffect(() => {
    if (wasOpen.current && !props.open) {
      window.dispatchEvent(new Event("zedkit:search-closed"));
      const target = triggerRef.current;
      if (target instanceof HTMLElement && document.contains(target)) {
        target.focus({ preventScroll: true });
      }
    }
    wasOpen.current = props.open;
  }, [props.open]);

  return (
    <SearchDialog {...searchRest} {...(data ? { data } : {})} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
