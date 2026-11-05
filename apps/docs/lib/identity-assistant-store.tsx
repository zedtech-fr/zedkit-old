"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

import { type SpecimenDomain } from "@/lib/brief-specimen-domain";

import type { AssistantStatus } from "@/lib/identity-assistant";
import { initialSession, sessionReducer, type SessionAction, type SessionState } from "@/lib/identity-creator-session";
import {
  clearIdentityDockPersist,
  parsePersistedPreviewTokens,
  readIdentityDockPersist,
  writeIdentityDockPersist,
  type IdentityDockPersistRead,
} from "@/lib/identity-dock-persist";
import { useAssistantNetwork } from "@/lib/use-assistant-network";

type IdentityAssistantStore = {
  session: SessionState;
  dispatch: Dispatch<SessionAction>;
  status: AssistantStatus | null;
  submit: (prompt: string, references: readonly string[], current: IdentityTokens) => void;
  cancel: () => void;
  brief: string;
  setBrief: (value: string) => void;
  previewTokens: IdentityTokens | null;
  setPreviewTokens: (tokens: IdentityTokens | null) => void;
  previewDomain: SpecimenDomain | null;
  setPreviewDomain: (domain: SpecimenDomain | null) => void;
  expanded: boolean;
  setExpanded: (open: boolean) => void;
  toggleExpanded: () => void;
  ensureAssistantStatus: () => () => void;
};

const IdentityAssistantStoreContext = createContext<IdentityAssistantStore | null>(null);

/** Persisted preview tokens are validated async (zod loads on demand); `tokensReady` holds writes until that settles. */
function usePersistedPreviewTokens(boot: IdentityDockPersistRead) {
  const [previewTokens, setPreviewTokens] = useState<IdentityTokens | null>(null);
  const [tokensReady, setTokensReady] = useState(boot.previewTokensRaw === undefined);
  useEffect(() => {
    if (tokensReady) return;
    let alive = true;
    void parsePersistedPreviewTokens(boot.previewTokensRaw).then((tokens) => {
      if (!alive) return;
      if (tokens) setPreviewTokens((current) => current ?? tokens);
      setTokensReady(true);
    });
    return () => {
      alive = false;
    };
  }, [boot, tokensReady]);
  return { previewTokens, setPreviewTokens, tokensReady };
}

function usePersistDock(
  session: SessionState,
  brief: string,
  previewTokens: IdentityTokens | null,
  tokensReady: boolean,
  previewDomain: SpecimenDomain | null,
) {
  useEffect(() => {
    if (!tokensReady) return;
    const empty =
      brief === "" &&
      session.thread.length === 0 &&
      session.proposal === null &&
      session.pending === null &&
      session.notice === null &&
      session.references.length === 0 &&
      previewTokens === null &&
      previewDomain === null;
    if (empty) {
      clearIdentityDockPersist();
      return;
    }
    writeIdentityDockPersist({
      session,
      brief,
      ...(previewTokens ? { previewTokens } : {}),
      ...(previewDomain ? { previewDomain } : {}),
    });
  }, [session, brief, previewTokens, tokensReady, previewDomain]);
}

function IdentityAssistantStoreProvider({ children }: { children: ReactNode }) {
  const boot = useMemo(() => readIdentityDockPersist(), []);
  const [session, dispatch] = useReducer(sessionReducer, boot.session ?? initialSession);
  const [brief, setBrief] = useState(boot.brief ?? "");
  const { previewTokens, setPreviewTokens, tokensReady } = usePersistedPreviewTokens(boot);
  const [previewDomain, setPreviewDomain] = useState<SpecimenDomain | null>(boot.previewDomain ?? null);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const live = useRef({ thread: session.thread });
  const { submit, cancel } = useAssistantNetwork(dispatch, setStatus, live);

  useEffect(() => {
    live.current.thread = session.thread;
  }, [session.thread]);

  usePersistDock(session, brief, previewTokens, tokensReady, previewDomain);

  const ensureAssistantStatus = useCallback(() => {
    const stop = new AbortController();
    void import("@/lib/identity-assistant")
      .then(({ fetchAssistantStatus }) => fetchAssistantStatus({ signal: stop.signal }))
      .then(setStatus);
    return () => stop.abort();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    return ensureAssistantStatus();
  }, [expanded, ensureAssistantStatus]);

  const toggleExpanded = useCallback(() => setExpanded((open) => !open), []);

  const value = useMemo(
    () => ({
      session,
      dispatch,
      status,
      submit,
      cancel,
      brief,
      setBrief,
      previewTokens,
      setPreviewTokens,
      previewDomain,
      setPreviewDomain,
      expanded,
      setExpanded,
      toggleExpanded,
      ensureAssistantStatus,
    }),
    [session, status, submit, cancel, brief, previewTokens, previewDomain, expanded, toggleExpanded, ensureAssistantStatus],
  );

  return <IdentityAssistantStoreContext.Provider value={value}>{children}</IdentityAssistantStoreContext.Provider>;
}

function useIdentityAssistantStore(): IdentityAssistantStore {
  const store = useContext(IdentityAssistantStoreContext);
  if (!store) throw new Error("useIdentityAssistantStore requires IdentityAssistantStoreProvider");
  return store;
}

export { IdentityAssistantStoreProvider, useIdentityAssistantStore };
