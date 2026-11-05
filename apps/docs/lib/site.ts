import type { OpenGraphImage, SiteMetadata } from "@zedtech/zedkit-seo";

/** The published site. Preview builds override `docsSite.url`; install commands keep pointing here. */
export const PUBLIC_SITE_URL = "https://zedkit.app";

export const docsSite: SiteMetadata = {
  name: "zedkit",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? PUBLIC_SITE_URL,
  defaultLocale: "en",
  locales: ["en"],
};

export const homePage = {
  title: "zedkit — one-prompt AI setup and React UI kit",
  description:
    "One prompt gives your repo a top-notch AI setup: skills, subagents, review. Plus a React UI kit as npm packages or shadcn registry source, with core and SEO.",
};

export function pageUrl(pathname: string): string {
  const base = docsSite.url.replace(/\/$/, "");
  if (pathname === "/" || pathname === "") return `${base}/`;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function defaultOgImage(): OpenGraphImage {
  return {
    url: pageUrl("/opengraph-image"),
    width: 1200,
    height: 630,
  };
}
