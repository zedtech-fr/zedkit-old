/**
 * Whether this page load arrived with `#create` in the address. The dock gate captures it in its first layout
 * pass (main chunk); the editor replaces `#create` with its look query in a later pass, and the dock itself
 * loads lazily, so the dock cannot reliably read the live hash at its own mount. One-shot: later
 * client-side navigations without a reload must not reopen the dock.
 */
let createArrived = false;

export function captureCreateArrival(): void {
  if (typeof window !== "undefined" && window.location.hash === "#create") createArrived = true;
}

export function consumeCreateArrival(): boolean {
  const arrived = createArrived;
  createArrived = false;
  return arrived;
}
