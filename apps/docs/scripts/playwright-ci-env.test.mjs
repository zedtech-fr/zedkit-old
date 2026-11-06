import assert from "node:assert/strict";
import test from "node:test";
import { playwrightCiInt } from "./playwright-ci-env.mjs";

test("empty env keeps the config default (hosted smoke)", () => {
  assert.equal(playwrightCiInt("DOCS_E2E_WORKERS", 1, 2, {}), 2);
  assert.equal(playwrightCiInt("DOCS_E2E_RETRIES", 0, 1, { DOCS_E2E_RETRIES: "" }), 1);
});

test("self-hosted workflow values override", () => {
  const env = { DOCS_E2E_WORKERS: "1", DOCS_E2E_RETRIES: "2" };
  assert.equal(playwrightCiInt("DOCS_E2E_WORKERS", 1, 2, env), 1);
  assert.equal(playwrightCiInt("DOCS_E2E_RETRIES", 0, 1, env), 2);
});

test("zero workers is invalid; zero retries is allowed", () => {
  assert.equal(playwrightCiInt("DOCS_E2E_WORKERS", 1, 2, { DOCS_E2E_WORKERS: "0" }), 2);
  assert.equal(playwrightCiInt("DOCS_E2E_RETRIES", 0, 1, { DOCS_E2E_RETRIES: "0" }), 0);
});
