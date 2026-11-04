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

import { fetchAssistantStatus, type AssistantStatus } from "@/lib/identity-assistant";
import { initialSession, sessionReducer, type SessionAction, type SessionState } from "@/lib/identity-creator-session";
import { readIdentityDockPersist, writeIdentityDockPersist, clearIdentityDockPersist } from "@/lib/identity-dock-persist";
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
  expanded: boolean;
  setExpanded: (open: boolean) => void;
  toggleExpanded: () => void;
  ensureAssistantStatus: () => () => void;
};

const IdentityAssistantStoreContext = createContext<IdentityAssistantStore | null>(null);

function IdentityAssistantStoreProvider({ children }: { children: ReactNode }) {
  const boot = useMemo(() => readIdentityDockPersist(), []);
  const [session, dispatch] = useReducer(sessionReducer, boot.session ?? initialSession);
  const [brief, setBrief] = useState(boot.brief ?? "");
  const [previewTokens, setPreviewTokens] = useState<IdentityTokens | null>(boot.previewTokens ?? null);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const live = useRef({ thread: session.thread });
  const { submit, cancel } = useAssistantNetwork(dispatch, setStatus, live);

  useEffect(() => {
    live.current.thread = session.thread;
  }, [session.thread]);

  useEffect(() => {
    const empty =
      brief === "" &&
      session.thread.length === 0 &&
      session.proposal === null &&
      session.pending === null &&
      session.notice === null &&
      session.references.length === 0 &&
      previewTokens === null;
    if (empty) {
      clearIdentityDockPersist();
      return;
    }
    writeIdentityDockPersist({ session, brief, ...(previewTokens ? { previewTokens } : {}) });
  }, [session, brief, previewTokens]);

  const ensureAssistantStatus = useCallback(() => {
    const stop = new AbortController();
    void fetchAssistantStatus({ signal: stop.signal }).then(setStatus);
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
      expanded,
      setExpanded,
      toggleExpanded,
      ensureAssistantStatus,
    }),
    [session, status, submit, cancel, brief, previewTokens, expanded, toggleExpanded, ensureAssistantStatus],
  );

  return <IdentityAssistantStoreContext.Provider value={value}>{children}</IdentityAssistantStoreContext.Provider>;
}

function useIdentityAssistantStore(): IdentityAssistantStore {
  const store = useContext(IdentityAssistantStoreContext);
  if (!store) throw new Error("useIdentityAssistantStore requires IdentityAssistantStoreProvider");
  return store;
}

export { IdentityAssistantStoreProvider, useIdentityAssistantStore };
