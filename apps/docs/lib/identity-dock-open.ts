export const IDENTITY_DOCK_OPEN = "zk-identity-dock-open";

/**
 * Opens the identity dock from anywhere on the page, with a brief carried in. The dock owns the store, so pages
 * outside the dock chunk ask through this event instead of importing it (first-load budget).
 */
export function requestIdentityDockOpen(brief: string): void {
  window.dispatchEvent(new CustomEvent(IDENTITY_DOCK_OPEN, { detail: brief }));
}
