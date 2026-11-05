import assert from "node:assert/strict";
import test from "node:test";

import { isSpecimenDomain, specimenBriefFromThread, specimenDomainFromBrief } from "../lib/brief-specimen-domain.ts";

test("specimenBriefFromThread keeps the first user turn for specimen routing", () => {
  assert.equal(
    specimenBriefFromThread(
      [
        { role: "user", text: "A SaaS dashboard" },
        { role: "assistant", text: "Done" },
        { role: "user", text: "Calmer" },
      ],
      "fallback",
    ),
    "A SaaS dashboard",
  );
  assert.equal(specimenBriefFromThread([], "fallback"), "fallback");
});

test("specimenDomainFromBrief maps brief keywords to the four domains", () => {
  assert.equal(specimenDomainFromBrief("A ceramics shop"), "commerce");
  assert.equal(specimenDomainFromBrief("SaaS dashboard for admins"), "saas-dashboard");
  assert.equal(specimenDomainFromBrief("Independent newsroom"), "editorial");
  assert.equal(specimenDomainFromBrief("I run a daily newspaper"), "editorial");
  assert.equal(specimenDomainFromBrief("Salon booking and appointments"), "booking");
  assert.equal(specimenDomainFromBrief(""), "commerce");
});

test("isSpecimenDomain accepts only the four domain ids", () => {
  assert.equal(isSpecimenDomain("editorial"), true);
  assert.equal(isSpecimenDomain("booking"), true);
  assert.equal(isSpecimenDomain("newspaper"), false);
  assert.equal(isSpecimenDomain(null), false);
});
