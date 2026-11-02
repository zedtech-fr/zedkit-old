import { PACKAGE_MANAGERS, addCommand, dlxRunnerFor } from "./package-managers.mjs";

/** Package managers offered next to every install or CLI command on the docs site. */
export const packageManagers = PACKAGE_MANAGERS;

export type PackageManager = (typeof packageManagers)[number];

export function packageAddCommand(pm: PackageManager, pkg: string): string {
  return addCommand(pm, pkg);
}

/** One-off runner, as shadcn docs write it (`pnpm dlx`, `npx`, `yarn dlx`). */
export function dlxRunner(pm: PackageManager): string {
  return dlxRunnerFor(pm);
}
