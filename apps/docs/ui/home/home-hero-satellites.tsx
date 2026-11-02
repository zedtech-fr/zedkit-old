import { Check } from "lucide-react";
import { Card, Text } from "@zedtech/zedkit-ui";
import { HERO_ONLINE_COUNT, HERO_PEOPLE } from "@/ui/home/home-hero-team";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroApp.satellites;

type SatelliteKind = "notice" | "online";

/**
 * Two small cards that sit over the window's edges and move a little with the pointer and the page.
 * They are real kit components in the same look as the window, but decorative: they repeat what the window shows,
 * so they are hidden from assistive tech and out of the tab order. Each is shown from the md breakpoint up.
 *
 * Three layers keep the motions apart (see `home-hero.css`): the outer one follows the pointer, the middle one drifts
 * with the page scroll, the inner one enters and floats. None of them wraps anything positioned against the viewport.
 */
function Satellite({ kind, children }: { kind: SatelliteKind; children: React.ReactNode }) {
  return (
    <div aria-hidden="true" inert data-hero-satellite={kind} className="pointer-events-none absolute z-10 max-md:hidden">
      <div data-hero-drift="">
        <div data-hero-float="">{children}</div>
      </div>
    </div>
  );
}

export function HomeHeroSatellites() {
  return (
    <>
      <Satellite kind="notice">
        <Card className="flex items-center gap-3 p-3" data-hero-notice="">
          <span data-hero-avatar="" className="flex shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col">
            <Text className="truncate text-sm font-medium">{copy.mergedTitle}</Text>
            <Text variant="muted" className="truncate text-xs">
              {copy.mergedBody}
            </Text>
          </span>
        </Card>
      </Satellite>
      <Satellite kind="online">
        <Card className="flex items-center gap-3 p-3">
          <span className="flex -space-x-1.5" data-hero-faces="">
            {HERO_PEOPLE.filter((person) => person.online).map((person) => (
              <span
                key={person.name}
                data-hero-avatar=""
                className="flex items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-semibold text-primary-foreground"
              >
                {person.initials}
              </span>
            ))}
          </span>
          <Text className="text-sm font-medium whitespace-nowrap">{copy.online(HERO_ONLINE_COUNT)}</Text>
        </Card>
      </Satellite>
    </>
  );
}
