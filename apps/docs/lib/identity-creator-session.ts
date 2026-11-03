import type { IdentityTokens } from "@zedtech/zedkit-ui";

import type { AssistantResult, ReferenceReport, Turn } from "./identity-assistant.ts";

/**
 * The conversation with the identity assistant, as a reducer.
 *
 * The rules that keep a slow network from rewriting the visitor's work live here, not in the component:
 * one request in flight at a time (a second submit is ignored); an answer is used only if it answers the request
 * that is still pending (a late answer to a cancelled or superseded request is dropped); an answer is a
 * `proposal` the visitor accepts or discards, never applied by itself; and the last proposal stays put while the
 * next one loads or fails. The accepted exchanges (`thread`) are what the service is given as history, so a
 * discarded proposal never reads as something that happened.
 */

export type Proposal = {
  requestId: string;
  prompt: string;
  tokens: IdentityTokens;
  summary: string;
  changed: string[];
};

/** A refusal or failure to word, or a cancellation. Never `ok`. */
export type Notice = Exclude<AssistantResult, { kind: "ok" }> | { kind: "cancelled" };

export type SessionState = {
  thread: Turn[];
  pending: { requestId: string; prompt: string } | null;
  proposal: Proposal | null;
  notice: Notice | null;
  /** What the last answer reported about each reference page: used (text only) or failed, and why. */
  references: ReferenceReport[];
};

export type SessionAction =
  | { type: "submit"; requestId: string; prompt: string }
  | { type: "result"; requestId: string; result: AssistantResult }
  | { type: "cancel" }
  | { type: "accept" }
  | { type: "discard" }
  | { type: "reset" };

export const initialSession: SessionState = { thread: [], pending: null, proposal: null, notice: null, references: [] };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "submit":
      // A double click, a second tab key, a retry before the answer: one paid request at a time.
      if (state.pending) return state;
      return { ...state, pending: { requestId: action.requestId, prompt: action.prompt.trim() }, notice: null };
    case "result": {
      if (!state.pending || state.pending.requestId !== action.requestId) return state;
      const { result } = action;
      const base = { ...state, pending: null };
      if (result.kind === "ok") {
        return {
          ...base,
          notice: null,
          references: result.references,
          proposal: { requestId: state.pending.requestId, prompt: state.pending.prompt, tokens: result.tokens, summary: result.summary, changed: result.changed },
        };
      }
      const references = "references" in result ? result.references : state.references;
      return { ...base, notice: result, references };
    }
    case "cancel":
      return state.pending ? { ...state, pending: null, notice: { kind: "cancelled" } } : state;
    case "accept":
      if (!state.proposal) return state;
      return {
        ...state,
        proposal: null,
        thread: [
          ...state.thread,
          { role: "user" as const, text: state.proposal.prompt },
          { role: "assistant" as const, text: state.proposal.summary || "Changes applied." },
        ].slice(-12),
      };
    case "discard":
      return state.proposal ? { ...state, proposal: null } : state;
    case "reset":
      return initialSession;
  }
}
