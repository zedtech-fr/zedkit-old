"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Menu, Moon, Sun } from "lucide-react";
import { GithubIcon } from "@/ui/github-icon";
import { useTheme } from "next-themes";
import { useSidebar } from "fumadocs-ui/components/sidebar/base";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@zedtech/zedkit-ui";
import { MobileSearchTrigger } from "@/ui/mobile-search-trigger";
import { SiteBrand } from "@/ui/site-brand";
import { SiteFullSearchTrigger } from "@/ui/site-chrome";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { SITE_GITHUB_URL } from "@/lib/site-links.mjs";
import {
  SHELL_NAV_GUIDE_ITEM_CLASS,
  SHELL_NAV_GUIDE_LABEL_CLASS,
  SHELL_NAV_PRIMARY_ITEM_CLASS,
} from "@/lib/shell-nav-classes";
import {
  isSiteNavLinkActive,
  sitePrimaryNavLinks,
  SITE_GUIDE_LINKS,
  type SiteNavLink,
} from "@/lib/site-nav-data";

const iconButtonClassName =
  "inline-flex min-h-overlay-touch-target min-w-overlay-touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-ring-control";

const noop = () => () => {};

function ThemeButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className={className ?? iconButtonClassName}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Moon aria-hidden="true" className="size-4" /> : <Sun aria-hidden="true" className="size-4" />}
    </button>
  );
}

function DocsMenuButton() {
  const sidebar = useSidebar();
  return (
    <button
      type="button"
      aria-label="Open navigation"
      title="Open navigation"
      className={iconButtonClassName}
      onClick={() => sidebar.setOpen(true)}
    >
      <Menu aria-hidden="true" className="size-4" />
    </button>
  );
}

function NavDrawerLink({
  link,
  pathname,
  onNavigate,
  className,
}: {
  link: SiteNavLink;
  pathname: string;
  onNavigate: () => void;
  className: string;
}) {
  const active = isSiteNavLinkActive(pathname, link);
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${className}${active ? " bg-muted/80 text-foreground" : ""}`}
      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span className="min-w-0 flex-1">{link.text}</span>
      {link.external ? <ExternalLink aria-hidden="true" className="size-4 shrink-0 opacity-70" /> : null}
    </Link>
  );
}

function SiteNavDrawerBody({ changelogHref, onNavigate }: { changelogHref: string; onNavigate: () => void }) {
  const pathname = usePathname();
  const primary = sitePrimaryNavLinks(changelogHref);

  return (
    <div data-shell-nav-drawer className="flex max-h-[min(85dvh,640px)] flex-col gap-4 overflow-y-auto px-4 pt-2 pb-6">
      <div className="w-full [&_[data-search]]:w-full">
        <SiteFullSearchTrigger className="w-full max-w-none" />
      </div>
      <nav aria-label="Menu" className="flex flex-col gap-1">
        {primary.map((link) => (
          <NavDrawerLink
            key={link.href}
            link={link}
            pathname={pathname}
            onNavigate={onNavigate}
            className={SHELL_NAV_PRIMARY_ITEM_CLASS}
          />
        ))}
        <p className={SHELL_NAV_GUIDE_LABEL_CLASS}>Guides</p>
        {SITE_GUIDE_LINKS.map((link) => (
          <NavDrawerLink
            key={link.href}
            link={link}
            pathname={pathname}
            onNavigate={onNavigate}
            className={SHELL_NAV_GUIDE_ITEM_CLASS}
          />
        ))}
      </nav>
      <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4">
        <a
          href={SITE_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={`${SHELL_NAV_PRIMARY_ITEM_CLASS} inline-flex w-auto gap-2 text-muted-foreground`}
        >
          <GithubIcon className="size-4 shrink-0" />
          GitHub
        </a>
        <ThemeButton />
      </div>
    </div>
  );
}

function SiteNavDrawer({
  open,
  onOpenChange,
  changelogHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changelogHref: string;
}) {
  const close = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader className="sr-only">
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerDescription>Site navigation</DrawerDescription>
        </DrawerHeader>
        <SiteNavDrawerBody changelogHref={changelogHref} onNavigate={close} />
      </DrawerContent>
    </Drawer>
  );
}

function HomeMenuButton({ changelogHref }: { changelogHref: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        className={iconButtonClassName}
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden="true" className="size-4" />
      </button>
      <SiteNavDrawer open={open} onOpenChange={setOpen} changelogHref={changelogHref} />
    </>
  );
}

/**
 * Phone header (< md): brand and version at the left; menu, theme, and GitHub at the right.
 * Search opens from the header on phone (top bar + results sheet).
 */
export function MobileHeader({
  mode,
  className,
  version,
  releasesHref,
  changelogHref,
}: {
  mode: "home" | "docs";
  className?: string;
  version: string;
  releasesHref: string;
  changelogHref: string;
}) {
  return (
    <>
      <header
        id="nd-mobile-nav"
        className={
          className ??
          "sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b bg-background px-2 md:hidden"
        }
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href="/"
            aria-label="zedkit home"
            className="inline-flex min-h-overlay-touch-target items-center rounded-md px-1 text-foreground focus-ring-control"
          >
            <SiteBrand />
          </Link>
          <KitVersionLabel version={version} releasesHref={releasesHref} tone="shell" />
        </div>
        <div className="flex shrink-0 items-center">
          <MobileSearchTrigger className={iconButtonClassName} />
          <ThemeButton />
          <a href={SITE_GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className={iconButtonClassName}>
            <GithubIcon className="size-4" />
          </a>
          {mode === "docs" ? <DocsMenuButton /> : <HomeMenuButton changelogHref={changelogHref} />}
        </div>
      </header>
    </>
  );
}
