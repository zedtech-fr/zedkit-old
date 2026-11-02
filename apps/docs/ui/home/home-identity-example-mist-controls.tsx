"use client";

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Stack, Switch } from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.mist;

export function HomeIdentityExampleMistControls({
  workspaceId,
  regionId,
  alertsId,
  workspace,
  region,
  alerts,
  onWorkspace,
  onRegion,
  onAlerts,
}: {
  workspaceId: string;
  regionId: string;
  alertsId: string;
  workspace: string;
  region: string;
  alerts: boolean;
  onWorkspace: (value: string) => void;
  onRegion: (value: string) => void;
  onAlerts: (value: boolean) => void;
}) {
  return (
    <Stack gap={3} className="min-w-0 sm:flex-row sm:flex-wrap sm:items-end">
      <Stack gap={1} className="min-w-0 flex-1 basis-full sm:basis-40">
        <Label htmlFor={workspaceId}>{copy.workspaceLabel}</Label>
        <Input
          id={workspaceId}
          value={workspace}
          onChange={(event) => onWorkspace(event.target.value)}
        />
      </Stack>
      <Stack gap={1} className="min-w-0 flex-1 basis-full sm:basis-40">
        <Label htmlFor={regionId}>{copy.regionLabel}</Label>
        <Select value={region} onValueChange={onRegion}>
          <SelectTrigger id={regionId} aria-label={copy.regionLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {copy.regions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>
      <Stack direction="horizontal" gap={2} className="min-h-11 items-center">
        <Switch id={alertsId} checked={alerts} onCheckedChange={onAlerts} />
        <Label htmlFor={alertsId}>{copy.alertsLabel}</Label>
      </Stack>
    </Stack>
  );
}
