import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Extra routes the sitemap sweep should cover even if they are not listed yet. */
export const EXTRA_SITEMAP_ROUTES = ["/features/identity-editor", "/features/identity-kit-demos"];

function sitemapCandidates(): string[] {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [path.join(process.cwd(), "out/sitemap.xml"), path.join(here, "../out/sitemap.xml")];
}

/**
 * Published docs routes from the static-export sitemap. CI builds docs before
 * `e2e:routes`, so `apps/docs/out/sitemap.xml` exists at collection time and
 * every shard sees the same list (required for Playwright `--shard`).
 */
export function publishedRoutes(): string[] {
  const sitemapPath = sitemapCandidates().find((file) => existsSync(file));
  if (!sitemapPath) {
    throw new Error("apps/docs/out/sitemap.xml is missing; build the docs static export before e2e:routes");
  }
  const xml = readFileSync(sitemapPath, "utf8");
  const paths = [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]!.replace(/\/$/, "") || "/");
  return [...new Set([...paths, ...EXTRA_SITEMAP_ROUTES])].sort();
}
