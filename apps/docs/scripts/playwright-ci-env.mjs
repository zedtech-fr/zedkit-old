/** Positive integer from env, else fallback. Empty/invalid leaves the default. */
export function playwrightCiInt(name, min, fallback, env = process.env) {
  const raw = env[name]?.trim() ?? "";
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}
