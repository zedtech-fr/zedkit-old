import { describe, expect, it } from "vitest";

import { selectSpecimenDomain } from "#marketing/specimens/specimen-domain.js";

describe("selectSpecimenDomain", () => {
  it("defaults to saas-dashboard for an empty brief", () => {
    expect(selectSpecimenDomain("")).toBe("saas-dashboard");
  });

  it("routes commerce language to the shop specimen", () => {
    expect(selectSpecimenDomain("A ceramics shop with warm neutrals")).toBe("commerce");
    expect(selectSpecimenDomain("Online store checkout flow")).toBe("commerce");
  });

  it("routes dashboard language to saas-dashboard", () => {
    expect(selectSpecimenDomain("B2B admin with usage quotas")).toBe("saas-dashboard");
  });

  it("routes editorial language to the newsroom specimen", () => {
    expect(selectSpecimenDomain("Independent magazine newsroom")).toBe("editorial");
  });

  it("routes booking language to service-booking", () => {
    expect(selectSpecimenDomain("Hair salon appointment booking")).toBe("service-booking");
    expect(selectSpecimenDomain("Clinic schedule and reservations")).toBe("service-booking");
  });
});
