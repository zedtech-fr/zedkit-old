/** shadcn CLI add URL for a published registry brick (same formula as component pages). */
export function registryShadcnAddCommand(siteUrl: string, brick: string, runner = "npx"): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${runner} shadcn@latest add ${base}/r/${brick}.json`;
}

/** Register the docs-hosted namespace so composed bricks resolve `@zedkit/*` siblings. */
export function registryShadcnNamespaceCommand(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `npx shadcn@latest registry add @zedkit=${base}/r/{name}.json`;
}
