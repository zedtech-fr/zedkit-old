"use client";

import { CalendarDays, LayoutDashboard, Server, Settings, Sparkles, Users, type LucideIcon } from "lucide-react";
import { Button, LivePulse, ProgressBar, Stack, Text } from "@zedtech/zedkit-ui";
import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";
import { DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { HeroAvatar } from "@/ui/home/home-hero-team";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import type { HeroPageId } from "@/ui/home/i18n/home-hero-copy";

const copy = homeCopy.heroApp;

const HERO_NAV: readonly { id: HeroPageId; icon: LucideIcon }[] = [
  { id: "overview", icon: LayoutDashboard },
  { id: "apps", icon: Server },
  { id: "calendar", icon: CalendarDays },
  { id: "team", icon: Users },
  { id: "settings", icon: Settings },
];

type NavProps = { page: HeroPageId; onPage: (id: HeroPageId) => void };

/**
 * The window's frame: sidebar, top bar, content. It is the kit's AppShell layout (same tokens, same classes) without
 * the landmarks: AppShell renders `main`, `aside` and `header`, and a page can have only one `main`. This window sits
 * inside the home page's own `main`, so its parts are plain blocks and the page keeps one landmark of each kind.
 */
export function HeroShell({ sidebar, topbar, children }: { sidebar: React.ReactNode; topbar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div data-hero-shell="" className="flex w-full min-w-0">
      <div data-hero-sidebar="" className="flex w-app-shell-sidebar shrink-0 flex-col border-r bg-muted/40 max-md:hidden">
        {sidebar}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b bg-background/95">{topbar}</div>
        <div data-hero-main="" className="min-h-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/** One entry. In the sidebar it carries `data-tour-nav` (the tour clicks it); in the phone bar it is a chip. */
function NavButton({ id, icon: Icon, active, onSelect, compact }: (typeof HERO_NAV)[number] & { active: boolean; onSelect: (id: HeroPageId) => void; compact?: boolean }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      aria-current={active ? "page" : undefined}
      // The chip row scrolls sideways and clips what is drawn outside it, so a chip draws its focus ring inside itself.
      className={compact ? "min-h-11 shrink-0 gap-2 px-3 focus-visible:-outline-offset-(--ring-width)" : "w-full justify-start gap-2 lg:max-xl:justify-center lg:max-xl:px-0"}
      onClick={() => onSelect(id)}
      data-tour-nav={compact ? undefined : id}
    >
      <Icon className="size-4" aria-hidden />
      <span className={compact ? undefined : "lg:max-xl:sr-only"}>{copy.pages[id]}</span>
    </Button>
  );
}

/** From lg to xl the window is narrow, so the sidebar shrinks to icons (the names stay for assistive tech). */
export function HeroSidebar({ page, onPage }: NavProps) {
  return (
    <Stack gap={4} className="h-full p-3 lg:max-xl:px-2">
      <Stack gap={1} className="lg:max-xl:hidden">
        <Text className="font-semibold">{projectTrackerDemoCopy.brand}</Text>
        <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
          {projectTrackerDemoCopy.product}
        </Text>
      </Stack>
      <nav aria-label={copy.navAriaLabel}>
        <Stack gap={1}>
          {HERO_NAV.map((item) => (
            <Stack key={item.id} data-hero-nav-item="">
              <NavButton {...item} active={item.id === page} onSelect={onPage} />
            </Stack>
          ))}
        </Stack>
      </nav>
      <Stack gap={2} className="mt-auto lg:max-xl:hidden">
        <ProgressBar value={62} label={projectTrackerDemoCopy.sprintLabel} />
        <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
          {projectTrackerDemoCopy.sprintCaption}
        </Text>
      </Stack>
    </Stack>
  );
}

type AgentToggle = { open: boolean; panelId: string; onToggle: () => void };

/** Opens the agent panel. The tour presses it like any other control (`data-hero-agent-open`). */
function AgentButton({ open, panelId, onToggle }: AgentToggle) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="max-md:min-h-11"
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      onClick={onToggle}
      data-hero-agent-open=""
    >
      <Sparkles className="size-4" aria-hidden />
      {copy.agent.open}
    </Button>
  );
}

export function HeroTopBar({ page, onPage, agent }: NavProps & { agent: AgentToggle }) {
  return (
    <Stack gap={1}>
      <Stack direction="horizontal" gap={2} className="min-h-12 items-center justify-between px-4">
        <Text as="span" className="min-w-0 truncate text-sm" data-hero-crumb="">
          <Text as="span" variant="muted" className="text-sm max-md:hidden">
            {projectTrackerDemoCopy.brand} /{" "}
          </Text>
          <Text as="span" className="text-sm font-medium" key={page}>
            {copy.pages[page]}
          </Text>
        </Text>
        <Stack direction="horizontal" gap={3} className="shrink-0 items-center">
          <AgentButton {...agent} />
          <LivePulse />
          <HeroAvatar initials={projectTrackerDemoCopy.initials} />
        </Stack>
      </Stack>
      {/* Below md the sidebar is gone, so the pages move into the bar. */}
      <nav aria-label={copy.navAriaLabel} className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {HERO_NAV.map((item) => (
          <NavButton key={item.id} {...item} active={item.id === page} onSelect={onPage} compact />
        ))}
      </nav>
    </Stack>
  );
}
