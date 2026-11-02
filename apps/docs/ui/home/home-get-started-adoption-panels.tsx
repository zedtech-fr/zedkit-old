"use client";

import { Button, Stack } from "@zedtech/zedkit-ui";
import { packageManagers, type PackageManager } from "@/lib/package-manager-commands";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const { adoption } = homeCopy.getStarted;

export type HomeGetStartedPath = "package" | "registry";
export type HomeGetStartedMethod = "cli" | "manual";

const PATHS: readonly { value: HomeGetStartedPath; label: string }[] = [
  { value: "package", label: adoption.pathPackage },
  { value: "registry", label: adoption.pathRegistry },
];

const METHODS: readonly { value: HomeGetStartedMethod; label: string }[] = [
  { value: "cli", label: adoption.methodCli },
  { value: "manual", label: adoption.methodManual },
];

function ChoiceTabs<T extends string>({
  items,
  value,
  onValue,
  ariaLabel,
}: {
  items: readonly { value: T; label: string }[];
  value: T;
  onValue: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <Button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          variant={value === item.value ? "secondary" : "ghost"}
          size="sm"
          className="min-h-11"
          onClick={() => onValue(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );
}

export function HomeGetStartedPathTabs({
  path,
  onPath,
}: {
  path: HomeGetStartedPath;
  onPath: (path: HomeGetStartedPath) => void;
}) {
  return <ChoiceTabs items={PATHS} value={path} onValue={onPath} ariaLabel={adoption.pathTabsAriaLabel} />;
}

/** Second choice under "Copy": run the CLI, or paste the file yourself. */
export function HomeGetStartedMethodTabs({
  method,
  onMethod,
}: {
  method: HomeGetStartedMethod;
  onMethod: (method: HomeGetStartedMethod) => void;
}) {
  return <ChoiceTabs items={METHODS} value={method} onValue={onMethod} ariaLabel={adoption.registryMethodAriaLabel} />;
}

/** Not tabs: it picks the flavour of one command, so it stays out of the tablists. */
export function HomeGetStartedPackageManager({
  pm,
  onPm,
}: {
  pm: PackageManager;
  onPm: (pm: PackageManager) => void;
}) {
  return (
    <Stack direction="horizontal" gap={1} className="flex-wrap" role="group" aria-label={adoption.packageManagerAriaLabel}>
      {packageManagers.map((name) => (
        <Button
          key={name}
          type="button"
          aria-pressed={pm === name}
          variant="ghost"
          size="sm"
          className="min-h-11 font-mono"
          onClick={() => onPm(name)}
        >
          {name}
        </Button>
      ))}
    </Stack>
  );
}
