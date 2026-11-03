import { PACKAGE_MANAGERS } from "./package-managers.mjs";

/** Package managers offered next to every install or CLI command on the docs site. */
export const packageManagers = PACKAGE_MANAGERS;

export type PackageManager = (typeof packageManagers)[number];
