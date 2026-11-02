"use client";

import Link from "next/link";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { registryBrickNameCopy } from "@/components/i18n/registry-brick-name-copy";
import { registryBrickDocHref } from "@/content/registry-site";

const DEFAULT_VISIBLE = 18;

const chipClassName =
  "inline-flex max-w-full items-center rounded-md bg-muted/70 px-2 py-0.5 font-mono text-xs text-foreground no-underline transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function RegistryBrickChip({ name }: { name: string }) {
  const href = registryBrickDocHref[name] ?? `/catalog?q=${encodeURIComponent(name)}`;
  return (
    <Link href={href} data-registry-brick="" className={chipClassName}>
      {name}
    </Link>
  );
}

/** Inline brick name in prose — monospace, no icon, no pill border. */
export function RegistryBrickInlineName({ name }: { name: string }) {
  return (
    <Text as="span" data-registry-brick="" className="font-mono text-sm text-foreground">
      {name}
    </Text>
  );
}

export function RegistryBrickList({
  names,
  visibleCount = DEFAULT_VISIBLE,
}: {
  names: readonly string[];
  visibleCount?: number;
}) {
  const collapsed = names.length > visibleCount;
  const shown = collapsed ? names.slice(0, visibleCount) : names;
  return (
    <Stack gap={2} data-registry-bricks="">
      <Text as="p" variant="muted" className="text-xs">
        {registryBrickNameCopy.published(names.length)}
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap" data-registry-brick-grid="">
        {shown.map((name) => (
          <RegistryBrickChip key={name} name={name} />
        ))}
      </Stack>
      {collapsed ? (
        <Link href="/docs/zedkit-and-shadcn" className="w-fit text-sm text-primary underline-offset-4 hover:underline">
          {registryBrickNameCopy.seeAll}
        </Link>
      ) : null}
    </Stack>
  );
}
