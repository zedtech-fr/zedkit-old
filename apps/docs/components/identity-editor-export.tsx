"use client";

import { useState } from "react";
import {
  Button,
  ConfirmDialog,
  Field,
  FieldLabel,
  Heading,
  Stack,
  Text,
  Textarea,
  identityContrastWarnings,
  tokensToCss,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { parseRecipe, serializeRecipe } from "@/lib/identity-recipe";

function copyText(value: string, onDone: () => void) {
  const clipboard = navigator.clipboard;
  if (!clipboard) return;
  clipboard.writeText(value).then(onDone, () => {});
}

function CopyButton({
  label,
  value,
  blocked,
  onCopied,
}: {
  label: string;
  value: string;
  blocked: boolean;
  onCopied: () => void;
}) {
  const trigger = (
    <Button type="button" variant="outline">
      {label}
    </Button>
  );
  if (!blocked) {
    return (
      <Button type="button" variant="outline" onClick={() => copyText(value, onCopied)}>
        {label}
      </Button>
    );
  }
  return (
    <ConfirmDialog
      trigger={trigger}
      title={identityEditorCopy.export.contrastTitle}
      description={identityEditorCopy.export.contrastDescription}
      confirmLabel={identityEditorCopy.export.confirmLabel}
      onConfirm={() => copyText(value, onCopied)}
    />
  );
}

function RecipeImport({ onLoad }: { onLoad: (tokens: IdentityTokens, darkKept: readonly string[]) => void }) {
  const copy = identityEditorCopy.export;
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "loaded" | { error: string }>("idle");
  function load() {
    const result = parseRecipe(text);
    if (!result.ok) {
      const reason = result.reason === "not-json" ? copy.importNotJson : `${result.reason.path} (${result.reason.message}).`;
      setState({ error: copy.importInvalid(reason) });
      return;
    }
    onLoad(result.tokens, result.darkKept);
    setState("loaded");
  }
  return (
    <Stack gap={3} data-slot="identity-editor-import">
      <Heading level={2} className="text-lg">
        {copy.importTitle}
      </Heading>
      <Field>
        <FieldLabel htmlFor="identity-editor-import">{copy.importLabel}</FieldLabel>
        <Textarea
          id="identity-editor-import"
          value={text}
          className="font-mono"
          aria-describedby={typeof state === "object" ? "identity-editor-import-hint identity-editor-import-error" : "identity-editor-import-hint"}
          aria-invalid={typeof state === "object"}
          onChange={(event) => {
            setText(event.target.value);
            setState("idle");
          }}
        />
        <Text id="identity-editor-import-hint" variant="muted">
          {copy.importHint}
        </Text>
      </Field>
      <Button type="button" variant="outline" className="w-fit" onClick={load} disabled={text.trim() === ""}>
        {copy.importAction}
      </Button>
      {state === "loaded" ? <Text role="status">{copy.importLoaded}</Text> : null}
      {typeof state === "object" ? <Text id="identity-editor-import-error" role="alert" className="text-destructive">
          {state.error}
        </Text> : null}
    </Stack>
  );
}

function IdentityEditorExport({
  tokens,
  onLoad,
}: {
  tokens: IdentityTokens;
  onLoad: (tokens: IdentityTokens, darkKept: readonly string[]) => void;
}) {
  const css = tokensToCss(tokens, ":root");
  const json = serializeRecipe(tokens);
  const [copied, setCopied] = useState<"css" | "json" | null>(null);
  const blocked = identityContrastWarnings(tokens).length > 0;

  function mark(kind: "css" | "json") {
    setCopied(kind);
  }

  return (
    <Stack gap={3} data-slot="identity-editor-export">
      <Heading level={2} className="text-lg">
        {identityEditorCopy.export.scopeTitle}
      </Heading>
      <Text variant="muted">{identityEditorCopy.export.scope}</Text>
      {blocked ? (
        <Text role="status" variant="muted">
          {identityEditorCopy.export.blocked}
        </Text>
      ) : null}
      <Field>
        <FieldLabel htmlFor="identity-editor-css">{identityEditorCopy.export.css}</FieldLabel>
        <Textarea id="identity-editor-css" readOnly value={css} className="font-mono" />
      </Field>
      <CopyButton label={identityEditorCopy.export.copyCss} value={css} blocked={blocked} onCopied={() => mark("css")} />
      <Field>
        <FieldLabel htmlFor="identity-editor-json">{identityEditorCopy.export.json}</FieldLabel>
        <Textarea id="identity-editor-json" readOnly value={json} className="font-mono" />
      </Field>
      <CopyButton label={identityEditorCopy.export.copyJson} value={json} blocked={blocked} onCopied={() => mark("json")} />
      {copied ? <Text role="status">{identityEditorCopy.export.copied(copied)}</Text> : null}
      <RecipeImport onLoad={onLoad} />
    </Stack>
  );
}

export { IdentityEditorExport };
