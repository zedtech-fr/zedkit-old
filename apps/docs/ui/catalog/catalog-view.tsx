"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import type { CatalogArea, CatalogIndexEntry } from "@/content/catalog-index";

import { AREAS } from "@/ui/catalog/catalog-filter-constants";
import { CatalogFiltersToolbar, catalogResultsStatusLine } from "@/ui/catalog/catalog-filters";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

const CatalogResultsBodyLazy = dynamic(
  () => import("@/ui/catalog/catalog-results").then((mod) => ({ default: mod.CatalogResultsBody })),
  {
    loading: () => (
      <Stack gap={4} data-catalog-results-root="">
        <Text variant="muted" role="status">
          {catalogCopy.header.loadingResults}
        </Text>
      </Stack>
    ),
  },
);

export const CATALOG_DEFAULT_FILTERS = { area: "all" as const, status: "all", q: "" };

function readFilter(
  searchParams: URLSearchParams,
  entries: CatalogIndexEntry[],
): { area: CatalogArea | "all"; status: string; q: string } {
  const areaParam = searchParams.get("area") ?? "all";
  const area = AREAS.some((row) => row.id === areaParam) ? (areaParam as CatalogArea | "all") : "all";
  const statusParam = searchParams.get("status") ?? "all";
  const statuses = new Set(entries.map((entry) => entry.status));
  const status = statusParam === "all" || statuses.has(statusParam) ? statusParam : "all";
  const q = searchParams.get("q") ?? "";
  return { area, status, q };
}

export function CatalogView({
  entries,
  area = CATALOG_DEFAULT_FILTERS.area,
  status = CATALOG_DEFAULT_FILTERS.status,
  q = CATALOG_DEFAULT_FILTERS.q,
  onFilters,
}: {
  entries: CatalogIndexEntry[];
  area?: CatalogArea | "all";
  status?: string;
  q?: string;
  onFilters?: (next: { area?: string; status?: string; q?: string }) => void;
}) {
  const statuses = useMemo(() => [...new Set(entries.map((entry) => entry.status))].sort(), [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((entry) => {
      if (area !== "all" && entry.area !== area) return false;
      if (status !== "all" && entry.status !== status) return false;
      if (needle.length === 0) return true;
      const hay = `${entry.title} ${entry.need} ${entry.package}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [entries, area, status, q]);

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    onFilters?.(next);
  }

  return (
    <>
      <Section bleed tone="muted" spacing="sm" containerWidth="default">
        <Stack gap={4}>
          <Stack gap={2}>
            <Heading level={1}>{catalogCopy.header.title}</Heading>
            <Text variant="muted" className="type-site-lead">
              {catalogCopy.header.lead}
            </Text>
          </Stack>

          <CatalogFiltersToolbar
            area={area}
            status={status}
            q={q}
            statuses={statuses}
            onFilters={setFilters}
          />
        </Stack>
      </Section>
      <Container width="wide" className="pt-3 pb-section-lg">
        <Stack gap={3}>
          <div id="catalog-results-heading" data-catalog-results-heading="">
            {catalogResultsStatusLine(filtered.length)}
          </div>
          <CatalogResultsBodyLazy filtered={filtered} />
        </Stack>
      </Container>
    </>
  );
}

/** URL filters after mount so the first client render matches the static HTML. */
export function CatalogViewFromUrl({ entries }: { entries: CatalogIndexEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilterState] = useState<ReturnType<typeof readFilter>>(CATALOG_DEFAULT_FILTERS);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const qDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = readFilter(new URLSearchParams(searchParams.toString()), entries);
    filtersRef.current = next;
    setFilterState(next);
  }, [entries, searchParams]);

  function pushFilterUrl(parsed: ReturnType<typeof readFilter>) {
    const params = new URLSearchParams();
    if (parsed.area !== "all") params.set("area", parsed.area);
    if (parsed.status !== "all") params.set("status", parsed.status);
    if (parsed.q) params.set("q", parsed.q);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    const merged = { ...filtersRef.current, ...next };
    const params = new URLSearchParams();
    if (merged.area !== "all") params.set("area", merged.area);
    if (merged.status !== "all") params.set("status", merged.status);
    if (merged.q) params.set("q", merged.q);
    const parsed = readFilter(params, entries);
    filtersRef.current = parsed;
    setFilterState(parsed);

    if (next.q !== undefined) {
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
      qDebounceRef.current = setTimeout(() => pushFilterUrl(parsed), 120);
      return;
    }
    if (qDebounceRef.current) {
      clearTimeout(qDebounceRef.current);
      qDebounceRef.current = null;
    }
    pushFilterUrl(parsed);
  }

  return (
    <CatalogView
      entries={entries}
      area={filters.area}
      status={filters.status}
      q={filters.q}
      onFilters={setFilters}
    />
  );
}
