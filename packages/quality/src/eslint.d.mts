import type { Linter } from "eslint";

export interface NodePresetOptions {
  /** Import path shown in the try/catch ban message. Default `@zedtech/zedkit-core`. */
  readonly tryCatchSource?: string;
}

export function nodePreset(options?: NodePresetOptions): Linter.Config[];

export interface UiPresetOptions {
  /** Path to the repo's Tailwind CSS entry. Required, no default. */
  readonly entryPoint: string;
}

export function uiPreset(options: UiPresetOptions): Linter.Config[];

/** A `no-restricted-imports` pattern object, passed through untouched. */
export interface RestrictedImportPattern {
  readonly group: readonly string[];
  readonly message: string;
  readonly importNames?: readonly string[];
  readonly allowTypeImports?: boolean;
}

export type DefineLayersOptions =
  | {
      readonly preset?: undefined;
      /** UI kit specifier (e.g. `@acme/ui`). */
      readonly kitPackage: string;
      /** Minimatch globs for view folders. */
      readonly viewDirs: readonly string[];
      /** Minimatch globs for data-access folders. */
      readonly dataDirs: readonly string[];
      /** Import specifiers for data clients and server actions. May be empty. */
      readonly actionPatterns: readonly string[];
      /**
       * Consumer bans merged into each block's own patterns (flat-config
       * rules replace per key, so a consumer block setting
       * `no-restricted-imports` would otherwise drop these).
       */
      readonly extraPatterns?: {
        readonly kitScope?: readonly RestrictedImportPattern[];
        readonly viewData?: readonly RestrictedImportPattern[];
        readonly dataUi?: readonly RestrictedImportPattern[];
      };
    }
  | {
      readonly preset: "feature-folders";
      /** UI kit specifier (e.g. `@acme/ui`). */
      readonly kitPackage: string;
      /** Feature-folder root (e.g. `features`). Bans apply only under this tree. */
      readonly featureRoot: string;
      readonly extraPatterns?: {
        readonly kitScope?: readonly RestrictedImportPattern[];
        readonly viewData?: readonly RestrictedImportPattern[];
        readonly dataUi?: readonly RestrictedImportPattern[];
        readonly model?: readonly RestrictedImportPattern[];
      };
    };

export function defineLayers(options: DefineLayersOptions): Linter.Config[];
