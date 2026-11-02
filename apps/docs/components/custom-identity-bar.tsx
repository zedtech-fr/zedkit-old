"use client";

import { useSyncExternalStore } from "react";
import {
  applyIdentity,
  Badge,
  Button,
  discardCustomIdentity,
  CUSTOM_IDENTITY_ID,
  IDENTITY_CHANGE_EVENT,
  isNamedIdentityId,
  Stack,
  Text,
  useIdentity,
} from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import {
  clearDocsSiteIdentity,
  docsSiteCustomStorageKey,
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  isDocsSiteIdentityOptIn,
} from "@/lib/site-identity-storage";
import { customIdentityBarCopy } from "@/components/i18n/custom-identity-bar-copy";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  };
}

function readOptIn(): boolean {
  return isDocsSiteIdentityOptIn();
}

function readHasSheet(): boolean {
  return Boolean(window.localStorage.getItem(docsSiteCustomStorageKey()));
}

function CustomIdentityBar() {
  const optedIn = useSyncExternalStore(subscribe, readOptIn, () => false);
  const current = useIdentity();
  const hasSheet = useSyncExternalStore(subscribe, readHasSheet, () => false);
  if (!optedIn) return null;
  if (isNamedIdentityId(current) || (current !== CUSTOM_IDENTITY_ID && !hasSheet)) return null;
  return (
    <Stack
      data-slot="custom-identity-bar"
      direction="horizontal"
      gap={2}
      role="status"
      className="items-center border-b border-border bg-muted/40 px-4 py-2"
    >
      <Badge variant="secondary">{customIdentityBarCopy.badge}</Badge>
      <Text className="text-muted-foreground">{customIdentityBarCopy.status}</Text>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="ms-auto shrink-0"
        onClick={() => {
          discardCustomIdentity(DOCS_SITE_IDENTITY_STORAGE_KEY);
          clearDocsSiteIdentity();
          applyIdentity(DEFAULT_IDENTITY, DOCS_SITE_IDENTITY_STORAGE_KEY);
        }}
      >
        {customIdentityBarCopy.backToDefault}
      </Button>
    </Stack>
  );
}

export { CustomIdentityBar };
