// Vanilla motion runtime: no React. Safe to import from a script tag or observer.
export {
  ANIMATE_PRESETS,
  ANIMATE_TRIGGERS,
  observeAnimate,
  type AnimateMotion,
  type AnimateOn,
  type AnimatePreset,
  type AnimateTrigger,
} from "../animate-runtime.js";
export {
  MOTION_CHANGE_EVENT,
  MOTION_STORAGE_KEY,
  applyMotionPreference,
  isMotionReduced,
  type MotionPreference,
} from "../motion-preference.js";
