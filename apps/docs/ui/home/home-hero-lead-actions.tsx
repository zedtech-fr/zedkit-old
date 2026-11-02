"use client";

import Link from "next/link";
import { Button, Stack } from "@zedtech/zedkit-ui";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeHeroLeadActions() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-center" data-home-hero-actions>
      <Button asChild>
        <Link href="#get-started">{homeCopy.heroActions.getStarted}</Link>
      </Button>
      <Button asChild variant="link" className="h-11 px-2">
        <Link href="/catalog">{homeCopy.heroActions.browseCatalog}</Link>
      </Button>
    </Stack>
  );
}
