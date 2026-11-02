import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  compactRequestSerializers,
  createRequestLogLevel,
} from "../src/index.js";
import { boot, captureStream, waitForLogs } from "./helpers.js";

// NOTE: the request logger is process-wide (one pino instance per process),
// so the first app booted in this file owns the log destination. Log-capture
// tests live in their own files — one logger config per file.
describe("log pipeline options", () => {
  it("applies compact serializers, quiet paths, and transformLine", async () => {
    const { stream, text } = captureStream();
    const { url } = await boot({
      logger: {
        level: "info",
        stream,
        serializers: compactRequestSerializers(),
        customLogLevel: createRequestLogLevel({ quietPaths: ["/items"] }),
        transformLine: (obj) => {
          if (obj !== null && typeof obj === "object") {
            return { ...obj, scrubbed: true };
          }
          return obj;
        },
      },
    });
    await request(url).get("/items");
    await request(url).get("/items/boom");
    const logs = await waitForLogs(text, "/items/boom");
    const lines = logs
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as {
        msg?: unknown;
        scrubbed?: unknown;
        req?: Record<string, unknown>;
        res?: Record<string, unknown>;
      });
    const completed = lines.filter(
      (line) => line.msg === "request completed" || line.msg === "request errored",
    );
    expect(
      completed.some((line) => line.req?.url === "/items" && line.res?.statusCode === 200),
    ).toBe(false);
    const failed = completed.find((line) => line.req?.url === "/items/boom");
    expect(failed).toBeDefined();
    expect(failed?.scrubbed).toBe(true);
    expect(Object.keys(failed?.req ?? {}).sort()).toEqual(["id", "method", "url"]);
    expect(Object.keys(failed?.res ?? {})).toEqual(["statusCode"]);
    expect(logs).not.toContain("headers");
  });
});
