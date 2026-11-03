// The durable ledger behind every paid call: spend, rate counters, running jobs and request ids, in one SQLite file.
//
// Why a file and a transaction: the budget must hold across restarts and across instances. Every check and every
// write of a reservation happens inside one `BEGIN IMMEDIATE`, so two instances (or two requests) sharing the file
// cannot both see room for the last dollar. The file is local to a host: instances must share the same data
// volume. A deployment spread over several hosts needs a network store behind this same interface.
//
// Money is integer micro-dollars. A reservation is made BEFORE paid work starts, at the worst case the call could
// cost. It is then settled to what the provider reports, or kept whole when there is no report (a crash, a cut
// connection, a timeout). A job that never settles is charged in full once its time is up: nothing ever flows back
// into the budget except a reservation released before any provider call was made.
//
// A refused request writes nothing: a request id is only recorded when a job is admitted (the job row is the
// record), so a refusal can be retried with the same id and a flood of refusals costs reads, not fsyncs.
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS spend (
  period TEXT PRIMARY KEY,
  reserved INTEGER NOT NULL DEFAULT 0,
  settled INTEGER NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  session TEXT NOT NULL,
  amount INTEGER NOT NULL,
  day TEXT NOT NULL,
  month TEXT NOT NULL,
  expires INTEGER NOT NULL,
  state TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_open ON jobs (state, expires);
CREATE TABLE IF NOT EXISTS hits (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, key, bucket)
);
CREATE INDEX IF NOT EXISTS jobs_expires ON jobs (expires);
`;

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function secondsToNextMinute(now) {
  return Math.max(1, Math.ceil((MINUTE - (now % MINUTE)) / 1000));
}

function secondsToNextUtcDay(now) {
  return Math.max(1, Math.ceil((DAY - (now % DAY)) / 1000));
}

function secondsToNextUtcMonth(now) {
  const date = new Date(now);
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
  return Math.max(1, Math.ceil((next - now) / 1000));
}

function isSqliteBusy(error) {
  return error?.code === "ERR_SQLITE_ERROR" && error?.errcode === 5;
}

/** Concurrent openLedger calls can race on first WAL; busy_timeout applies after it is set. */
function execBusyRetry(db, sql, attempts = 50) {
  for (let i = 0; i < attempts; i += 1) {
    /* eslint-disable no-restricted-syntax -- deploy suggest has no workspace deps; sync SQLite busy retry */
    try {
      db.exec(sql);
      return;
    } catch (error) {
      if (!isSqliteBusy(error) || i === attempts - 1) {
        throw error;
      }
    }
    /* eslint-enable no-restricted-syntax */
  }
}

export function openLedger({ dir, now = () => Date.now() }) {
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(join(dir, "ledger.sqlite"));
  db.exec("PRAGMA busy_timeout = 5000;");
  execBusyRetry(db, "PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = FULL;");
  db.exec(SCHEMA);

  const q = {
    expired: db.prepare("SELECT id, amount, day, month FROM jobs WHERE state = 'open' AND expires < ?"),
    expire: db.prepare("UPDATE jobs SET state = 'expired' WHERE id = ?"),
    spendRow: db.prepare("SELECT reserved, settled, requests FROM spend WHERE period = ?"),
    spendInit: db.prepare("INSERT OR IGNORE INTO spend (period) VALUES (?)"),
    spendMove: db.prepare("UPDATE spend SET reserved = reserved + ?, settled = settled + ?, requests = requests + ? WHERE period = ?"),
    jobExists: db.prepare("SELECT 1 AS found FROM jobs WHERE id = ?"),
    jobsClean: db.prepare("DELETE FROM jobs WHERE state != 'open' AND expires < ?"),
    openAll: db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE state = 'open'"),
    openIp: db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE state = 'open' AND ip = ?"),
    openSession: db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE state = 'open' AND session = ?"),
    hitRow: db.prepare("SELECT n FROM hits WHERE scope = ? AND key = ? AND bucket = ?"),
    hitBump: db.prepare("INSERT INTO hits (scope, key, bucket, n) VALUES (?, ?, ?, 1) ON CONFLICT (scope, key, bucket) DO UPDATE SET n = n + 1"),
    hitClean: db.prepare("DELETE FROM hits WHERE bucket LIKE 'd:%' AND bucket < ?"),
    hitCleanMinutes: db.prepare("DELETE FROM hits WHERE bucket LIKE 'm:%' AND CAST(substr(bucket, 3) AS INTEGER) < ?"),
    hitCleanHours: db.prepare("DELETE FROM hits WHERE bucket LIKE 'h:%' AND CAST(substr(bucket, 3) AS INTEGER) < ?"),
    jobInsert: db.prepare("INSERT INTO jobs (id, ip, session, amount, day, month, expires, state) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')"),
    jobRow: db.prepare("SELECT id, amount, day, month, state FROM jobs WHERE id = ?"),
    jobState: db.prepare("UPDATE jobs SET state = ? WHERE id = ?"),
  };

  // The repo bans raw try/catch, so a transaction is a promise: BEGIN, the work, then COMMIT or ROLLBACK from
  // the outcome. Transactions of this process queue behind one another; other processes wait on SQLite's lock.
  let queue = Promise.resolve();
  // A rollback with nothing open throws; it is ignored, because the point is only to never leave one open.
  const rollback = () =>
    Promise.resolve()
      .then(() => db.exec("ROLLBACK"))
      .catch(() => undefined);
  function step(work) {
    db.exec("BEGIN IMMEDIATE");
    return Promise.resolve()
      .then(work)
      .then((value) => {
        db.exec("COMMIT");
        return value;
      })
      .catch((error) => rollback().then(() => Promise.reject(error)));
  }
  function transaction(work) {
    const result = queue.then(() => step(work));
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  function move(day, month, reserved, settled, requests) {
    for (const period of [`d:${day}`, `m:${month}`]) {
      q.spendInit.run(period);
      q.spendMove.run(reserved, settled, requests, period);
    }
  }

  /** A job whose time ran out without settling is charged in full: never released, never forgotten. */
  function expireStale(at) {
    for (const job of q.expired.all(at)) {
      move(job.day, job.month, -job.amount, job.amount, 0);
      q.expire.run(job.id);
    }
  }

  const hits = (scope, key, bucket) => q.hitRow.get(scope, key, bucket)?.n ?? 0;
  let lastClean = 0;

  /**
   * Admits one paid job or says why not. Rejections change nothing, so a refused request costs nothing and the
   * caller must not call the provider.
   * @returns {Promise<{ ok: true, id: string } | { ok: false, reason: "duplicate" | "busy" | "rate" | "budget", retryAfterSec: number }>}
   */
  function reserve({ requestId, ip, net = ip, session, amountMicro, ttlMs, budget, limits }) {
    const at = now();
    const day = new Date(at).toISOString().slice(0, 10);
    const month = day.slice(0, 7);
    const minute = Math.floor(at / MINUTE);
    const hour = Math.floor(at / HOUR);
    return transaction(() => {
      expireStale(at);
      // Housekeeping is a handful of full scans, so it runs once a minute, not on every request.
      if (minute > lastClean) {
        lastClean = minute;
        q.jobsClean.run(at - DAY);
        q.hitClean.run(`d:${new Date(at - 2 * DAY).toISOString().slice(0, 10)}`);
        q.hitCleanMinutes.run(minute - 10);
        q.hitCleanHours.run(hour - 3);
      }
      if (q.jobExists.get(requestId)) return { ok: false, reason: "duplicate", retryAfterSec: 1 };

      if (q.openAll.get().n >= limits.maxConcurrent) return { ok: false, reason: "busy", retryAfterSec: 5 };
      // One paid job at a time per visitor, whichever way they are identified: a double click, a second tab and a
      // forged session id all meet the same wall.
      if (q.openIp.get(ip).n > 0 || q.openSession.get(session).n > 0) return { ok: false, reason: "busy", retryAfterSec: 5 };

      if (hits("ip", ip, `m:${minute}`) >= limits.ipPerMinute) return { ok: false, reason: "rate", retryAfterSec: secondsToNextMinute(at) };
      const untilDay = secondsToNextUtcDay(at);
      if (hits("ip", ip, `d:${day}`) >= limits.ipPerDay) return { ok: false, reason: "rate", retryAfterSec: untilDay };
      // A whole IPv6 site (a /48) shares a wider allowance than one address: renting more /64s does not buy more.
      if (hits("net", net, `d:${day}`) >= limits.netPerDay) return { ok: false, reason: "rate", retryAfterSec: untilDay };
      if (hits("session", session, `d:${day}`) >= limits.sessionPerDay) return { ok: false, reason: "rate", retryAfterSec: untilDay };
      if (hits("global", "all", `d:${day}`) >= limits.globalPerDay) return { ok: false, reason: "rate", retryAfterSec: untilDay };
      // No one actor can spend the whole day's allowance in minutes.
      if (hits("global", "all", `h:${hour}`) >= limits.globalPerHour) return { ok: false, reason: "rate", retryAfterSec: Math.max(1, Math.ceil((HOUR - (at % HOUR)) / 1000)) };

      const dayRow = q.spendRow.get(`d:${day}`) ?? { reserved: 0, settled: 0 };
      if (dayRow.reserved + dayRow.settled + amountMicro > budget.dailyMicro) return { ok: false, reason: "budget", retryAfterSec: untilDay };
      if (budget.monthlyMicro !== null) {
        const monthRow = q.spendRow.get(`m:${month}`) ?? { reserved: 0, settled: 0 };
        if (monthRow.reserved + monthRow.settled + amountMicro > budget.monthlyMicro) {
          return { ok: false, reason: "budget", retryAfterSec: secondsToNextUtcMonth(at) };
        }
      }

      q.jobInsert.run(requestId, ip, session, amountMicro, day, month, at + ttlMs);
      move(day, month, amountMicro, 0, 1);
      q.hitBump.run("ip", ip, `m:${minute}`);
      q.hitBump.run("ip", ip, `d:${day}`);
      q.hitBump.run("net", net, `d:${day}`);
      q.hitBump.run("session", session, `d:${day}`);
      q.hitBump.run("global", "all", `d:${day}`);
      q.hitBump.run("global", "all", `h:${hour}`);
      return { ok: true, id: requestId };
    });
  }

  /** The provider answered (or was reached and cut off): charge what it reports, or the whole reservation. */
  function settle(id, actualMicro) {
    return transaction(() => {
      const job = q.jobRow.get(id);
      if (!job || job.state !== "open") return;
      move(job.day, job.month, -job.amount, actualMicro, 0);
      q.jobState.run("settled", id);
    });
  }

  /** Only for a reservation whose provider call was never made. */
  function release(id) {
    return transaction(() => {
      const job = q.jobRow.get(id);
      if (!job || job.state !== "open") return;
      move(job.day, job.month, -job.amount, 0, 0);
      q.jobState.run("released", id);
    });
  }

  /** What has been spent and held so far in a UTC day, in micro-dollars. */
  function today() {
    const day = new Date(now()).toISOString().slice(0, 10);
    const row = q.spendRow.get(`d:${day}`) ?? { reserved: 0, settled: 0, requests: 0 };
    return { reserved: row.reserved, settled: row.settled, requests: row.requests };
  }

  return {
    reserve,
    settle,
    release,
    today,
    /** A maintainer's kill switch: the file `DISABLED` in the data directory. Read on every request, shared by every instance. */
    killed: () => existsSync(join(dir, "DISABLED")),
    close: () => db.close(),
  };
}

/**
 * Opens the ledger without throwing: `{ ledger }`, or `{ error }` when the state directory or the database cannot be
 * used (a read-only volume, a full disk). The server then runs with paid generation off rather than not at all.
 */
export function openLedgerSafely(options) {
  return Promise.resolve()
    .then(() => ({ ledger: openLedger(options) }))
    .catch((error) => ({ error: String(error?.code ?? error?.message ?? error) }));
}

