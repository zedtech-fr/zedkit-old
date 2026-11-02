import type { LucideIcon } from "lucide-react";
import { Ban, Beaker, CircleCheck, CircleDashed, FlaskConical } from "lucide-react";
import type { BadgeProps } from "@zedtech/zedkit-ui";

export type MaturityBadgeVariant = NonNullable<BadgeProps["variant"]>;

const MATURITY_ICONS = {
  stable: CircleCheck,
  beta: FlaskConical,
  alpha: Beaker,
  planned: CircleDashed,
  deprecated: Ban,
} as const;

/** Catalog maturity strings → badge variants with readable contrast on kit tokens. */
export function maturityBadgeVariant(status: string): MaturityBadgeVariant {
  switch (status.toLowerCase()) {
    case "stable":
      return "outline";
    case "beta":
      return "secondary";
    case "alpha":
      // Outline, not the solid warning fill: the heaviest chip on a page should not outweigh the names it labels.
      return "outline";
    case "planned":
      return "outline";
    case "deprecated":
      return "destructive";
    default:
      return "secondary";
  }
}

/** Alpha keeps its warning colour on the border and the icon; the label stays in the text colour (4.5:1). */
export function maturityBadgeClass(status: string): string {
  return status.toLowerCase() === "alpha" ? "border-warning [&_svg]:text-warning" : "";
}

export function maturityIconFor(status: string): LucideIcon {
  const icon = MATURITY_ICONS[status.toLowerCase() as keyof typeof MATURITY_ICONS];
  if (!icon) throw new Error(`maturity-status: no icon mapped for "${status}"`);
  return icon;
}
