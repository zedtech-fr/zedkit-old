export type DataTableSurfaceState = "rows" | "loading" | "error" | "no-results" | "empty-dataset";

export function resolveDataTableSurfaceState(input: {
  loading: boolean;
  error: string | null;
  filteredRowCount: number;
  dataRowCount: number;
  globalFilter: string;
}): DataTableSurfaceState {
  if (input.error !== null) return "error";
  if (input.loading) return "loading";
  if (input.filteredRowCount > 0) return "rows";
  if (input.dataRowCount === 0) return "empty-dataset";
  if (input.globalFilter.trim().length > 0) return "no-results";
  return "empty-dataset";
}
