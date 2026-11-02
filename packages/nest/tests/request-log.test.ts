import { describe, expect, it } from "vitest";
import { compactRequestSerializers, createRequestLogLevel } from "../src/index.js";

describe("compactRequestSerializers", () => {
  it("keeps only id, method, url, and statusCode", () => {
    const serializers = compactRequestSerializers();
    expect(
      serializers.req({
        id: "req-1",
        method: "GET",
        url: "/items?limit=1",
        headers: { authorization: "Bearer s3cr3t" },
        remoteAddress: "127.0.0.1",
      }),
    ).toEqual({ id: "req-1", method: "GET", url: "/items?limit=1" });
    expect(
      serializers.res({ statusCode: 200, headers: { "set-cookie": "x=y" } }),
    ).toEqual({ statusCode: 200 });
  });
});

describe("createRequestLogLevel", () => {
  const level = createRequestLogLevel({ quietPaths: ["/health", "/ready"] });

  it("silences successful quiet-path requests, including those with a query string", () => {
    expect(level({ url: "/health" }, { statusCode: 200 })).toBe("silent");
    expect(level({ url: "/health?verbose=1" }, { statusCode: 200 })).toBe("silent");
    expect(level({ url: "/ready" }, { statusCode: 204 })).toBe("silent");
  });

  it("keeps failures on quiet paths loud", () => {
    expect(level({ url: "/health" }, { statusCode: 500 })).toBe("error");
    expect(level({ url: "/health" }, { statusCode: 404 })).toBe("warn");
    expect(level({ url: "/health" }, { statusCode: 200 }, new Error("boom"))).toBe("error");
  });

  it("keeps the default mapping elsewhere", () => {
    expect(level({ url: "/items" }, { statusCode: 200 })).toBe("info");
    expect(level({ url: "/items" }, { statusCode: 404 })).toBe("warn");
    expect(level({ url: "/items" }, { statusCode: 500 })).toBe("error");
    expect(level({ url: "/healthz" }, { statusCode: 200 })).toBe("info");
  });

  it("quiets nothing when the path list is empty", () => {
    const allLoud = createRequestLogLevel();
    expect(allLoud({ url: "/health" }, { statusCode: 200 })).toBe("info");
  });
});
