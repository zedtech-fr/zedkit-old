/** A request id the service accepts: 8 to 64 characters of letters, digits, dash and underscore. */
export function newRequestId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
