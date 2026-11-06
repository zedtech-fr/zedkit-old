import assert from "node:assert/strict";
import test from "node:test";
import { catalogFilterQuery, catalogUrlIsOwnReplace, shouldApplyCatalogUrl } from "../ui/catalog/catalog-url-sync.mjs";

test("serialize omits defaults and keeps q", () => {
  assert.equal(catalogFilterQuery({}), "");
  assert.equal(catalogFilterQuery({ area: "all", status: "all", q: "" }), "");
  assert.equal(catalogFilterQuery({ q: "dialog" }), "q=dialog");
  assert.equal(catalogFilterQuery({ area: "ui", q: "di" }), "area=ui&q=di");
});

test("own replace echoes are ignored so typing is not overwritten", () => {
  const recent = ["q=di", "q=dia", "q=dialog"];
  assert.equal(catalogUrlIsOwnReplace("q=dialog", "q=dialog", recent), true);
  assert.equal(catalogUrlIsOwnReplace("q=di", "q=dialog", recent), true);
  assert.equal(
    shouldApplyCatalogUrl("q=di", { lastPushedQuery: "q=dialog", recentPushedQueries: recent }),
    false,
  );
  assert.equal(
    shouldApplyCatalogUrl("q=dialog", { lastPushedQuery: "q=dialog", recentPushedQueries: recent }),
    false,
  );
});

test("back-forward and shared links are applied", () => {
  const recent = ["q=dialog"];
  assert.equal(catalogUrlIsOwnReplace("q=button", "q=dialog", recent), false);
  assert.equal(catalogUrlIsOwnReplace("", "q=dialog", recent), false);
  assert.equal(catalogUrlIsOwnReplace("area=ui", "", []), false);
  assert.equal(
    shouldApplyCatalogUrl("q=button", { lastPushedQuery: "q=dialog", recentPushedQueries: recent }),
    true,
  );
  assert.equal(shouldApplyCatalogUrl("q=dialog", { lastPushedQuery: null, recentPushedQueries: [] }), true);
  assert.equal(
    shouldApplyCatalogUrl("q=di", {
      lastPushedQuery: "q=dialog",
      recentPushedQueries: recent,
      fromHistory: true,
    }),
    true,
  );
});
