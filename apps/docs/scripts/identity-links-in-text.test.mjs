import assert from "node:assert/strict";
import test from "node:test";

import { linksInText, removeLink } from "../lib/identity-links-in-text.ts";

test("links written in the brief are the references, in order, each once", () => {
  const text = "A ceramics shop, like https://atelier.example.org/shop and also https://studio.example.com/. See https://atelier.example.org/shop again.";
  assert.deepEqual(linksInText(text).urls, ["https://atelier.example.org/shop", "https://studio.example.com/"]);
});

test("trailing punctuation is not part of the link", () => {
  assert.deepEqual(linksInText("Look at https://a.example.org/x, https://b.example.org/y! (https://c.example.org/z)").urls, ["https://a.example.org/x", "https://b.example.org/y", "https://c.example.org/z"]);
});

test("only https is read; the rest is named, and a fourth link is not read", () => {
  const out = linksInText("http://old.example.org and https://a.example.org https://b.example.org https://c.example.org https://d.example.org");
  assert.deepEqual(out.urls, ["https://a.example.org/", "https://b.example.org/", "https://c.example.org/"]);
  assert.deepEqual(out.skipped.map((item) => item.why), ["http", "too-many"]);
});

test("a brief with no link has no references, and junk never throws", () => {
  assert.deepEqual(linksInText("A calm studio for ceramics"), { urls: [], skipped: [] });
  assert.deepEqual(linksInText("").urls, []);
  assert.deepEqual(linksInText("https:// https://[::1 javascript:alert(1)").urls, []);
});

test("removing a link takes it out of the text and tidies the gap", () => {
  const text = "A ceramics shop, like https://atelier.example.org/shop. Calm and warm.";
  assert.equal(removeLink(text, "https://atelier.example.org/shop"), "A ceramics shop, like. Calm and warm.");
  assert.equal(removeLink("https://a.example.org/ and https://b.example.org/", "https://a.example.org/"), "and https://b.example.org/");
  assert.equal(removeLink("nothing here", "https://a.example.org/"), "nothing here");
});
