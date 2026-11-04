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
  title: "zedkit — AI-ready UI kit, SEO and agent setup",
  description:
    "Build the parts you need: an AI-ready React UI kit as npm packages or shadcn registry source, plus core, SEO, and agent setup.",
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
