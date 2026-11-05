"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Field,
  FieldLabel,
  Heading,
  Input,
  Stack,
  Text,
  cn,
  identityContrastTokenLabel,
  type IdentityContrastWarning,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { LIGHT_KEYS, SCALAR_KEYS } from "@/lib/identity-editor-search";

const DRAFT_ID = "draft";
const DRAFT_SELECTOR = `[data-identity-scope][data-identity="${DRAFT_ID}"]`;

/** `H S% L%` triplets, the format the colour tokens use. */
const HSL_TRIPLET = /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/;

function TokenField({
  id,
  label,
  value,
  onChange,
  swatch,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  swatch?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const colour = swatch && HSL_TRIPLET.test(draft.trim()) ? `hsl(${draft.trim()})` : null;
  return (
    // shortcut: 7rem clears the docs header; the draft lives in its own column on desktop and is compact on a phone.
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Stack direction="horizontal" gap={2} className="min-w-0">
        {swatch ? (
          <svg
            aria-hidden="true"
            data-token-swatch=""
            className="size-control-height shrink-0 rounded-md border border-border"
          >
            <rect width="100%" height="100%" fill={colour ?? "none"} />
          </svg>
        ) : null}
        <Input
          id={id}
          value={draft}
          // The focused input is what the browser scrolls into view, so the margin lives here: 7rem clears the
          // docs header, and a phone with a pinned preview card also clears the card (about 237px).
          className="min-w-0 flex-1 scroll-mt-28 max-lg:[@media(min-height:48rem)]:scroll-mt-80"
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(event.target.value);
          }}
        />
      </Stack>
    </Field>
  );
}

function FieldGroup({ legend, className, children }: { legend: string; className?: string; children: ReactNode }) {
  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className="mb-3 font-semibold text-foreground">{legend}</legend>
      <Stack className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</Stack>
    </fieldset>
  );
}

const SHAPE_KEYS = ["spacing", "borderWidth", "radius"] as const;
const TYPE_KEYS = ["bodyLeading", "headingLeading", "headingTracking", "labelTracking"] as const;
const DEPTH_KEYS = ["shadowSm", "shadowMd"] as const;

function EditorFields({
  tokens,
  scheme,
  onPatch,
  afterShape,
}: {
  tokens: IdentityTokens;
  scheme: "light" | "dark";
  onPatch: (key: string, value: string) => void;
  /** Rendered right after the first group: what you do once the first adjustment has shown its effect. */
  afterShape?: ReactNode;
}) {
  const pair = tokens[scheme];
  const scalar = (keys: readonly (typeof SCALAR_KEYS)[number][]) =>
    keys.map((key) => (
      <TokenField
        key={key}
        id={`identity-editor-${key}`}
        label={identityEditorCopy.fields.scalar[key]}
        value={tokens[key]}
        onChange={(value) => onPatch(key, value)}
      />
    ));
  return (
    <Stack gap={5} data-slot="identity-editor-fields">
      <FieldGroup legend={identityEditorCopy.fields.groups.shape}>{scalar(SHAPE_KEYS)}</FieldGroup>
      {afterShape}
      <FieldGroup legend={identityEditorCopy.fields.groups.type}>{scalar(TYPE_KEYS)}</FieldGroup>
      <FieldGroup legend={identityEditorCopy.fields.groups.depth}>{scalar(DEPTH_KEYS)}</FieldGroup>
      <FieldGroup legend={identityEditorCopy.fields.groups.colour(scheme)}>
        {LIGHT_KEYS.map((key) => (
          <TokenField
            key={key}
            id={`identity-editor-${key}`}
            label={identityEditorCopy.fields.light[key]}
            value={pair[key]}
            swatch
            onChange={(value) => onPatch(key, value)}
          />
        ))}
      </FieldGroup>
    </Stack>
  );
}

/** The specimen's content: samples of the look, never commands (the caller makes it `inert`). */
function SpecimenBody() {
  const copy = identityEditorCopy.fields.draft;
  return (
    <>
      <Stack direction="horizontal" gap={2} className="justify-between">
        <Heading level={2} typeRole="band">
          {identityEditorCopy.fields.draftTitle}
        </Heading>
        <Badge variant="success">{copy.status}</Badge>
      </Stack>
      <Text variant="muted" typeRole="body" className="max-lg:hidden">
        {identityEditorCopy.fields.draftBody}
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap max-lg:gap-1.5">
        <Button size="sm">{identityEditorCopy.fields.draftSave}</Button>
        <Button size="sm" variant="secondary">
          {copy.secondary}
        </Button>
        <Button size="sm" variant="outline" className="max-lg:hidden">
          {copy.outline}
        </Button>
        <Button size="sm" variant="outline" className="text-destructive max-lg:hidden">
          {copy.destructive}
        </Button>
      </Stack>
      <Field className="max-lg:[&_input]:min-h-10">
        <FieldLabel htmlFor="identity-editor-sample">{copy.inputLabel}</FieldLabel>
        <Input id="identity-editor-sample" defaultValue={copy.inputValue} />
      </Field>
      <Stack gap={3} className="hidden lg:flex">
        <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 rounded-lg border border-border p-3">
          {copy.rows.map(([term, detail]) => (
            <Fragment key={term}>
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="m-0">{detail}</dd>
            </Fragment>
          ))}
        </dl>
        <Alert>
          <AlertTitle>{copy.alertTitle}</AlertTitle>
          <AlertDescription>{copy.alertBody}</AlertDescription>
        </Alert>
      </Stack>
    </>
  );
}

function DraftCard({ darkPreview }: { darkPreview: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.classList.toggle("dark", darkPreview);
  }, [darkPreview]);
  return (
    <Stack
      ref={ref}
      data-identity-scope=""
      data-identity={DRAFT_ID}
      data-slot="identity-editor-preview"
      role="group"
      aria-label={identityEditorCopy.fields.specimenLabel}
      className="z-20 min-w-0 rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-md max-lg:order-3 max-lg:gap-2 max-lg:p-3 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:self-start lg:p-6 max-lg:[@media(min-height:48rem)]:sticky max-lg:[@media(min-height:48rem)]:top-14"
      gap={3}
    >
      {/* `inert`: the specimen is for looking at. It must not read as, or act as, an editor command. */}
      <Stack gap={3} inert className="max-lg:gap-2">
        <SpecimenBody />
      </Stack>
      <Text variant="muted" typeRole="label" className="max-lg:hidden">
        {identityEditorCopy.fields.specimenNote}
      </Text>
    </Stack>
  );
}

function ContrastChips({
  warnings,
  onFix,
}: {
  warnings: IdentityContrastWarning[];
  onFix: (warning: IdentityContrastWarning) => void;
}) {
  if (warnings.length === 0) return null;
  return (
    <Stack gap={2} role="status">
      {warnings.map((warning) => {
        const label = identityContrastTokenLabel(warning.token);
        return (
          <Stack key={`${warning.scheme}-${warning.token}`} direction="horizontal" gap={2}>
            <Badge variant="warning">
              {identityEditorCopy.fields.contrastBadge(warning.scheme, label, warning.ratio, warning.min)}
            </Badge>
            <Button type="button" size="sm" variant="outline" onClick={() => onFix(warning)}>
              {identityEditorCopy.fields.fix(warning.scheme, label)}
            </Button>
          </Stack>
        );
      })}
    </Stack>
  );
}

export { ContrastChips, DRAFT_SELECTOR, DraftCard, EditorFields };
