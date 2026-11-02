"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  applyIdentity,
  applyIdentityTokenSheet,
  discardCustomIdentity,
  IDENTITY_CHANGE_EVENT,
  identities,
  identityContrastWarnings,
  identityPresets,
  isNamedIdentityId,
  isPresetId,
  Stack,
  Text,
  type IdentityContrastWarning,
  type IdentityOption,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { ContrastChips, DRAFT_SELECTOR, DraftCard, EditorFields } from "@/components/identity-editor-fields";
import { IdentityEditorExport } from "@/components/identity-editor-export";
import { IdentityEditorSuggest } from "@/components/identity-editor-suggest";
import { IdentityEditorKeepBar, IdentityEditorPreviewBar } from "@/components/identity-editor-toolbar";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { useDraftTokens } from "@/lib/identity-editor-draft";
import {
  deleteNamedIdentity,
  namedIdentityOptions,
  readNamedIdentities,
  renameNamedIdentity,
  saveNamedIdentity,
  subscribeNamedIdentities,
  type NamedIdentity,
} from "@/lib/named-identities";
import { parseIdentityEditorSearch, serializeIdentityEditorSearch } from "@/lib/identity-editor-search";

type EditorBodyProps = {
  identity: string;
  looks: readonly IdentityOption[];
  name: string;
  namedSelected: boolean;
  tokens: IdentityTokens;
  darkPreview: boolean;
  onIdentity: (id: string) => void;
  onName: (value: string) => void;
  onSave: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDark: () => void;
  onReset: () => void;
  onPatch: (key: string, value: string) => void;
  onFix: (warning: IdentityContrastWarning) => void;
  onSuggestApply: (next: IdentityTokens, toSite: boolean) => void;
  onUndo: () => void;
  onLoad: (tokens: IdentityTokens, darkKept: readonly string[]) => void;
  onApplySite: () => void;
  canUndo: boolean;
  appliedSite: boolean;
};

function tokensForLook(id: string, named: NamedIdentity[]): IdentityTokens | undefined {
  if (isPresetId(id)) return identityPresets[id];
  return named.find((item) => item.id === id)?.tokens;
}

function bindNamedLooks(
  named: NamedIdentity[],
  identity: string,
  name: string,
  tokens: IdentityTokens,
  setIdentity: (id: string) => void,
  setName: (label: string) => void,
  remember: (next: IdentityTokens, keep?: readonly string[]) => void,
) {
  return {
    looks: [...identities, ...namedIdentityOptions(named)],
    namedSelected: isNamedIdentityId(identity),
    onIdentity(id: string) {
      setIdentity(id);
      const next = tokensForLook(id, named);
      if (next) remember(next, []);
      setName(named.find((item) => item.id === id)?.label ?? name);
    },
    onSave() {
      const saved = saveNamedIdentity(name, tokens);
      if (!saved) return;
      setIdentity(saved.id);
      setName(saved.label);
    },
    onRename() {
      const saved = renameNamedIdentity(identity, name);
      if (saved) setName(saved.label);
    },
    onDelete() {
      deleteNamedIdentity(identity);
      setIdentity("mist");
      remember(identityPresets.mist, []);
      setName("");
      if (document.documentElement.getAttribute("data-identity") === identity) {
        discardCustomIdentity();
        applyIdentity(DEFAULT_IDENTITY);
      }
    },
    onReset() {
      remember(tokensForLook(identity, named) ?? identityPresets.mist, []);
    },
  };
}

function IdentityEditorBody(props: EditorBodyProps) {
  const scheme = props.darkPreview ? "dark" : "light";
  // The order is the task: choose a look, read the hint, see the card, make the first adjustment, then keep
  // the look. On a phone the card is a flex item placed by `order` between the hint and the adjustments;
  // from `lg` it is the right column and stays in view while the left column scrolls.
  return (
    <Stack gap={6} className="min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start" data-slot="identity-editor">
      <DraftCard darkPreview={props.darkPreview} />
      <Stack gap={6} className="min-w-0 max-lg:contents lg:col-start-1 lg:row-start-1">
        <IdentityEditorPreviewBar
          className="max-lg:order-1"
          identity={props.identity}
          looks={props.looks}
          darkPreview={props.darkPreview}
          canUndo={props.canUndo}
          onIdentity={props.onIdentity}
          onDark={props.onDark}
          onUndo={props.onUndo}
          onReset={props.onReset}
        />
        <Stack gap={2} className="max-lg:order-2">
          <Text>{identityEditorCopy.panel.hint}</Text>
          {props.appliedSite ? <Text role="status">{identityEditorCopy.panel.applied}</Text> : null}
        </Stack>
        <Stack className="empty:hidden max-lg:order-4">
          <ContrastChips warnings={identityContrastWarnings(props.tokens)} onFix={props.onFix} />
        </Stack>
        <Stack className="max-lg:order-5">
          <EditorFields
            tokens={props.tokens}
            scheme={scheme}
            onPatch={props.onPatch}
            afterShape={
              <IdentityEditorKeepBar
                name={props.name}
                namedSelected={props.namedSelected}
                onName={props.onName}
                onSave={props.onSave}
                onRename={props.onRename}
                onDelete={props.onDelete}
                onApplySite={props.onApplySite}
              />
            }
          />
        </Stack>
        <Stack className="max-lg:order-6">
          <IdentityEditorSuggest tokens={props.tokens} onApply={props.onSuggestApply} />
        </Stack>
        <Stack className="max-lg:order-7">
          <IdentityEditorExport tokens={props.tokens} onLoad={props.onLoad} />
        </Stack>
      </Stack>
    </Stack>
  );
}

type FollowSiteIdentityArgs = {
  ready: boolean;
  identity: string;
  tokens: IdentityTokens;
  darkPreview: boolean;
  darkKept: readonly string[];
  named: NamedIdentity[];
  onIdentity: (id: string) => void;
  appliedSite: boolean;
  detachSite: () => void;
};

// Follow identity switches made outside the editor (header chooser,
// another tab): resync fields and URL to the applied look, then stop
// driving the site. The one exception is an unapplied dirty draft —
// the editing session wins over the header there. Adopting goes
// through the same path as the Look select, so Undo keeps the draft.
function useFollowSiteIdentity(args: FollowSiteIdentityArgs) {
  const siteIdentity = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!args.ready) return;
    const sync = () => {
      const applied = document.documentElement.getAttribute("data-identity");
      if (!applied || applied === siteIdentity.current) return;
      const first = siteIdentity.current === null;
      siteIdentity.current = applied;
      if (first || applied === args.identity) return;
      const clean = [...new URLSearchParams(serializeIdentityEditorSearch(args.identity, args.tokens, args.darkPreview, args.darkKept)).keys()]
        .every((key) => key === "identity" || key === "theme");
      if (!clean && !args.appliedSite) return;
      if (tokensForLook(applied, args.named)) args.onIdentity(applied);
      if (args.appliedSite) args.detachSite();
    };
    sync();
    window.addEventListener(IDENTITY_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(IDENTITY_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  });
}

function IdentityEditorPanel() {
  const named = useSyncExternalStore(subscribeNamedIdentities, readNamedIdentities, readNamedIdentities);
  const [identity, setIdentity] = useState("mist");
  const draft = useDraftTokens(identityPresets.mist, identity);
  const [name, setName] = useState("");
  const [darkPreview, setDarkPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const { tokens, darkKept, remember, undo, applySite, detachSite, appliedSite, past, load, patch, fix, applySuggest } = draft;
  const bound = bindNamedLooks(named, identity, name, tokens, setIdentity, setName, remember);

  useLayoutEffect(() => {
    const parsed = parseIdentityEditorSearch(window.location.search);
    setIdentity(parsed.identity);
    load(parsed.tokens, parsed.darkKept);
    const saved = readNamedIdentities().find((item) => item.id === parsed.identity);
    if (saved) setName(saved.label);
    if (parsed.darkPreview) setDarkPreview(true);
    setReady(true);
  }, []);

  useFollowSiteIdentity({ ready, identity, tokens, darkPreview, darkKept, named, onIdentity: bound.onIdentity, appliedSite, detachSite });

  useLayoutEffect(() => {
    if (!ready) return;
    const sheet = applyIdentityTokenSheet(tokens, DRAFT_SELECTOR);
    const query = serializeIdentityEditorSearch(identity, tokens, darkPreview, darkKept);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    return () => {
      sheet.remove();
    };
  }, [darkKept, darkPreview, identity, ready, tokens]);

  return (
    <IdentityEditorBody
      identity={identity}
      name={name}
      tokens={tokens}
      darkPreview={darkPreview}
      {...bound}
      onName={setName}
      onDark={() => setDarkPreview(!darkPreview)}
      onPatch={(key, value) => patch(key, value, darkPreview ? "dark" : "light")}
      onFix={fix}
      onSuggestApply={applySuggest}
      onUndo={undo}
      onLoad={remember}
      onApplySite={applySite}
      canUndo={past.length > 0}
      appliedSite={appliedSite}
    />
  );
}

export { IdentityEditorPanel };
