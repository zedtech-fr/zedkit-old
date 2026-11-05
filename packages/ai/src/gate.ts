// Original work by the same author.
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync, readSync, fstatSync, writeSync } from "node:fs";
import { constants } from "node:os";
import { dirname } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";

/** Why a gate did not end with its own exit code. */
export type GateCause = "timeout" | "signal" | "out-of-memory";

/** Options for {@link runGate}. */
export type GateOptions = {
  /** Shell line to run, recorded verbatim on the `CMD:` line. */
  cmd: string;
  /** Log file to create or replace, for example `.agents/setup-log/gates/test.log`. */
  log: string;
  cwd?: string;
  /** V8 heap cap in MB added to `NODE_OPTIONS` unless it already sets one. Default 4096; 0 leaves the env alone. */
  heapMb?: number;
  /** Kill the command after this many ms (SIGTERM, then SIGKILL after 5s). Exit recorded as 124. */
  timeoutMs?: number;
  env?: Readonly<Record<string, string | undefined>>;
};

/** Exit code recorded in the log, the cause when the gate did not end by itself, and the log path. */
export type GateResult = { code: number; cause?: GateCause; log: string };

const DEFAULT_HEAP_MB = 4096;
const KILL_GRACE_MS = 5000;
const TAIL_BYTES = 65_536;
const OOM_TEXT = /heap out of memory|allocation failed|out of memory/iu;

function withHeapCap(env: Readonly<Record<string, string | undefined>>, heapMb: number): Record<string, string | undefined> {
  const current = env.NODE_OPTIONS ?? "";
  if (heapMb <= 0 || current.includes("--max-old-space-size")) return { ...env };
  return { ...env, NODE_OPTIONS: `${current} --max-old-space-size=${heapMb}`.trim() };
}

function tail(fd: number): string {
  const size = fstatSync(fd).size;
  const length = Math.min(size, TAIL_BYTES);
  const buffer = Buffer.alloc(length);
  readSync(fd, buffer, 0, length, size - length);
  return buffer.toString("utf8");
}

function classify(code: number, signal: NodeJS.Signals | null, text: string): GateCause | undefined {
  if (OOM_TEXT.test(text) || code === 137 || signal === "SIGKILL") return "out-of-memory";
  return signal === null ? undefined : "signal";
}

/**
 * Run one gate command and persist it in the setup-log contract: `CMD:` first,
 * `START:`, the output, `END:`, an optional `CAUSE:`, and `EXIT:<code>` as the
 * last line. Output goes straight to the file (never buffered in memory), so a
 * heavy gate cannot take the wrapper down with it. A TERM or INT aimed at the
 * wrapper stops the command and still closes the log. Resolves with the exit
 * code; never rejects.
 */
export function runGate(options: GateOptions): Promise<Result<GateResult>> {
  const stamp = (): string => new Date().toISOString();
  const opened = tryCatch(() => {
    mkdirSync(dirname(options.log), { recursive: true });
    const fd = openSync(options.log, "w+");
    writeSync(fd, `CMD: ${options.cmd.replace(/\r?\n/gu, " ")}\nSTART: ${stamp()}\n`);
    return fd;
  });
  if (!opened.ok) return Promise.resolve(err(opened.error));
  const fd = opened.value;

  return new Promise((resolve) => {
    const child = spawn(options.cmd, {
      shell: true,
      cwd: options.cwd,
      env: withHeapCap(options.env ?? process.env, options.heapMb ?? DEFAULT_HEAP_MB),
      stdio: ["ignore", fd, fd],
    });
    let forced: GateCause | undefined;
    const timers: NodeJS.Timeout[] = [];
    const stop = (cause: GateCause): void => {
      if (forced !== undefined) return;
      forced = cause;
      child.kill("SIGTERM");
      timers.push(setTimeout(() => child.kill("SIGKILL"), KILL_GRACE_MS).unref());
    };
    const onTerm = (): void => stop("signal");
    process.on("SIGTERM", onTerm);
    process.on("SIGINT", onTerm);
    if (options.timeoutMs !== undefined) timers.push(setTimeout(() => stop("timeout"), options.timeoutMs));

    const finish = (code: number, signal: NodeJS.Signals | null, note?: string): void => {
      for (const timer of timers) clearTimeout(timer);
      process.off("SIGTERM", onTerm);
      process.off("SIGINT", onTerm);
      const closed = tryCatch(() => {
        const text = tail(fd);
        const cause = forced ?? classify(code, signal, text);
        const exit = forced === "timeout" ? 124 : code;
        const lines = [`END: ${stamp()}`];
        if (cause === "timeout") lines.push(`CAUSE: timeout after ${options.timeoutMs}ms`);
        else if (cause === "signal") lines.push(`CAUSE: killed by signal${signal ? ` ${signal}` : ""}`);
        else if (cause === "out-of-memory") lines.push("CAUSE: out of memory (heap limit or kill); rerun smaller, for example --concurrency=2");
        if (note) lines.push(`CAUSE: ${note}`);
        lines.push(`EXIT:${exit}`);
        const lead = text === "" || text.endsWith("\n") ? "" : "\n";
        writeSync(fd, `${lead}${lines.join("\n")}\n`);
        closeSync(fd);
        return { code: exit, ...(cause !== undefined && { cause }), log: options.log };
      });
      resolve(closed.ok ? ok(closed.value) : err(closed.error));
    };
    child.once("error", (error) => finish(127, null, `could not start: ${error.message}`));
    child.once("close", (code, signal) =>
      finish(code ?? (signal ? 128 + (constants.signals[signal] ?? 0) : 1), signal),
    );
  });
}

const quote = (word: string): string => (/^[\w@%+=:,./-]+$/u.test(word) ? word : `'${word.replace(/'/gu, "'\\''")}'`);

/** `zedkit-ai gate <log> [--] <command...>`: run a gate into a log, exit with its code. */
export async function gateMain(args: string[], sinks: { out: (line: string) => void; err: (line: string) => void }): Promise<number> {
  const rest = args[0] === "--" ? args.slice(1) : args;
  const [log, ...words] = rest;
  const argv = words[0] === "--" ? words.slice(1) : words;
  // One word is already a shell line; several are argv, so quote what the shell would split.
  const cmd = argv.length === 1 ? (argv[0] ?? "") : argv.map(quote).join(" ");
  if (!log || cmd === "") {
    sinks.err("error: usage: zedkit-ai gate <log> [--] <command...>");
    return 2;
  }
  const result = await runGate({ cmd, log });
  if (!result.ok) {
    sinks.err(`error: ${result.error.message}`);
    return 2;
  }
  sinks.out(`gate: ${log} EXIT:${result.value.code}${result.value.cause ? ` (${result.value.cause})` : ""}`);
  return result.value.code;
}
