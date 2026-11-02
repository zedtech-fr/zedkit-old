"use client";

import { useId, useState } from "react";
import {
  Button,
  Input,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Switch,
  Text,
} from "@zedtech/zedkit-ui";
import { DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroApp.settings;

type Draft = { name: string; region: string; digest: boolean };

/** Any edit clears the "Saved" note: it only ever describes what is on screen. */
function useDraft() {
  const [draft, setDraft] = useState<Draft>({ name: copy.workspaceValue, region: "eu", digest: true });
  const [saved, setSaved] = useState(false);
  const edit = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };
  return { draft, saved, edit, save: () => setSaved(true) };
}

function RegionField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <Stack gap={1}>
      <Label htmlFor={id}>{copy.region}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eu">{copy.regions.eu}</SelectItem>
          <SelectItem value="us">{copy.regions.us}</SelectItem>
        </SelectContent>
      </Select>
    </Stack>
  );
}

export function HeroSettingsPage() {
  const nameId = useId();
  const regionId = useId();
  const digestId = useId();
  const { draft, saved, edit, save } = useDraft();
  return (
    <Stack gap={4} className="min-w-0">
      <PageHeader titleAs="h2" title={copy.title} description={copy.description} className="mb-0" />
      <Stack gap={4} className="max-w-md min-w-0" data-hero-block="" data-beat={1}>
        <Stack gap={1}>
          <Label htmlFor={nameId}>{copy.workspace}</Label>
          <Input id={nameId} value={draft.name} onChange={(event) => edit({ name: event.target.value })} />
        </Stack>
        <RegionField id={regionId} value={draft.region} onChange={(region) => edit({ region })} />
        <Stack direction="horizontal" gap={3} className="items-center justify-between">
          <Stack gap={1} className="min-w-0">
            <Label htmlFor={digestId}>{copy.digest}</Label>
            <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
              {copy.digestHelp}
            </Text>
          </Stack>
          <Switch id={digestId} checked={draft.digest} onCheckedChange={(digest) => edit({ digest })} data-hero-switch="" />
        </Stack>
        <Stack direction="horizontal" gap={3} className="items-center">
          <Button type="button" onClick={save}>
            {copy.save}
          </Button>
          <Text variant="muted" role="status" className="text-sm empty:hidden">
            {saved ? copy.saved : ""}
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
