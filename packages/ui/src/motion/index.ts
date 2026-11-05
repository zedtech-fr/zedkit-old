// Server-safe motion entry. Do not re-export client modules (`"use client"`)
// from this barrel: a Server Component import of ParallaxSection would fail.
export {
  PARALLAX_AXES,
  PARALLAX_DEPTH_NAMES,
  PARALLAX_FADES,
  PARALLAX_OFF,
  PARALLAX_RANGES,
  PARALLAX_SECTION_TAGS,
} from "../parallax-types.js";
export {
  ParallaxLayer,
  ParallaxSection,
  type ParallaxAxis,
  type ParallaxDepth,
  type ParallaxDepthName,
  type ParallaxFade,
  type ParallaxLayerProps,
  type ParallaxOff,
  type ParallaxRange,
  type ParallaxSectionProps,
  type ParallaxSectionTag,
} from "../parallax.js";
export { MotionScript, type MotionScriptProps } from "../motion-script.js";
export { SCROLL_SCENES_MAX, ScrollScenes, type ScrollScene, type ScrollScenesProps } from "../scroll-scenes.js";
export {
  StickyAside,
  StickyAsideAside,
  StickyAsideMain,
  type StickyAsideAsideProps,
  type StickyAsideFrom,
  type StickyAsideGap,
  type StickyAsideMainProps,
  type StickyAsideMobile,
  type StickyAsideProps,
  type StickyAsideRatioPreset,
  type StickyAsideSide,
} from "../sticky-aside.js";
export {
  MOTION_CHANGE_EVENT,
  MOTION_STORAGE_KEY,
  applyMotionPreference,
  isMotionReduced,
  type MotionPreference,
} from "../motion-preference.js";
