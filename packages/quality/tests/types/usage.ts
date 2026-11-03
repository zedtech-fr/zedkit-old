import type { Linter } from "eslint";
import { defineLayers, nodePreset, uiPreset } from "#index.mjs";

// Exercises the shipped .d.mts: this file must typecheck.
export const preset: Linter.Config[] = uiPreset({ entryPoint: "/repo/app/globals.css" });

export const node: Linter.Config[] = nodePreset({ tryCatchSource: "@acme/core" });

export const layers: Linter.Config[] = defineLayers({
  kitPackage: "@acme/ui",
  viewDirs: ["app/**/ui/**"],
  dataDirs: ["lib/**"],
  actionPatterns: ["@/lib/*"],
  extraPatterns: {
    kitScope: [{ group: ["payload"], message: "no payload core here" }],
  },
});

export const featureFolders: Linter.Config[] = defineLayers({
  preset: "feature-folders",
  kitPackage: "@acme/ui",
  featureRoot: "features",
  extraPatterns: {
    model: [{ group: ["../..", "../../*"], message: "no deep relative" }],
  },
});
