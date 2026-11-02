"use client";

import {
  Button,
  IconLabel,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@zedtech/zedkit-ui";
import { areaIconFor } from "@/lib/domain-icons";
import type { CatalogArea } from "@/content/catalog-index";

import { AREAS, areaLabel } from "@/ui/catalog/catalog-filter-constants";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

function CatalogSearchField({
  q,
  onFilters,
}: {
  q: string;
  onFilters: (next: { q?: string }) => void;
}) {
  return (
    <Stack gap={1} className="min-w-0 flex-1">
      <Label htmlFor="catalog-search">{catalogCopy.filters.searchLabel}</Label>
      <Input
        id="catalog-search"
        type="search"
        value={q}
        onChange={(event) => onFilters({ q: event.target.value })}
        placeholder={catalogCopy.filters.searchPlaceholder}
        data-catalog-filter-search=""
        className="shadow-none"
      />
    </Stack>
  );
}

function CatalogAreaSelect({
  area,
  onFilters,
}: {
  area: CatalogArea | "all";
  onFilters: (next: { area?: string }) => void;
}) {
  return (
    <Stack gap={1} className="sm:w-40">
      <Label htmlFor="catalog-area">{catalogCopy.filters.areaLabel}</Label>
      <Select value={area} onValueChange={(value) => onFilters({ area: value })}>
        <SelectTrigger id="catalog-area" data-catalog-filter-select="" className="shadow-none" aria-label={catalogCopy.filters.areaAriaLabel}>
          <SelectValue placeholder={catalogCopy.filters.areaPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {AREAS.map((row) => (
            <SelectItem key={row.id} value={row.id}>
              {row.id === "all" ? (
                row.label
              ) : (
                <IconLabel icon={areaIconFor(row.id)} className="text-current">
                  {row.label}
                </IconLabel>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Stack>
  );
}

function CatalogMaturitySelect({
  status,
  statuses,
  onFilters,
}: {
  status: string;
  statuses: string[];
  onFilters: (next: { status?: string }) => void;
}) {
  return (
    <Stack gap={1} className="sm:w-36">
      <Label htmlFor="catalog-maturity">{catalogCopy.filters.maturityLabel}</Label>
      <Select value={status} onValueChange={(value) => onFilters({ status: value })}>
        <SelectTrigger
          id="catalog-maturity"
          data-catalog-filter-select=""
          className="shadow-none"
          aria-label={catalogCopy.filters.maturityAriaLabel}
        >
          <SelectValue placeholder={catalogCopy.filters.maturityPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{catalogCopy.filters.maturityAll}</SelectItem>
          {statuses.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Stack>
  );
}

function CatalogActiveFilterChips({
  area,
  status,
  q,
  onFilters,
  onClear,
}: {
  area: CatalogArea | "all";
  status: string;
  q: string;
  onFilters: (next: { area?: string; status?: string; q?: string }) => void;
  onClear: () => void;
}) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
      {area !== "all" ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-pressed
          onClick={() => onFilters({ area: "all" })}
        >
          <IconLabel icon={areaIconFor(area)} className="text-current">
            {areaLabel(area)}
          </IconLabel>
        </Button>
      ) : null}
      {status !== "all" ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-pressed
          onClick={() => onFilters({ status: "all" })}
        >
          {status}
        </Button>
      ) : null}
      {q.trim().length > 0 ? (
        <Button type="button" size="sm" variant="secondary" aria-pressed onClick={() => onFilters({ q: "" })}>
          {catalogCopy.filters.searchChip(q.trim())}
        </Button>
      ) : null}
      <Button type="button" size="sm" variant="link" onClick={onClear}>
        {catalogCopy.filters.clearFilters}
      </Button>
    </Stack>
  );
}

export function CatalogFiltersToolbar({
  area,
  status,
  q,
  statuses,
  onFilters,
}: {
  area: CatalogArea | "all";
  status: string;
  q: string;
  statuses: string[];
  onFilters: (next: { area?: string; status?: string; q?: string }) => void;
}) {
  const hasActiveFilters = area !== "all" || status !== "all" || q.trim().length > 0;

  return (
    <Stack gap={3} data-catalog-toolbar="" aria-label={catalogCopy.filters.toolbarAriaLabel}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-catalog-filter-row="">
        <CatalogSearchField q={q} onFilters={onFilters} />
        <CatalogAreaSelect area={area} onFilters={onFilters} />
        <CatalogMaturitySelect status={status} statuses={statuses} onFilters={onFilters} />
      </div>
      {hasActiveFilters ? (
        <CatalogActiveFilterChips
          area={area}
          status={status}
          q={q}
          onFilters={onFilters}
          onClear={() => onFilters({ area: "all", status: "all", q: "" })}
        />
      ) : null}
    </Stack>
  );
}

export function catalogResultsStatusLine(count: number) {
  return (
    <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
      {catalogCopy.results.statusLine(count)}
    </span>
  );
}
