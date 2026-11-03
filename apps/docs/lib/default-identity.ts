/**
 * Site default for a first-time visitor (nothing stored). Change this one
 * line. The layout script applies it before first paint; choosers mark it;
 * "Back to default" returns here. A stored choice still wins. The kit's own
 * fallback stays "mist" (`identities[0]` in `@zedtech/zedkit-ui`).
 */
export const DEFAULT_IDENTITY = "glass";

/** A look other than the site default, so the hero tour visibly changes it. */
export const HERO_TOUR_LOOK = DEFAULT_IDENTITY === "glass" ? "tide" : "glass";
