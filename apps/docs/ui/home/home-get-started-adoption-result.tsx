"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SMALL_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { dlxRunner, packageAddCommand, packageManagers, type PackageManager } from "@/lib/package-manager-commands";
import { registryShadcnGithubCommand } from "@/lib/registry-shadcn-github-command";
import { HomeCopyableCommand } from "@/ui/home/home-copyable-command";
import {
  HomeGetStartedMethodTabs,
  HomeGetStartedPackageManager,
  HomeGetStartedPathTabs,
  type HomeGetStartedMethod,
  type HomeGetStartedPath,
} from "@/ui/home/home-get-started-adoption-panels";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const { adoption } = homeCopy.getStarted;

/** What each view shows: the thing to copy, its labels, and the matching import. */
function viewContent(
  view: "package" | HomeGetStartedMethod,
  pm: PackageManager,
  packageName: string,
  brick: string,
  source: string,
) {
  if (view === "package") {
    return {
      value: packageAddCommand(pm, packageName),
      ariaLabel: adoption.ariaPackageInstall,
      copyLabel: adoption.copyPackageInstall,
      hint: adoption.npmHint,
      importLine: adoption.importNpm,
      fullSetup: adoption.fullSetupNpm,
    };
  }
  const registry = { importLine: adoption.importRegistry, fullSetup: adoption.fullSetupRegistry };
  if (view === "cli") {
    return {
      ...registry,
      value: registryShadcnGithubCommand(brick, dlxRunner(pm)),
      ariaLabel: adoption.ariaRegistryInstall,
      copyLabel: adoption.copyRegistryInstall,
      hint: adoption.registryHint,
    };
  }
  return {
    ...registry,
    value: source,
    ariaLabel: adoption.ariaSource,
    copyLabel: adoption.copySource,
    hint: adoption.sourceHint,
  };
}

export function HomeGetStartedAdoptionResult({
  packageName,
  brick,
  source,
}: {
  packageName: string;
  brick: string;
  /** The brick's source file, as the CLI writes it. */
  source: string;
}) {
  const [path, setPath] = useState<HomeGetStartedPath>("package");
  const [method, setMethod] = useState<HomeGetStartedMethod>("cli");
  const [pm, setPm] = useState<PackageManager>(packageManagers[0]);
  const view = path === "package" ? "package" : method;
  const command = viewContent(view, pm, packageName, brick, source);

  return (
    <Stack
      gap={HOME_CARD_CONTENT_GAP}
      id="install-or-copy"
      className="scroll-mt-24"
      data-home-get-started-path=""
    >
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {adoption.lead}
      </Text>
      <Stack gap={3} className="min-w-0">
        <HomeGetStartedPathTabs path={path} onPath={setPath} />
        {path === "registry" ? <HomeGetStartedMethodTabs method={method} onMethod={setMethod} /> : null}
        {view === "manual" ? null : <HomeGetStartedPackageManager pm={pm} onPm={setPm} />}
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS} data-home-path-hint="">
          {command.hint}
        </Text>
        <HomeCopyableCommand
          value={command.value}
          ariaLabel={command.ariaLabel}
          copyLabel={command.copyLabel}
          multiline={view === "manual"}
        />
        <div
          role="region"
          className={`${HOME_SMALL_TEXT_CLASS} overflow-x-auto rounded-md border border-border/80 bg-muted/20 p-3 font-mono`}
          aria-label={adoption.importRegionAriaLabel}
          data-home-import=""
        >
          {command.importLine}
        </div>
        <Button type="button" tabIndex={-1} className="w-fit" data-home-get-started-result="">
          {adoption.save}
        </Button>
        <Text className={HOME_METADATA_TEXT_CLASS}>
          <Link href="/docs/getting-started" className="underline-offset-4 hover:underline" data-home-full-setup="">
            {command.fullSetup}
          </Link>
        </Text>
      </Stack>
    </Stack>
  );
}
