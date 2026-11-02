"use client";

import Link from "next/link";
import { Badge, IconLabel } from "@zedtech/zedkit-ui";
import { maturityDocHref } from "@/content/maturity-compatibility";
import { maturityBadgeClass, maturityBadgeVariant, maturityIconFor } from "@/lib/maturity-status";

export function MaturityBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  if (key === "stable") return null;
  return (
    <Badge
      asChild
      variant={maturityBadgeVariant(status)}
      className={`no-underline hover:no-underline ${maturityBadgeClass(status)}`}
    >
      <Link href={maturityDocHref} data-badge-link="">
        <IconLabel icon={maturityIconFor(status)} className="text-current">
          {status}
        </IconLabel>
      </Link>
    </Badge>
  );
}
