"use client";

import { useId, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  CardContent,
  CardHeader,
  Heading,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";
import { HomeIdentityExampleMistControls } from "@/ui/home/home-identity-example-mist-controls";
import { HomeIdentityExampleMistMembers } from "@/ui/home/home-identity-example-mist-members";

const copy = homeIdentityExamplesCopy.mist;

type Settings = { workspace: string; region: string; alerts: boolean };

const INITIAL: Settings = { workspace: copy.workspaceValue, region: copy.regionValue, alerts: true };

/** Editable settings with a saved baseline: Save keeps them, Discard returns to the last save. */
function useProjectSettings() {
  const [current, setCurrent] = useState<Settings>(INITIAL);
  const [saved, setSaved] = useState<Settings>(INITIAL);
  const [status, setStatus] = useState("");
  const dirty = (Object.keys(current) as (keyof Settings)[]).some((key) => current[key] !== saved[key]);
  return {
    current,
    message: status || (dirty ? copy.unsaved : ""),
    edit: <K extends keyof Settings>(key: K) => (value: Settings[K]) => {
      setCurrent((prev) => ({ ...prev, [key]: value }));
      setStatus("");
    },
    save() {
      setSaved(current);
      setStatus(copy.saved);
    },
    discard() {
      setCurrent(saved);
      setStatus(copy.discarded);
    },
  };
}

/** Save is the one primary action; Discard is its quiet pair. Deleting lives apart (see `DeleteProject`). */
function ProjectActions({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Button type="button" onClick={onSave}>
        {copy.save}
      </Button>
      <Button type="button" variant="secondary" onClick={onDiscard}>
        {copy.discard}
      </Button>
    </Stack>
  );
}

/** The destructive action sits below a divider, outlined, and confirms before it does anything. */
function DeleteProject({ deleted, onDeleted }: { deleted: boolean; onDeleted: (value: boolean) => void }) {
  return (
    <div className="border-t border-border pt-4">
      {deleted ? (
        <Button type="button" variant="outline" onClick={() => onDeleted(false)}>
          {copy.restore}
        </Button>
      ) : (
        <ConfirmDialog
          trigger={
            <Button type="button" variant="outline" className="text-destructive">
              {copy.destroy}
            </Button>
          }
          title={copy.deleteTitle}
          description={copy.deleteDescription}
          confirmLabel={copy.deleteConfirm}
          onConfirm={() => onDeleted(true)}
        />
      )}
    </div>
  );
}

export function HomeIdentityExampleMist() {
  const workspaceId = useId();
  const regionId = useId();
  const alertsId = useId();
  const settings = useProjectSettings();
  const [deleted, setDeleted] = useState(false);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <Stack direction="horizontal" gap={2} className="items-start justify-between">
          <Stack gap={1} className="min-w-0">
            <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
              {copy.heading}
            </Heading>
            <Text variant="muted">{copy.description}</Text>
          </Stack>
          <Badge variant={deleted ? "secondary" : "success"}>{deleted ? copy.deleted : copy.status}</Badge>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack gap={4} className="min-w-0">
          <HomeIdentityExampleMistControls
            workspaceId={workspaceId}
            regionId={regionId}
            alertsId={alertsId}
            workspace={settings.current.workspace}
            region={settings.current.region}
            alerts={settings.current.alerts}
            onWorkspace={settings.edit("workspace")}
            onRegion={settings.edit("region")}
            onAlerts={settings.edit("alerts")}
          />
          <ProjectActions onSave={settings.save} onDiscard={settings.discard} />
          <Text variant="muted" role="status" data-home-identity-status="">
            {deleted ? copy.deletedMessage : settings.message}
          </Text>
          <HomeIdentityExampleMistMembers />
          <Alert>
            <AlertTitle>{copy.alertTitle}</AlertTitle>
            <AlertDescription>{copy.alertBody}</AlertDescription>
          </Alert>
          <DeleteProject deleted={deleted} onDeleted={setDeleted} />
        </Stack>
      </CardContent>
    </Card>
  );
}
