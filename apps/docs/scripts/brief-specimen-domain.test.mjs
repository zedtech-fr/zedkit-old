import assert from "node:assert/strict";
import test from "node:test";

import { specimenDomainFromBrief } from "../lib/brief-specimen-domain.ts";

test("specimenDomainFromBrief maps brief keywords to the four domains", () => {
  assert.equal(specimenDomainFromBrief("A ceramics shop"), "commerce");
  assert.equal(specimenDomainFromBrief("SaaS dashboard for admins"), "saas-dashboard");
  assert.equal(specimenDomainFromBrief("Independent newsroom"), "editorial");
  assert.equal(specimenDomainFromBrief("Salon booking and appointments"), "booking");
  assert.equal(specimenDomainFromBrief(""), "commerce");
});
