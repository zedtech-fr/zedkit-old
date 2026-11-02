"use client";

import * as React from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
  type SortDirection,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "./button.js";
import { EmptyState } from "./empty-state.js";
import { ErrorState } from "./error-state.js";
import { Input } from "./input.js";
import { Skeleton } from "./skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";
import { cn } from "./utils.js";
import { formatMessage } from "@zedtech/zedkit-i18n";

import { useUiMessages } from "./ui-provider.js";
import { resolveDataTableSurfaceState } from "./data-table-state.js";

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableColumn<TData extends RowData, TValue extends CellData> = ColumnDef<
  typeof features,
  TData,
  TValue
>;

export function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<typeof features, TData>();
}

export interface DataTableProps<TData extends RowData> {
  // `any` mirrors upstream: TanStack's own helper.columns() returns
  // Array<ColumnDef<TFeatures, TData, any>> since TValue is invariant.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ReadonlyArray<DataTableColumn<TData, any>>;
  data: TData[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** Shown below the filter when the dataset is empty (not a filter miss). */
  emptyAction?: React.ReactNode;
  /** Override for filter-with-no-rows; defaults to kit `empty` message. */
  noResultsMessage?: string;
  filterPlaceholder?: string;
  pageSize?: number;
}

function SortIcon({ direction }: { direction: SortDirection | false }) {
  const className = "size-icon-sm opacity-60";
  if (direction === "asc") return <ArrowUp className={className} aria-hidden />;
  if (direction === "desc") return <ArrowDown className={className} aria-hidden />;
  return <ArrowUpDown className={className} aria-hidden />;
}

function sortableHeaderLabel(header: { column: { columnDef: { header?: unknown }; id: string } }): string {
  const label = header.column.columnDef.header;
  return typeof label === "string" ? label : header.column.id;
}

function headerAriaSort(direction: SortDirection | false): "ascending" | "descending" | undefined {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return undefined;
}

function sortButtonLabel(label: string, direction: SortDirection | false): string {
  if (direction === "asc") return `${label}, sorted ascending`;
  if (direction === "desc") return `${label}, sorted descending`;
  return `${label}, sort`;
}

export interface DataTablePaginationProps {
  /** 1-based current page for display. */
  page: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export interface DataTableEmptyProps {
  colSpan: number;
  message?: React.ReactNode;
}

/**
 * Single centered row for the no-results state. `DataTable` renders
 * this when rows are empty; compose directly for custom table bodies.
 */
export function DataTableEmpty({ colSpan, message }: DataTableEmptyProps) {
  const messages = useUiMessages();
  return (
    <TableRow data-slot="data-table-empty">
      <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
        {message ?? messages.empty}
      </TableCell>
    </TableRow>
  );
}

/**
 * Page label plus previous/next controls. `DataTable` wires these to
 * the table state; compose directly for custom table chrome.
 */
export function DataTablePagination({
  page,
  pageCount,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  className,
}: DataTablePaginationProps) {
  const messages = useUiMessages();
  const pageCountShown = Math.max(pageCount, 1);
  return (
    <div data-slot="data-table-pagination" className={cn("flex items-center justify-end gap-2", className)}>
      <span className="text-sm text-muted-foreground">
        {formatMessage(messages.pageOf, { page, pageCount: pageCountShown })}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={!canPrevious}>
        {messages.previous}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        {messages.next}
      </Button>
    </div>
  );
}

export interface DataTableToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Global-filter input. `DataTable` wires it to the table state;
 * compose directly for custom table chrome.
 */
export function DataTableToolbar({ value, onChange, placeholder }: DataTableToolbarProps) {
  const messages = useUiMessages();
  const filter = placeholder ?? messages.filter;
  return (
    <Input
      data-slot="data-table-toolbar"
      placeholder={filter}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="max-w-data-table-filter-width"
      aria-label={filter}
    />
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage,
  emptyAction,
  noResultsMessage,
  filterPlaceholder,
  pageSize = 10,
}: DataTableProps<TData>) {
  const messages = useUiMessages();
  const table = useTable({ features, columns, data });
  const rows = table.getRowModel().rows;
  const { pageIndex } = table.state.pagination;
  const globalFilter = table.state.globalFilter ?? "";
  const surface = resolveDataTableSurfaceState({
    loading,
    error,
    filteredRowCount: rows.length,
    dataRowCount: data.length,
    globalFilter,
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [table, pageSize]);

  return (
    <div data-slot="data-table" className="space-y-4">
      <DataTableToolbar
        value={globalFilter}
        onChange={(value) => {
          table.setGlobalFilter(value);
          table.setPageIndex(0);
        }}
        placeholder={filterPlaceholder ?? messages.filter}
      />
      {surface === "error" ? <ErrorState description={error ?? ""} /> : null}
      {surface === "loading" ? (
        <div data-slot="data-table-loading" role="status" aria-label={messages.loading} className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">{messages.loadingEllipsis}</p>
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-4 w-full max-w-data-table-filter-width" />
            ))}
          </div>
        </div>
      ) : null}
      {surface === "no-results" ? (
        <EmptyState
          description={noResultsMessage ?? messages.empty}
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                table.setGlobalFilter("");
                table.setPageIndex(0);
              }}
            >
              {messages.clearFilters}
            </Button>
          }
        />
      ) : null}
      {surface === "empty-dataset" ? (
        <EmptyState description={emptyMessage ?? messages.empty} actions={emptyAction} />
      ) : null}
      <Table aria-busy={loading || undefined} aria-label={loading ? messages.loading : undefined}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => {
              const canSort = !header.isPlaceholder && header.column.getCanSort();
              const sorted = canSort ? header.column.getIsSorted() : false;
              const label = canSort ? sortableHeaderLabel(header) : "";
              return (
                <TableHead key={header.id} aria-sort={canSort ? headerAriaSort(sorted) : undefined}>
                  {canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "inline-flex min-h-(--zk-tap-min) items-center gap-data-table-sort-gap hover:text-foreground",
                      )}
                      aria-label={sortButtonLabel(label, sorted)}
                    >
                      <table.FlexRender header={header} />
                      <SortIcon direction={sorted} />
                    </button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {surface === "rows"
          ? rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}
      </TableBody>
      </Table>
      {surface === "rows" && table.getPageCount() > 1 ? (
        <DataTablePagination
          page={pageIndex + 1}
          pageCount={table.getPageCount()}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
        />
      ) : null}
    </div>
  );
}
