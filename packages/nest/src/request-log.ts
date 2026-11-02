// Original work by the same author.
import type { LevelWithSilent } from "pino";

/**
 * Compact pino-http serializers: one request object with id, method, and
 * url; one response object with the status code. Headers, cookies, and
 * sockets never reach the log. The kept url still carries its query
 * string — callers must not put secrets in query strings (use
 * `LoggerOptions.transformLine` to scrub if they might).
 */
export function compactRequestSerializers(): {
  req: (req: {
    id?: unknown;
    method?: unknown;
    url?: unknown;
    [key: string]: unknown;
  }) => {
    id: unknown;
    method: unknown;
    url: unknown;
  };
  res: (res: { statusCode?: unknown; [key: string]: unknown }) => { statusCode: unknown };
} {
  return {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  };
}

/**
 * pino-http `customLogLevel`: paths in `quietPaths` (pathname match;
 * query strings ignored) go silent on success and keep the default
 * mapping (error >= 500 or exception, warn >= 400) on failure. Every
 * other path keeps that mapping as-is. Pass the path list in; this
 * helper does not hard-code any.
 */
export function createRequestLogLevel(
  options: { quietPaths?: readonly string[] | undefined } = {},
): (req: { url?: unknown }, res: { statusCode?: unknown }, err?: unknown) => LevelWithSilent {
  const quiet = new Set(options.quietPaths ?? []);
  return (req, res, err) => {
    const status = typeof res.statusCode === "number" ? res.statusCode : 200;
    const failed = err !== undefined && err !== null;
    if (
      !failed &&
      status < 400 &&
      typeof req.url === "string" &&
      quiet.has(req.url.split("?", 1)[0] ?? req.url)
    ) {
      return "silent";
    }
    if (failed || status >= 500) return "error";
    if (status >= 400) return "warn";
    return "info";
  };
}
