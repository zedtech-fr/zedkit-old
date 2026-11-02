/**
 * Package managers offered next to every install or CLI command on the docs site.
 * Plain ESM so the generator, the clean-project checks and the pages read one table.
 */
/** @type {readonly ["pnpm", "npm", "yarn"]} */
export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn"];

const ADD = { pnpm: "pnpm add", npm: "npm install", yarn: "yarn add" };
const ADD_DEV = { pnpm: "pnpm add -D", npm: "npm install -D", yarn: "yarn add -D" };

/** One-off runner, as shadcn docs write it (`pnpm dlx`, `npx`, `yarn dlx`). */
const DLX = { pnpm: "pnpm dlx", npm: "npx", yarn: "yarn dlx" };

/**
 * @param {"pnpm" | "npm" | "yarn"} pm
 * @param {string | readonly string[]} packages
 * @param {{ dev?: boolean }} [options]
 */
export function addCommand(pm, packages, { dev = false } = {}) {
  const names = typeof packages === "string" ? [packages] : packages;
  return `${(dev ? ADD_DEV : ADD)[pm]} ${names.join(" ")}`;
}

/** @param {"pnpm" | "npm" | "yarn"} pm */
export function dlxRunnerFor(pm) {
  return DLX[pm];
}
