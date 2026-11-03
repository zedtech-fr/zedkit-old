import assert from "node:assert/strict";
import test from "node:test";

process.env.TZ = "UTC";

const { retryText, identityAssistantCopy } = await import("../components/i18n/identity-assistant-copy.ts");

const now = new Date("2026-11-03T10:00:00.000Z");

test("quota copy is a neutral limit, not a daily allowance", () => {
  const text = identityAssistantCopy.failure.quota(1_800);
  assert.match(text, /^The assistant limit has been reached\./);
  assert.doesNotMatch(text, /daily|monthly|left today|remaining/i);
  assert.match(text, /Try again in 30 minutes\./);
});

test("a retry later today names the clock time, never earlier than Retry-After", () => {
  assert.equal(retryText(2 * 3_600, now), "Try again after 12:00.");
  assert.equal(retryText(2 * 3_600 + 1, now), "Try again after 12:01.");
  assert.doesNotMatch(retryText(2 * 3_600 + 1, now), /tomorrow/i);
});

test("a retry tomorrow says tomorrow and the clock time", () => {
  const evening = new Date("2026-11-03T22:00:00.000Z");
  assert.equal(retryText(5 * 3_600, evening), "Try again tomorrow after 03:00.");
  assert.doesNotMatch(retryText(5 * 3_600, evening), /November|December|\d{4}/);
});

test("a retry next month names the explicit date, not tomorrow", () => {
  const nextMonth = Math.round((Date.parse("2026-12-15T09:30:00.000Z") - now.getTime()) / 1000);
  assert.equal(retryText(nextMonth, now), "Try again after 15 December 2026, 09:30.");
  assert.doesNotMatch(retryText(nextMonth, now), /tomorrow/i);
  assert.doesNotMatch(identityAssistantCopy.failure.quota(nextMonth), /daily|tomorrow/i);
});
