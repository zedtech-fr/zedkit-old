import { describe, expect, it } from "vitest";

import { resolveDataTableSurfaceState } from "#data-table-state.js";

describe("resolveDataTableSurfaceState", () => {
  it("prioritises error and loading over row counts", () => {
    expect(
      resolveDataTableSurfaceState({
        loading: true,
        error: "Boom",
        filteredRowCount: 0,
        dataRowCount: 0,
        globalFilter: "",
      }),
    ).toBe("error");
    expect(
      resolveDataTableSurfaceState({
        loading: true,
        error: null,
        filteredRowCount: 2,
        dataRowCount: 2,
        globalFilter: "",
      }),
    ).toBe("loading");
  });

  it("distinguishes an empty dataset from a filter miss", () => {
    expect(
      resolveDataTableSurfaceState({
        loading: false,
        error: null,
        filteredRowCount: 0,
        dataRowCount: 0,
        globalFilter: "",
      }),
    ).toBe("empty-dataset");
    expect(
      resolveDataTableSurfaceState({
        loading: false,
        error: null,
        filteredRowCount: 0,
        dataRowCount: 3,
        globalFilter: "zzz",
      }),
    ).toBe("no-results");
  });

  it("returns rows when the filtered model has data", () => {
    expect(
      resolveDataTableSurfaceState({
        loading: false,
        error: null,
        filteredRowCount: 1,
        dataRowCount: 2,
        globalFilter: "a",
      }),
    ).toBe("rows");
  });
});
