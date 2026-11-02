import { DOCS_TYPE_H3_CLASS } from "@/lib/docs-type-roles";

/**
 * Home page rhythm constants. Vertical section rhythm comes from the kit
 * section spacing scale (full-bleed bands); these constants cover the gaps
 * and card grids inside each band.
 */
export const HOME_SECTION_CONTENT_GAP = 4;
export const HOME_CARD_CONTENT_GAP = 3;

export const HOME_CARD_GRID_TWO_COL = "grid min-w-0 gap-4 md:grid-cols-2";
/**
 * The two-step grids step at `sm`, not `md`: fumadocs' prebuilt CSS defines
 * its own `md:grid-cols-2` later in the shared utilities layer, which would
 * shadow the `xl` step on any element carrying both. Track counts are pinned
 * by the "home bands" e2e test in tests/home-layout.spec.ts.
 */
export const HOME_CARD_GRID_THREE_COL = "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3";
export const HOME_CARD_GRID_FOUR_COL = "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4";

/** Soft enter animation; static when prefers-reduced-motion (kit motion tokens). */
export const HOME_SECTION_REVEAL_CLASS =
  "motion-safe:animate-[zk-fade-in_var(--motion-base)_var(--ease-enter)]";

/** Min-height hero preview slot while the demo chunk loads; grows with the specimen (no fixed clip). */
export const HOME_HERO_PREVIEW_SHELL_CLASS = "min-h-0 w-full min-w-0";

/** Bounded live preview inside home gallery cards (min height reserves space while lazy chunks load). */
export const HOME_GALLERY_PREVIEW_SHELL_CLASS =
  "min-h-32 w-full min-w-0 overflow-hidden rounded-md border bg-background p-3";

/** Persuasion copy on the home page (maps to `--zk-type-body-*`). */
export const HOME_PERSUASION_TEXT_CLASS = "text-home-persuasion";

/** Secondary counts and labels (maps to `--zk-type-label-*`). */
export const HOME_METADATA_TEXT_CLASS = "home-metadata-copy";

/** Card and band titles under the hero (maps to `--zk-type-h3-*`). */
export const HOME_CARD_TITLE_CLASS = DOCS_TYPE_H3_CLASS;

/** Factual micro-proof under CTAs (maps to `--zk-type-small-*`). */
export const HOME_SMALL_TEXT_CLASS = "text-zk-type-small";

/** Audit L2d: interactive demo should begin within ~1.5 phone screens of the home top. */
export const HOME_MOBILE_INTERACTIVE_DEMO_MAX_TOP_PX = 760;

/** Audit L2 mobile: home page scroll height budget at 390px width (40% shorter vs audit baseline). */
export const HOME_MOBILE_PAGE_MAX_SCROLL_PX = 8000;

/** Marks a subtree whose section intros use the home persuasion scale on mobile. */
export const HOME_MARKETING_ROOT_PROPS = { "data-home-marketing": "" } as const;
