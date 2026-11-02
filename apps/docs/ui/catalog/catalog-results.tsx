import Link from "next/link";
import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import type { CatalogIndexEntry } from "@/content/catalog-index";
import { groupCatalogResults } from "@/lib/catalog-result-groups.mjs";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

function CatalogRow({ entry }: { entry: CatalogIndexEntry }) {
  return (
    <Stack
      direction="horizontal"
      gap={3}
      className="flex-wrap items-center justify-between border-b border-border pb-2"
    >
      <Stack gap={1} className="min-w-0 flex-1">
        <Link href={entry.href} className="font-medium underline-offset-4 hover:underline">
          {entry.title}
        </Link>
        <Text variant="muted" className="text-sm">
          {entry.need}
        </Text>
      </Stack>
      <MaturityBadge status={entry.status} />
    </Stack>
  );
}

function EntryColumns({ entries }: { entries: CatalogIndexEntry[] }) {
  const mid = Math.ceil(entries.length / 2);
  const halves = [entries.slice(0, mid), entries.slice(mid)];
  return (
    <Stack className="grid min-w-0 gap-x-12 gap-y-3 xl:grid-cols-2">
      {halves.map((half, index) => (
        <Stack key={index} gap={3} className="min-w-0">
          {half.map((entry) => (
            <CatalogRow key={entry.href} entry={entry} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function resultsStatusLine(filtered: CatalogIndexEntry[]) {
  return (
    <span role="status" aria-live="polite">
      {catalogCopy.results.statusLine(filtered.length)}
    </span>
  );
}

/** Results title row — lives in the default-width filters band for column alignment. */
export function CatalogResultsHeader({ filtered }: { filtered: CatalogIndexEntry[] }) {
  return (
    <div className="flex items-start justify-between gap-4" data-catalog-results-heading="">
      <div>
        <Heading level={2} id="catalog-results-heading">
          {catalogCopy.results.heading}
        </Heading>
        <Text variant="muted">{resultsStatusLine(filtered)}</Text>
      </div>
    </div>
  );
}

/** Result rows — separate chunk so filters + shell hydrate first (#618). */
export function CatalogResultsBody({ filtered }: { filtered: CatalogIndexEntry[] }) {
  const groups = groupCatalogResults(filtered);
  return (
    <Stack gap={4} data-catalog-results-root="">
      <section data-slot="section" className="space-y-4" aria-label={catalogCopy.results.sectionAriaLabel}>
        {filtered.length === 0 ? (
          <Stack gap={2}>
            <Text variant="muted">{catalogCopy.results.empty}</Text>
            <Link href="/catalog" className="text-sm text-primary underline-offset-4 hover:underline">
              {catalogCopy.results.clearFiltersLink}
            </Link>
          </Stack>
        ) : (
          <Stack gap={6} data-catalog-results="">
            {groups.length > 1 ? (
              <nav aria-label={catalogCopy.results.jumpNavAriaLabel} className="xl:hidden">
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`#catalog-group-${group.id}`}
                      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {catalogCopy.results.groupJumpLink(group.label, group.entries.length)}
                    </Link>
                  ))}
                </Stack>
              </nav>
            ) : null}
            {groups.map((group) => (
              <Stack key={group.id} gap={3} id={`catalog-group-${group.id}`} data-catalog-group={group.id}>
                <Heading level={2} className="text-lg">
                  {catalogCopy.results.groupHeading(group.label, group.entries.length)}
                </Heading>
                <EntryColumns entries={group.entries} />
              </Stack>
            ))}
          </Stack>
        )}
      </section>
    </Stack>
  );
}

/** @deprecated Use CatalogResultsHeader + CatalogResultsBody from the catalog shell. */
export function CatalogResults({ filtered }: { filtered: CatalogIndexEntry[] }) {
  return (
    <Stack gap={4}>
      <CatalogResultsHeader filtered={filtered} />
      <CatalogResultsBody filtered={filtered} />
    </Stack>
  );
}
