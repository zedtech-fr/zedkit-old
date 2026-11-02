import request from "supertest";
import { describe, expect, it } from "vitest";
import { boot, captureStream, waitForLogs } from "./helpers.js";

// NOTE: the request logger is process-wide (one pino instance per process),
// so the first app booted in this file owns the log destination. Log-capture
// tests live in their own files — one logger config per file.
describe("transformLine failures", () => {
  it("replaces a throwing transform with the dropped-line marker", async () => {
    const { stream, text } = captureStream();
    const { url } = await boot({
      logger: {
        level: "info",
        stream,
        transformLine: () => {
          throw new Error("scrub failed");
        },
      },
    });
    await request(url).get("/items");
    const logs = await waitForLogs(text, "unparseable log line dropped");
    expect(logs).toContain("[unparseable log line dropped]");
    expect(logs).not.toContain("scrub failed");
  });
});
