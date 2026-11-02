import type { LinkItemType } from "fumadocs-ui/layouts/shared";

export type SiteNavLink = {
  text: string;
  href: string;
  external?: boolean;
  active?: "url" | "nested-url";
};

/** Guide entries shared by the desktop Guides menu and the phone nav drawer. */
export const SITE_GUIDE_LINKS: SiteNavLink[] = [
  { text: "Getting started", href: "/docs/getting-started", active: "url" },
  { text: "Start without writing code", href: "/docs/start-without-writing-code", active: "url" },
  { text: "Build an admin dashboard", href: "/docs/build-an-admin-dashboard", active: "url" },
  { text: "Set up your coding agents", href: "/docs/set-up-your-coding-agents", active: "url" },
  { text: "Add SEO to a Next.js app", href: "/docs/add-seo-to-nextjs", active: "url" },
  { text: "zedkit and shadcn/ui", href: "/docs/zedkit-and-shadcn", active: "url" },
  { text: "Maturity and compatibility", href: "/docs/maturity-and-compatibility", active: "url" },
  { text: "Note list example", href: "/examples/note-list", active: "url" },
];

export function sitePrimaryNavLinks(changelogHref: string): SiteNavLink[] {
  return [
    { text: "Documentation", href: "/docs", active: "nested-url" },
    { text: "Catalog", href: "/catalog", active: "url" },
    { text: "UI changelog", href: changelogHref, external: true },
  ];
}

export function isSiteNavLinkActive(pathname: string, link: SiteNavLink): boolean {
  if (link.external || !link.active) return false;
  if (link.active === "nested-url") {
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

/** Fumadocs header link model (desktop chrome). */
export function siteHeaderLinks(changelogHref: string): LinkItemType[] {
  return [
    { text: "Documentation", url: "/docs", active: "nested-url" },
    { text: "Catalog", url: "/catalog", active: "url" },
    {
      type: "menu",
      text: "Guides",
      items: SITE_GUIDE_LINKS.map((item) => ({
        text: item.text,
        url: item.href,
        active: item.active ?? "url",
      })),
    },
    { text: "UI changelog", url: changelogHref, external: true },
  ];
}
