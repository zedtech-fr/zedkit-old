"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldLabel,
  identityContrastWarnings,
  identityContrastTokenLabel,
  Input,
  Stack,
  Text,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import {
  requestIdentitySuggest,
  tokenDiff,
  type SuggestProposal,
} from "@/lib/identity-editor-suggest";

function ColourSwatch({ path, value }: { path: string; value: string }) {
  if (!path.startsWith("light.") && !path.startsWith("dark.")) return null;
  return (
    <svg
      data-slot="identity-editor-swatch"
      aria-hidden
      className="size-4 shrink-0 rounded-sm border border-border"
      viewBox="0 0 16 16"
    >
      <rect width="16" height="16" fill={`hsl(${value})`} />
    </svg>
  );
}

function DiffRows({ current, next }: { current: IdentityTokens; next: IdentityTokens }) {
  const rows = tokenDiff(current, next);
  if (rows.length === 0) return <Text>{identityEditorCopy.suggest.noChanges}</Text>;
  return (
    <Stack gap={1} data-slot="identity-editor-suggest-diff">
      {rows.map((row) => (
        <Stack key={row.path} direction="horizontal" gap={2}>
          <Text>{identityEditorCopy.suggest.diffRow(row.path, row.from, row.to)}</Text>
          <ColourSwatch path={row.path} value={row.to} />
        </Stack>
      ))}
    </Stack>
  );
}

function ContrastPreview({ tokens }: { tokens: IdentityTokens }) {
  const warnings = identityContrastWarnings(tokens);
  if (warnings.length === 0) {
    return (
      <Text>{identityEditorCopy.suggest.contrastPassed}</Text>
    );
  }
  return (
    <Stack gap={2} role="status">
      {warnings.map((warning) => {
        const label = identityContrastTokenLabel(warning.token);
        return (
          <Badge key={`${warning.scheme}-${warning.token}`} variant="warning">
            {identityEditorCopy.fields.contrastBadge(warning.scheme, label, warning.ratio, warning.min)}
          </Badge>
        );
      })}
    </Stack>
  );
}

function ProposalCard({
  current,
  proposal,
  applySite,
  onApplySite,
  onApply,
  onDiscard,
}: {
  current: IdentityTokens;
  proposal: SuggestProposal;
  applySite: boolean;
  onApplySite: (value: boolean) => void;
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <Stack gap={2} role="status">
      <Text>{proposal.notice}</Text>
      <ContrastPreview tokens={proposal.tokens} />
      <DiffRows current={current} next={proposal.tokens} />
      <Field>
        <Stack direction="horizontal" gap={2}>
          <Checkbox
            id="identity-editor-suggest-site"
            checked={applySite}
            onCheckedChange={(value) => onApplySite(value === true)}
          />
          <FieldLabel htmlFor="identity-editor-suggest-site">{identityEditorCopy.suggest.applySite}</FieldLabel>
        </Stack>
      </Field>
      <Stack direction="horizontal" gap={2}>
        <Button type="button" onClick={onApply}>
          {identityEditorCopy.suggest.apply}
        </Button>
        <Button type="button" variant="outline" onClick={onDiscard}>
          {identityEditorCopy.suggest.discard}
        </Button>
      </Stack>
    </Stack>
  );
}

function IdentityEditorSuggest({
  tokens,
  onApply,
}: {
  tokens: IdentityTokens;
  onApply: (tokens: IdentityTokens, toSite: boolean) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [applySite, setApplySite] = useState(true);
  const [proposal, setProposal] = useState<SuggestProposal | null>(null);

  function runSuggest() {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    void requestIdentitySuggest(trimmed, tokens).then((result) => {
      setProposal(result);
      setBusy(false);
    });
  }

  return (
    <Stack gap={3} data-slot="identity-editor-suggest">
      <Text variant="muted">{identityEditorCopy.suggest.intro}</Text>
      <Stack gap={2} className="sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="identity-editor-suggest">{identityEditorCopy.suggest.request}</FieldLabel>
          <Input
            id="identity-editor-suggest"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSuggest();
            }}
          />
        </Field>
        <Button type="button" className="sm:shrink-0" onClick={runSuggest} disabled={busy || prompt.trim() === ""}>
          {identityEditorCopy.suggest.suggest}
        </Button>
      </Stack>
      {busy ? <Text role="status">{identityEditorCopy.suggest.suggesting}</Text> : null}
      {proposal ? (
        <ProposalCard
          current={tokens}
          proposal={proposal}
          applySite={applySite}
          onApplySite={setApplySite}
          onApply={() => {
            onApply(proposal.tokens, applySite);
            setProposal(null);
          }}
          onDiscard={() => setProposal(null)}
        />
      ) : null}
    </Stack>
  );
}

export { IdentityEditorSuggest };
