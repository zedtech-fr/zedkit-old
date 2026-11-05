// Measures docs first-load JavaScript from the static export (what the browser
// downloads before hydration): head scripts plus the Turbopack bootstrap chunks.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/** Gzip bytes (sum per file) for home `/`. Raise in the PR that grows first load. Raised to 420000 by maintainer decision. */
export const HOME_FIRST_LOAD_GZIP_BUDGET = 420_000;

const CHUNK_SRC = /\/_next\/static\/chunks\/[^"]+\.js/;

/**
 * @param {string} html
 * @returns {string[]} paths like /_next/static/chunks/foo.js
 */
export function collectFirstLoadChunkPaths(html) {
  const paths = new Set();
  const headEnd = html.indexOf("</head>");
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;

  for (const match of head.matchAll(/<script[^>]+src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)) {
    paths.add(match[1]);
  }

  for (const match of html.matchAll(
    /<script[^>]*>\(globalThis\["TURBOPACK"\][\s\S]*?otherChunks":\[([^\]]+)\]/g,
  )) {
    for (const chunk of match[1].matchAll(/"static\/chunks\/([^"]+)"/g)) {
      paths.add(`/_next/static/chunks/${chunk[1]}`);
    }
  }

  for (const match of html.matchAll(
    /<script src="(\/_next\/static\/chunks\/[^"]+\.js)" async=""><\/script>\s*<div hidden id="S:/g,
  )) {
    paths.add(match[1]);
  }

  return [...paths].filter((p) => CHUNK_SRC.test(p)).sort();
}

/**
 * @param {string} outDir absolute path to apps/docs/out
 * @param {string} htmlRel e.g. index.html
 */
export function measureFirstLoadGzip(outDir, htmlRel) {
  const html = readFileSync(join(outDir, htmlRel), "utf8");
  const paths = collectFirstLoadChunkPaths(html);
  let gzipBytes = 0;
  let rawBytes = 0;
  for (const rel of paths) {
    const file = join(outDir, rel);
    const buf = readFileSync(file);
    rawBytes += buf.length;
    gzipBytes += gzipSync(buf).length;
  }
  return { paths, gzipBytes, rawBytes };
}

/**
 * @param {{ gzipBytes: number, budget: number, label: string }} opts
 * @returns {string[]}
 */
export function budgetErrors({ gzipBytes, budget, label }) {
  if (gzipBytes <= budget) return [];
  return [
    `${label}: first-load JS gzip is ${gzipBytes} bytes (sum per chunk), budget ${budget}`,
  ];
}
