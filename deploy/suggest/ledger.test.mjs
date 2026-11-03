import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { text } from "node:stream/consumers";
import test from "node:test";

import { openLedger } from "./ledger.mjs";

const LIMITS = { maxConcurrent: 100, ipPerMinute: 1000, ipPerDay: 1000, sessionPerDay: 1000, netPerDay: 1000, globalPerDay: 10_000, globalPerHour: 10_000 };
const BUDGET = { dailyMicro: 1_000_000, monthlyMicro: null };

let n = 0;
function ask(over = {}) {
  n += 1;
  return {
    requestId: `req-${n}-${Math.random()}`,
    ip: `4:10.0.0.${n % 250}`,
    session: `s-${n}`,
    amountMicro: 100_000,
    ttlMs: 60_000,
    budget: BUDGET,
    limits: LIMITS,
    ...over,
  };
}

function ledger(options = {}) {
  const dir = options.dir ?? mkdtempSync(join(tmpdir(), "zk-ledger-"));
  return { dir, ledger: openLedger({ dir, ...options }) };
}

test("a reservation inside the budget is admitted and held", async () => {
  const { ledger: l } = ledger();
  assert.equal((await l.reserve(ask())).ok, true);
  assert.deepEqual(l.today(), { reserved: 100_000, settled: 0, requests: 1 });
});

test("a refused reservation changes nothing, and says when to come back", async () => {
  const { ledger: l } = ledger();
  const refused = await l.reserve(ask({ amountMicro: 2_000_000 }));
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, "budget");
  assert.ok(refused.retryAfterSec >= 1 && refused.retryAfterSec <= 86_400);
  assert.deepEqual(l.today(), { reserved: 0, settled: 0, requests: 0 });
});

test("settling charges what the provider reports; releasing returns an unused reservation; neither repeats", async () => {
  const { ledger: l } = ledger();
  const a = await l.reserve(ask());
  const b = await l.reserve(ask());
  await l.settle(a.id, 30_000);
  await l.settle(a.id, 30_000);
  await l.release(b.id);
  await l.release(b.id);
  assert.deepEqual(l.today(), { reserved: 0, settled: 30_000, requests: 2 });
});

test("a released reservation can be spent again; a settled one cannot", async () => {
  const { ledger: l } = ledger();
  const whole = ask({ amountMicro: 1_000_000 });
  const first = await l.reserve(whole);
  assert.equal(first.ok, true);
  assert.equal((await l.reserve(ask({ amountMicro: 1 }))).reason, "budget");
  await l.release(first.id);
  assert.equal((await l.reserve(ask({ amountMicro: 1_000_000 }))).ok, true);
});

test("the budget survives a restart", async () => {
  const first = ledger();
  const a = await first.ledger.reserve(ask({ amountMicro: 900_000 }));
  await first.ledger.settle(a.id, 900_000);
  first.ledger.close();
  const again = openLedger({ dir: first.dir });
  assert.deepEqual(again.today(), { reserved: 0, settled: 900_000, requests: 1 });
  assert.equal((await again.reserve(ask({ amountMicro: 200_000 }))).reason, "budget");
});

test("two instances on one file see each other's reservations", async () => {
  const first = ledger();
  const second = openLedger({ dir: first.dir });
  assert.equal((await first.ledger.reserve(ask({ amountMicro: 600_000 }))).ok, true);
  assert.equal((await second.reserve(ask({ amountMicro: 600_000 }))).reason, "budget");
  assert.equal((await second.reserve(ask({ amountMicro: 400_000 }))).ok, true);
});

test("separate processes racing for the last dollars cannot overspend the ceiling", async () => {
  const dir = mkdtempSync(join(tmpdir(), "zk-race-"));
  openLedger({ dir }).close();
  const worker = `
    import { openLedger } from ${JSON.stringify(pathToFileURL(join(import.meta.dirname, "ledger.mjs")).href)};
    const id = process.argv[1];
    const l = openLedger({ dir: ${JSON.stringify(dir)} });
    const limits = ${JSON.stringify(LIMITS)};
    let admitted = 0;
    for (let i = 0; i < 25; i += 1) {
      const r = await l.reserve({ requestId: id + "-" + i, ip: "4:" + id + "." + i, session: id + "-" + i, amountMicro: 100000, ttlMs: 600000, budget: { dailyMicro: 1000000, monthlyMicro: null }, limits });
      if (r.ok) admitted += 1;
    }
    console.log("ADMITTED " + admitted);
  `;
  const runWorker = async (id) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const child = spawn(process.execPath, ["--input-type=module", "-e", worker, id], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      const [out, err] = await Promise.all([text(child.stdout), text(child.stderr)]);
      const [code] = await once(child, "close");
      if (code === 0) {
        const match = /ADMITTED (\d+)/.exec(out);
        assert.ok(match, `worker ${id} output: ${JSON.stringify(out)}`);
        return Number(match[1]);
      }
      if (attempt === 2) {
        assert.fail(`worker ${id} exited ${code}: out=${JSON.stringify(out)} err=${JSON.stringify(err)}`);
      }
    }
    return 0;
  };
  const runs = await Promise.all(["a", "b", "c", "d", "e", "f"].map(runWorker));
  const total = runs.reduce((sum, value) => sum + value, 0);
  assert.equal(total, 10, `six processes admitted ${total} reservations of $0.10 against a $1.00 ceiling`);
  const check = openLedger({ dir });
  assert.equal(check.today().reserved, 1_000_000);
});

test("a job that never settles is charged in full once its time is up", async () => {
  let clock = Date.parse("2026-11-02T10:00:00Z");
  const { ledger: l } = ledger({ now: () => clock });
  await l.reserve(ask({ amountMicro: 400_000, ttlMs: 1_000 }));
  clock += 5_000;
  await l.reserve(ask({ amountMicro: 100_000 }));
  assert.deepEqual(l.today(), { reserved: 100_000, settled: 400_000, requests: 2 });
});

test("one paid job at a time per visitor, however the visitor is named", async () => {
  const { ledger: l } = ledger();
  const first = await l.reserve(ask({ ip: "4:203.0.113.9", session: "one" }));
  assert.equal(first.ok, true);
  assert.equal((await l.reserve(ask({ ip: "4:203.0.113.9", session: "forged-new-cookie" }))).reason, "busy");
  assert.equal((await l.reserve(ask({ ip: "4:198.51.100.1", session: "one" }))).reason, "busy");
  assert.equal((await l.reserve(ask({ ip: "4:198.51.100.1", session: "two" }))).ok, true);
});

test("a global ceiling on running jobs", async () => {
  const { ledger: l } = ledger();
  const limits = { ...LIMITS, maxConcurrent: 2 };
  assert.equal((await l.reserve(ask({ limits }))).ok, true);
  assert.equal((await l.reserve(ask({ limits }))).ok, true);
  const third = await l.reserve(ask({ limits }));
  assert.equal(third.reason, "busy");
});

test("the same request id is never two paid jobs", async () => {
  const { ledger: l } = ledger();
  const request = ask();
  assert.equal((await l.reserve(request)).ok, true);
  assert.equal((await l.reserve({ ...request, ip: "4:1.1.1.1", session: "x" })).reason, "duplicate");
  assert.equal(l.today().requests, 1);
});

test("per-address and per-day request limits, with the time they lift", async () => {
  let clock = Date.parse("2026-11-02T10:00:30Z");
  const { ledger: l } = ledger({ now: () => clock });
  const limits = { ...LIMITS, ipPerMinute: 2, ipPerDay: 3 };
  const same = { ip: "4:203.0.113.7", limits };
  const done = async () => {
    const r = await l.reserve(ask({ ...same, session: `s-${Math.random()}` }));
    if (r.ok) await l.settle(r.id, 1);
    return r;
  };
  assert.equal((await done()).ok, true);
  assert.equal((await done()).ok, true);
  const third = await done();
  assert.equal(third.reason, "rate");
  assert.equal(third.retryAfterSec, 30);
  clock += 60_000;
  assert.equal((await done()).ok, true);
  clock += 60_000;
  const fourth = await done();
  assert.equal(fourth.reason, "rate");
  assert.ok(fourth.retryAfterSec > 3_600, "the daily limit lifts at the next UTC midnight");
});

test("a monthly ceiling holds even when the day has room", async () => {
  const { ledger: l } = ledger();
  const budget = { dailyMicro: 1_000_000, monthlyMicro: 150_000 };
  const first = await l.reserve(ask({ budget }));
  await l.settle(first.id, 100_000);
  const second = await l.reserve(ask({ budget }));
  assert.equal(second.reason, "budget");
  assert.ok(second.retryAfterSec > 0);
});

test("the kill switch is a file every instance reads on each request", () => {
  const { dir, ledger: l } = ledger();
  assert.equal(l.killed(), false);
  writeFileSync(join(dir, "DISABLED"), "");
  assert.equal(l.killed(), true);
  assert.equal(openLedger({ dir }).killed(), true);
});

test("a refused request leaves no trace: the same id is admitted later, and nothing counts it as spent", async () => {
  let at = Date.UTC(2030, 0, 1, 12, 0, 0);
  const { ledger: l } = ledger({ now: () => at });
  const first = ask({ ip: "4:1.1.1.1", limits: { ...LIMITS, ipPerMinute: 1 } });
  assert.equal((await l.reserve(first)).ok, true);
  await l.settle(first.requestId, 10_000);
  const second = ask({ ip: "4:1.1.1.1", limits: { ...LIMITS, ipPerMinute: 1 } });
  assert.equal((await l.reserve(second)).reason, "rate");
  assert.equal((await l.reserve(second)).reason, "rate", "asking again is refused again, not called a duplicate");
  at += 61_000;
  assert.equal((await l.reserve(second)).ok, true);
  assert.equal((await l.reserve(second)).reason, "duplicate");
});

test("finished jobs are forgotten after a day, so an id never trips over an old row", async () => {
  let at = Date.UTC(2030, 0, 1, 12, 0, 0);
  const { ledger: l } = ledger({ now: () => at });
  const request = ask();
  assert.equal((await l.reserve(request)).ok, true);
  await l.settle(request.requestId, 1_000);
  at += 25 * 3_600_000;
  assert.equal((await l.reserve({ ...request })).ok, true, "reused after a day, with no constraint error");
});

test("a whole IPv6 site and an hour are limited apart from the visitor and the day", async () => {
  let at = Date.UTC(2030, 0, 1, 12, 5, 0);
  const { ledger: l } = ledger({ now: () => at });
  const limits = { ...LIMITS, netPerDay: 2, globalPerHour: 3 };
  assert.equal((await l.reserve(ask({ limits, ip: "6:a:b:c:1", net: "6:a:b:c" }))).ok, true);
  assert.equal((await l.reserve(ask({ limits, ip: "6:a:b:c:2", net: "6:a:b:c" }))).ok, true);
  assert.equal((await l.reserve(ask({ limits, ip: "6:a:b:c:3", net: "6:a:b:c" }))).reason, "rate", "a third /64 in the same /48");
  assert.equal((await l.reserve(ask({ limits, ip: "6:a:b:d:1", net: "6:a:b:d" }))).ok, true, "another site, third of the hour");
  const over = await l.reserve(ask({ limits, ip: "4:2.2.2.2" }));
  assert.equal(over.reason, "rate");
  assert.ok(over.retryAfterSec >= 1 && over.retryAfterSec <= 3_600, "the retry time is within the hour");
  at += 3_600_000;
  assert.equal((await l.reserve(ask({ limits, ip: "4:2.2.2.2" }))).ok, true);
});
