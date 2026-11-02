/** shadcn GitHub registry shorthand (same bricks as `/r/<brick>.json` on the docs site). */
export function registryShadcnGithubCommand(brick: string, runner = "npx"): string {
  return `${runner} shadcn@latest add zedtech-fr/zedkit/${brick}`;
}
