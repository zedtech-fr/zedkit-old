import { describe, expect, it } from "vitest";
import { checkoutSuffix, databaseNameFromUrl, suffixedDatabaseUrl } from "#index.js";

const BASE = "postgres://app:app@127.0.0.1:5433/app_test";

describe("test database names", () => {
  it("suffixes stably per checkout path", () => {
    const here = checkoutSuffix("/home/u/project");
    expect(here).toMatch(/^[0-9a-f]{6}$/);
    expect(checkoutSuffix("/home/u/project")).toBe(here);
    expect(checkoutSuffix("/home/u/project-b")).not.toBe(here);
  });

  it("appends the suffix to the base database name", () => {
    const url = suffixedDatabaseUrl(BASE, "/home/u/project");
    expect(url.startsWith("postgres://app:app@127.0.0.1:5433/app_test_")).toBe(true);
    expect(url).toContain(checkoutSuffix("/home/u/project"));
  });

  it("reads plain database names back out of URLs", () => {
    expect(databaseNameFromUrl(BASE)).toBe("app_test");
    expect(databaseNameFromUrl(suffixedDatabaseUrl(BASE, "/home/u/project"))).toMatch(
      /^app_test_[0-9a-f]{6}$/,
    );
  });

  it("refuses unsafe database names before they reach a DROP", () => {
    for (const url of [
      "postgres://h:5433/a;b",
      "postgres://h:5433/a b",
      "postgres://h:5433/a-b",
      "postgres://h:5433/",
    ]) {
      expect(() => databaseNameFromUrl(url)).toThrow(/unsafe name/);
    }
  });
});
