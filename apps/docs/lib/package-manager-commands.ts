/** Package managers offered next to every install or CLI command on the docs site. */
export const packageManagers = ["pnpm", "npm", "yarn"] as const;

export type PackageManager = (typeof packageManagers)[number];

const ADD: Record<PackageManager, string> = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
};

/** One-off runner, as shadcn docs write it (`pnpm dlx`, `npx`, `yarn dlx`). */
const DLX: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
};

export function packageAddCommand(pm: PackageManager, pkg: string): string {
  return `${ADD[pm]} ${pkg}`;
}

export function dlxRunner(pm: PackageManager): string {
  return DLX[pm];
}
