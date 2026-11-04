import assert from "node:assert/strict";
import test from "node:test";

import { linksInText, removeLink } from "../lib/identity-links-in-text.ts";

test("links in a brief: full http(s) links and bare names are recognised, at most three, each once", () => {
  const found = linksInText("Like linear.app, www.stripe.com/pricing and (http://old.example.org). Also https://linear.app/ and vercel.com!");
  assert.deepEqual(found.urls, ["https://linear.app/", "https://www.stripe.com/pricing", "http://old.example.org/"]);
  assert.deepEqual(found.skipped, [{ url: "vercel.com", why: "too-many" }]);
});

test("a bare name on a newer extension is a link too, so 'like name.digital' is read", () => {
  assert.deepEqual(linksInText("une identité comme sur mon portfolio: studio-name.digital").urls, ["https://studio-name.digital/"]);
  assert.deepEqual(linksInText("like acme.agency and acme.works").urls, ["https://acme.agency/", "https://acme.works/"]);
});

test("words that only look like names are not links", () => {
  for (const text of ["e.g. calm", "see identity.ts and Node.js", "mail me at someone@example.com", "version 1.2.3", "the a.b.c"]) {
    assert.deepEqual(linksInText(text).urls, [], text);
  }
});

test("dropping a chip removes that link from the text, bare or full", () => {
  assert.equal(removeLink("Like linear.app, and https://b.example.org/ too.", "https://linear.app/"), "Like, and https://b.example.org/ too.");
  assert.equal(removeLink("Like linear.app and https://b.example.org/", "https://b.example.org/"), "Like linear.app and");
});
