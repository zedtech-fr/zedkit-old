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

  it("trims the brief and ignores case", () => {
    expect(selectSpecimenDomain("  SHOP  ")).toBe("commerce");
  });

  it("returns the default when no keyword matches", () => {
    expect(selectSpecimenDomain("Acme rebrand")).toBe("saas-dashboard");
  });

  it("picks the domain with the stronger keyword score", () => {
    expect(selectSpecimenDomain("checkout dashboard")).toBe("commerce");
  });

  it("does not match keywords inside unrelated words", () => {
    expect(selectSpecimenDomain("capital markets")).toBe("saas-dashboard");
    expect(selectSpecimenDomain("notebook shop")).toBe("commerce");
    expect(selectSpecimenDomain("impressive portfolio")).toBe("saas-dashboard");
    expect(selectSpecimenDomain("steam-powered brand")).toBe("saas-dashboard");
  });

  it("defaults for French briefs with no English domain tokens", () => {
    expect(selectSpecimenDomain("Marque française pour artisans")).toBe("saas-dashboard");
    expect(selectSpecimenDomain("Identité visuelle pour créateurs")).toBe("saas-dashboard");
  });

  it("still matches plural keywords", () => {
    expect(selectSpecimenDomain("Online shops with carts")).toBe("commerce");
  });
});
