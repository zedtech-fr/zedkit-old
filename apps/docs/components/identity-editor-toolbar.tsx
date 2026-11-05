"use client";

import { useId, type ReactNode } from "react";
import {
  Button,
  ConfirmDialog,
  Field,
  FieldLabel,
  Input,
  Stack,
  Text,
  cn,
  identities,
  type IdentityOption,
} from "@zedtech/zedkit-ui";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { ApplySiteRow } from "@/components/identity-apply-site-row";
import type { SaveStatus } from "@/lib/identity-save-status";

function LookSelect({
  identity,
  looks,
  onIdentity,
}: {
  identity: string;
  looks: readonly IdentityOption[];
  onIdentity: (id: string) => void;
}) {
  const options = looks.length > 0 ? looks : identities;
  return (
    <Field className="w-full sm:w-48 sm:shrink-0">
      <FieldLabel htmlFor="identity-editor-look">
        {identityEditorCopy.toolbar.look}
      </FieldLabel>
      <select
        id="identity-editor-look"
        className="h-control-height w-full rounded-md border border-input bg-background px-3 text-control text-foreground focus-ring-control"
        value={identity}
        onChange={(event) => onIdentity(event.target.value)}
      >
        {options.map((look) => (
          <option key={look.id} value={look.id}>
            {look.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Controls that sit on one line align on their bottom edge; a hint never sits inside the row. */
function Row({ children }: { children: ReactNode }) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-end">
      {children}
    </Stack>
  );
}

type PreviewBarProps = {
  identity: string;
  looks: readonly IdentityOption[];
  darkPreview: boolean;
  canUndo: boolean;
  onIdentity: (id: string) => void;
  onDark: () => void;
  onUndo: () => void;
  onReset: () => void;
  className?: string;
};

/** Choose a look and change how the card is seen: the first thing the editor is for. */
function IdentityEditorPreviewBar({
  identity,
  looks,
  darkPreview,
  canUndo,
  onIdentity,
  onDark,
  onUndo,
  onReset,
  className,
}: PreviewBarProps) {
  const copy = identityEditorCopy.toolbar;
  return (
    <Stack
      role="group"
      aria-label={copy.groups.preview}
      data-slot="identity-editor-toolbar"
      className={cn("min-w-0", className)}
    >
      <Row>
        <LookSelect identity={identity} looks={looks} onIdentity={onIdentity} />
        <Button
          type="button"
          variant="outline"
          aria-pressed={darkPreview}
          onClick={onDark}
        >
          {copy.previewDark}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canUndo}
          onClick={onUndo}
        >
          {copy.undo}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          {copy.reset}
        </Button>
      </Row>
    </Stack>
  );
}

function DeleteLook({
  disabled,
  onDelete,
}: {
  disabled: boolean;
  onDelete: () => void;
}) {
  const copy = identityEditorCopy.toolbar;
  return (
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="text-destructive"
        >
          {copy.delete}
        </Button>
      }
      title={copy.deleteTitle}
      description={copy.deleteDescription}
      confirmLabel={copy.deleteConfirm}
      onConfirm={() => {
        onDelete();
        // The trigger is disabled once the look is gone, so the dialog cannot hand focus back to it:
        // land on the Look select instead of the page body (after the dialog's exit has finished).
        window.setTimeout(() => {
          if (document.activeElement === document.body)
            document.getElementById("identity-editor-look")?.focus();
        }, 400);
      }}
    />
  );
}

type KeepBarProps = {
  name: string;
  namedSelected: boolean;
  onName: (value: string) => void;
  onSave: (replace?: boolean) => void;
  onSaveAsNew: () => void;
  onRename: () => void;
  onDelete: () => void;
  onApplySite: () => void;
  onRemoveFromSite: () => void;
  appliedSite: boolean;
  status: SaveStatus | null;
  problem: "unavailable" | "corrupt" | undefined;
  className?: string;
};

/** What a save told the visitor: done, a clash to settle, or why it could not happen. Spoken as a status. */
function SaveFeedback({
  status,
  onSave,
  onSaveAsNew,
}: {
  status: SaveStatus | null;
  onSave: (replace?: boolean) => void;
  onSaveAsNew: () => void;
}) {
  const copy = identityEditorCopy.library;
  if (!status) return <Text role="status" typeRole="label" className="min-h-5" />;
  if (status.kind === "exists") {
    return (
      <Stack gap={2} role="alert" data-slot="identity-editor-clash">
        <Text typeRole="label">{copy.exists(status.label)}</Text>
        <Row>
          <Button type="button" variant="outline" onClick={() => onSave(true)}>
            {copy.replace}
          </Button>
          <Button type="button" variant="outline" onClick={onSaveAsNew}>
            {copy.saveAsNew(status.free)}
          </Button>
        </Row>
      </Stack>
    );
  }
  if (status.kind === "failed")
    return (
      <Text role="alert" typeRole="label" className="text-destructive">
        {copy.failed[status.reason]}
      </Text>
    );
  return (
    <Text role="status" typeRole="label">
      {status.kind === "saved"
        ? copy.saved(status.label)
        : copy.renamed(status.label)}
    </Text>
  );
}

function LibraryHeading({
  id,
  problem,
}: {
  id: string;
  problem: "unavailable" | "corrupt" | undefined;
}) {
  const library = identityEditorCopy.library;
  return (
    <>
      <Text as="span" id={id} typeRole="label" className="font-semibold text-foreground">
        {library.heading}
      </Text>
      <Text variant="muted" typeRole="label">
        {library.hint}
      </Text>
      {problem ? (
        <Text role="status" typeRole="label" className="text-destructive">
          {library.problem[problem]}
        </Text>
      ) : null}
    </>
  );
}

/** Name, save, rename or delete a look, and apply it to this site: what you do once you like the card. */
function IdentityEditorKeepBar({
  name,
  namedSelected,
  onName,
  onSave,
  onSaveAsNew,
  onRename,
  onDelete,
  onApplySite,
  onRemoveFromSite,
  appliedSite,
  status,
  problem,
  className,
}: KeepBarProps) {
  const copy = identityEditorCopy.toolbar;
  const titleId = useId();
  return (
    <Stack
      gap={2}
      role="group"
      aria-labelledby={titleId}
      className={cn("min-w-0", className)}
      data-slot="identity-editor-keep"
    >
      <LibraryHeading id={titleId} problem={problem} />
      <Row>
        <Field className="w-full min-w-36 sm:w-56">
          <FieldLabel htmlFor="identity-editor-name">{copy.name}</FieldLabel>
          <Input
            id="identity-editor-name"
            value={name}
            aria-describedby="identity-editor-name-hint"
            onChange={(event) => onName(event.target.value)}
          />
        </Field>
        <Button
          type="button"
          onClick={() => onSave()}
          disabled={name.trim() === ""}
        >
          {copy.saveLook}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRename}
          disabled={!namedSelected || name.trim() === ""}
        >
          {copy.rename}
        </Button>
        <DeleteLook disabled={!namedSelected} onDelete={onDelete} />
      </Row>
      <Text
        id="identity-editor-name-hint"
        variant="muted"
        typeRole="label"
        className="min-h-5"
      >
        {name.trim() === "" ? copy.nameHint : null}
      </Text>
      <SaveFeedback status={status} onSave={onSave} onSaveAsNew={onSaveAsNew} />
      <ApplySiteRow
        appliedSite={appliedSite}
        onApplySite={onApplySite}
        onRemoveFromSite={onRemoveFromSite}
        hint
      />
    </Stack>
  );
}

export { IdentityEditorKeepBar, IdentityEditorPreviewBar };
