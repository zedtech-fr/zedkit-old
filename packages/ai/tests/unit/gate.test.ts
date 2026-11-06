import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gateMain, runGate } from "#gate.js";
import { checkSetup } from "#setup-check.js";
import { put, tempDir } from "./helpers.js";

const lines = (path: string): string[] => readFileSync(path, "utf8").trimEnd().split("\n");

/** The log passes the same check `validate --setup` runs on gate logs. */
function logIssues(root: string, name: string): string[] {
  put(root, "PLAN.md", "PLAN.md\nintro-first: printed before any tool call (fresh)\n");
  put(root, ".agents/setup-log.md", `| gates/${name} | cmd | 0 |\n`);
  return checkSetup(root).issues.filter((issue) => issue.path.endsWith(".log")).map((issue) => issue.message);
}

async function gate(options: Parameters<typeof runGate>[0]) {
  const result = await runGate(options);
  if (!result.ok) throw result.error;
  return result.value;
}

describe("runGate", () => {
  it("writes the CMD/START/END/EXIT contract that validate --setup accepts", async () => {
    const root = tempDir();
    const log = join(root, ".agents/setup-log/gates/ok.log");
    const result = await gate({ cmd: "echo hello", log });
    expect(result).toEqual({ code: 0, log });
    const out = lines(log);
    expect(out[0]).toBe("CMD: echo hello");
    expect(out[1]).toMatch(/^START: \d{4}-/u);
    expect(out).toContain("hello");
    expect(out.at(-2)).toMatch(/^END: \d{4}-/u);
    expect(out.at(-1)).toBe("EXIT:0");
    expect(logIssues(root, "ok.log")).toEqual([]);
  });

  it("records a failing exit code and puts END on its own line after unterminated output", async () => {
    const root = tempDir();
    const log = join(root, "gates/fail.log");
    const result = await gate({ cmd: "printf no-newline; exit 3", log });
    expect(result.code).toBe(3);
    expect(result.cause).toBeUndefined();
    const out = lines(log);
    expect(out).toContain("no-newline");
    expect(out.at(-1)).toBe("EXIT:3");
    expect(logIssues(root, "fail.log")).toEqual([]);
  });

  it("replaces an older log instead of appending after its EXIT line", async () => {
    const root = tempDir();
    const log = join(root, "gates/again.log");
    put(root, "gates/again.log", "CMD: old\nEXIT:1\n");
    await gate({ cmd: "true", log });
    const out = lines(log);
    expect(out[0]).toBe("CMD: true");
    expect(out.filter((line) => line.startsWith("EXIT:"))).toEqual(["EXIT:0"]);
  });

  it("caps the heap unless the env already sets one, or the cap is off", async () => {
    const root = tempDir();
    const env = (NODE_OPTIONS?: string): NodeJS.ProcessEnv => ({ PATH: process.env.PATH, ...(NODE_OPTIONS && { NODE_OPTIONS }) });
    const read = async (name: string, options: Partial<Parameters<typeof runGate>[0]>): Promise<string> => {
      const log = join(root, `${name}.log`);
      await gate({ cmd: 'echo "opts=[$NODE_OPTIONS]"', log, ...options });
      return lines(log).find((line) => line.startsWith("opts=")) ?? "";
    };
    expect(await read("default", { env: env() })).toBe("opts=[--max-old-space-size=4096]");
    expect(await read("custom", { env: env(), heapMb: 2048 })).toBe("opts=[--max-old-space-size=2048]");
    expect(await read("kept", { env: env("--max-old-space-size=1024") })).toBe("opts=[--max-old-space-size=1024]");
    expect(await read("merged", { env: env("--no-warnings") })).toBe("opts=[--no-warnings --max-old-space-size=4096]");
    expect(await read("off", { env: env(), heapMb: 0 })).toBe("opts=[]");
  });

  it("records a timeout as EXIT:124 with a cause", async () => {
    const root = tempDir();
    const log = join(root, "gates/slow.log");
    const result = await gate({ cmd: "sleep 30", log, timeoutMs: 100 });
    expect(result).toEqual({ code: 124, cause: "timeout", log });
    const out = lines(log);
    expect(out.at(-2)).toBe("CAUSE: timeout after 100ms");
    expect(out.at(-1)).toBe("EXIT:124");
    expect(logIssues(root, "slow.log")).toEqual([]);
  });

  it("names a signal-killed command and keeps the log closed", async () => {
    const root = tempDir();
    const log = join(root, "gates/sig.log");
    const result = await gate({ cmd: "kill -TERM $$", log });
    expect(result.cause).toBe("signal");
    expect(result.code).toBe(143);
    expect(lines(log).at(-1)).toBe("EXIT:143");
    expect(logIssues(root, "sig.log")).toEqual([]);
  });

  it("flags an out-of-memory abort from the output, and a SIGKILL as possible OOM", async () => {
    const root = tempDir();
    const heap = join(root, "gates/heap.log");
    const first = await gate({ cmd: 'echo "FATAL ERROR: JavaScript heap out of memory"; exit 134', log: heap });
    expect(first).toEqual({ code: 134, cause: "out-of-memory", log: heap });
    expect(lines(heap).at(-2)).toContain("CAUSE: out of memory");
    const killed = await gate({ cmd: "kill -KILL $$", log: join(root, "gates/kill.log") });
    expect(killed.cause).toBe("out-of-memory");
    expect(killed.code).toBe(137);
  });

  it("stops the command and closes the log when the wrapper gets SIGTERM", async () => {
    const root = tempDir();
    const log = join(root, "gates/term.log");
    const pending = gate({ cmd: "sleep 30", log });
    setTimeout(() => process.emit("SIGTERM"), 100);
    const result = await pending;
    expect(result.cause).toBe("signal");
    expect(lines(log).at(-1)).toMatch(/^EXIT:\d+$/u);
    expect(process.listenerCount("SIGTERM")).toBe(0);
  });

  it("does not hold command output in memory", async () => {
    const root = tempDir();
    const log = join(root, "gates/big.log");
    const result = await gate({ cmd: "head -c 5000000 /dev/zero | tr '\\0' x", log });
    expect(result.code).toBe(0);
    expect(statSync(log).size).toBeGreaterThan(5_000_000);
    expect(lines(log).at(-1)).toBe("EXIT:0");
  });

  it("closes the log with EXIT:127 when the command cannot start", async () => {
    const root = tempDir();
    const log = join(root, "gates/nostart.log");
    const result = await gate({ cmd: "true", log, cwd: join(root, "missing") });
    expect(result.code).toBe(127);
    const out = lines(log);
    expect(out.at(-2)).toContain("CAUSE: could not start");
    expect(out.at(-1)).toBe("EXIT:127");
  });

  it("returns an error result when the log cannot be created", async () => {
    const root = tempDir();
    put(root, "file", "x");
    const result = await runGate({ cmd: "true", log: join(root, "file/sub/x.log") });
    expect(result.ok).toBe(false);
  });
});

describe("gateMain", () => {
  const sinks = () => {
    const out: string[] = [];
    const errors: string[] = [];
    return { out, errors, sinks: { out: (l: string) => out.push(l), err: (l: string) => errors.push(l) } };
  };

  it("runs the command after `--` and returns its exit code", async () => {
    const root = tempDir();
    const log = join(root, "g.log");
    const s = sinks();
    expect(await gateMain([log, "--", "sh", "-c", "echo 'a b'; exit 4"], s.sinks)).toBe(4);
    expect(s.out).toEqual([`gate: ${log} EXIT:4`]);
    expect(lines(log)).toContain("a b");
    expect(lines(log)[0]).toBe("CMD: sh -c 'echo '\\''a b'\\''; exit 4'");
  });

  it("accepts one shell line without `--`", async () => {
    const root = tempDir();
    const log = join(root, "g.log");
    expect(await gateMain([log, "echo one && echo two"], sinks().sinks)).toBe(0);
    expect(lines(log)).toEqual(expect.arrayContaining(["one", "two"]));
  });

  it("exits 2 with usage when the log or command is missing", async () => {
    for (const args of [[], ["only.log"], ["only.log", "--"]]) {
      const s = sinks();
      expect(await gateMain(args, s.sinks), args.join(" ")).toBe(2);
      expect(s.errors[0]).toContain("usage: zedkit-ai gate");
    }
  });
});
