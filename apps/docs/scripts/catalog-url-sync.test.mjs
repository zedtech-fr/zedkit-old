import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogClickIsSamePageNavigation,
  catalogFilterQuery,
  catalogUrlIsOwnReplace,
  shouldApplyCatalogUrl,
} from "../ui/catalog/catalog-url-sync.mjs";

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

test("back-forward applies even when the query is still in the own-replace list", () => {
  const recent = ["q=dialog", "q=di"];
  assert.equal(
    shouldApplyCatalogUrl("q=di", {
      lastPushedQuery: "q=dialog",
      recentPushedQueries: recent,
      fromHistory: true,
    }),
    true,
  );
  assert.equal(
    shouldApplyCatalogUrl("", {
      lastPushedQuery: "q=dialog",
      recentPushedQueries: ["", "q=dialog"],
      fromHistory: true,
    }),
    true,
  );
});

test("same-page shared query after self-navigation still applies", () => {
  const page = "https://zedkit.app/catalog?q=dialog";
  const recent = ["", "q=di", "q=button", "q=dialog"];
  assert.equal(catalogClickIsSamePageNavigation("/catalog?q=dialog", page), true);
  assert.equal(catalogClickIsSamePageNavigation("/catalog?q=button", page), true);
  assert.equal(catalogClickIsSamePageNavigation("/catalog", page), true);
  assert.equal(catalogClickIsSamePageNavigation("/docs", page), false);
  assert.equal(catalogClickIsSamePageNavigation("/catalog?q=button", page, { target: "_blank" }), false);
  assert.equal(catalogClickIsSamePageNavigation("/catalog?q=button", page, { modifiedClick: true }), false);
  assert.equal(
    shouldApplyCatalogUrl("q=dialog", {
      lastPushedQuery: "q=dialog",
      recentPushedQueries: recent,
      fromUserNavigation: true,
    }),
    true,
  );
  assert.equal(
    shouldApplyCatalogUrl("q=button", {
      lastPushedQuery: "q=dialog",
      recentPushedQueries: recent,
      fromUserNavigation: true,
    }),
    true,
  );
  assert.equal(
    shouldApplyCatalogUrl("", {
      lastPushedQuery: "q=dialog",
      recentPushedQueries: recent,
      fromUserNavigation: true,
    }),
    true,
  );
});

test("first load and foreign queries still apply without a click", () => {
  assert.equal(shouldApplyCatalogUrl("q=dialog", { lastPushedQuery: null, recentPushedQueries: [] }), true);
  assert.equal(
    shouldApplyCatalogUrl("q=button", { lastPushedQuery: "q=dialog", recentPushedQueries: ["q=dialog"] }),
    true,
  );
});
