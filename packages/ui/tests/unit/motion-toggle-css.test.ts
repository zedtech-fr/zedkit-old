import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

const SHEETS = ["motion.css", "scroll-scenes.css", "signature-motion.css", "styles.css", "parallax.css"] as const;

describe("in-app motion toggle CSS", () => {
  it.each(SHEETS)("gates %s with :root:not([data-motion=reduce])", (file) => {
    expect(read(file)).toContain(':root:not([data-motion="reduce"])');
  });

  it.each(["motion.css", "signature-motion.css", "styles.css"] as const)(
    "kills always-on motion in %s when data-motion is reduce",
    (file) => {
      expect(read(file)).toContain(':root[data-motion="reduce"]');
    },
  );

  it("keeps ScrollScenes pinning inside the toggle gate, so reduce falls back to the stacked layout", () => {
    const css = read("scroll-scenes.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const gate = css.indexOf(':root:not([data-motion="reduce"])');
    const sticky = css.indexOf("position: sticky");
    expect(gate).toBeGreaterThan(-1);
    expect(sticky).toBeGreaterThan(gate);
  });
});
