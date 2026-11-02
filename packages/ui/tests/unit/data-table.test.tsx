import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { assertNoValueArbitraries } from "./no-arbitraries.js";

import { DataTable, DataTableEmpty, DataTablePagination, DataTableToolbar, Table, TableBody, createDataTableColumns } from "#index.js";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [helper.accessor("name", { header: "Name" }), helper.accessor("age", { header: "Age" })];
const data: Person[] = [
  { name: "Bob", age: 30 },
  { name: "Ada", age: 36 },
];

function bodyRowTexts(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent ?? "");
}

describe("DataTable", () => {
  it("renders one row per item", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("uses token-driven cell padding with no value arbitraries", () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    const head = container.querySelector("th");
    expect(head?.className).toContain("px-2");
    expect(head?.className).not.toContain("px-table-cell");
    expect(head?.className).toContain("h-table-head-height");
    const cell = container.querySelector("td");
    expect(cell?.className).toContain("p-2");
    expect(cell?.className).not.toContain("p-table-cell");
    for (const el of [head, cell]) {
      assertNoValueArbitraries(el?.className ?? "");
    }
  });

  it("styles chrome (filter, sort, loading, pagination) from design tokens", () => {
    const { container } = render(<DataTable columns={columns} data={data} pageSize={1} />);
    const root = container.firstElementChild;
    expect(root?.classList.contains("space-y-4")).toBe(true);
    expect(root?.className).not.toContain("space-y-data-table-stack");
    const filter = container.querySelector("input");
    expect(filter?.classList.contains("max-w-data-table-filter-width")).toBe(true);
    expect(filter?.className).not.toMatch(/(^|\s)max-w-sm(\s|$)/);
    const sortButton = screen.getByRole("button", { name: /Name/ });
    expect(sortButton.classList.contains("gap-data-table-sort-gap")).toBe(true);
    expect(sortButton.className).not.toMatch(/(^|\s)gap-1(\s|$)/);
    expect(sortButton.querySelector("svg")?.classList.contains("size-icon-sm")).toBe(true);
    const pager = screen.getByText(/Page 1 of/).parentElement;
    expect(pager?.classList.contains("gap-2")).toBe(true);
    expect(pager?.className).not.toContain("gap-data-table-pagination-gap");
  });

  it("styles loading skeletons from design tokens", () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    const loading = container.querySelector('[data-slot="data-table-loading"]');
    const skeleton = loading?.querySelector(".motion-safe\\:animate-pulse");
    expect(skeleton?.classList.contains("h-4")).toBe(true);
    expect(skeleton?.className).not.toContain("h-data-table-skeleton-height");
  });

  it("sorts ascending then descending when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(bodyRowTexts()).toEqual(["Ada36", "Bob30"]);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("exposes aria-sort on the active column header only (ZK-12)", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    const headers = () => screen.getAllByRole("columnheader");
    expect(headers()[0]?.getAttribute("aria-sort")).toBeNull();
    expect(headers()[1]?.getAttribute("aria-sort")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Name, sort/i }));
    expect(headers()[0]?.getAttribute("aria-sort")).toBe("ascending");
    expect(headers()[1]?.getAttribute("aria-sort")).toBeNull();
    expect(screen.getByRole("button", { name: /Name, sorted ascending/i })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Name, sorted ascending/i }));
    expect(headers()[0]?.getAttribute("aria-sort")).toBe("descending");
    expect(screen.getByRole("button", { name: /Name, sorted descending/i })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Age, sort/i }));
    expect(headers()[0]?.getAttribute("aria-sort")).toBeNull();
    expect(headers()[1]?.getAttribute("aria-sort")).toBe("descending");
    expect(screen.getByRole("button", { name: /Age, sorted descending/i })).toBeTruthy();
  });

  it("shows the empty message when there is no data", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here." />);
    expect(screen.getByText("Nothing here.").textContent).toBe("Nothing here.");
    expect(screen.queryByText(/Page \d+ of/)).toBeNull();
  });

  it("shows no-results with clear filters when the filter hides every row", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    await user.type(screen.getByLabelText("Filter…"), "nobody");
    expect(screen.getByText("No results.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("composes the empty row standalone with spanning cell", () => {
    render(
      <Table>
        <TableBody>
          <DataTableEmpty colSpan={3} message="Nothing here." />
        </TableBody>
      </Table>,
    );
    const cell = screen.getByText("Nothing here.");
    expect(cell.tagName).toBe("TD");
    expect(cell.getAttribute("colspan")).toBe("3");
  });

  it("hides pagination when every row fits on one page", () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.queryByText(/Page \d+ of/)).toBeNull();
  });

  it("shows loading placeholders while loading", () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    expect(screen.getByRole("table").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status", { name: "Loading" })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="data-table-loading"] .motion-safe\\:animate-pulse')).toHaveLength(3);
    expect(screen.queryByText("Ada")).toBeNull();
  });

  it("shows the error message when one is set", () => {
    render(<DataTable columns={columns} data={data} error="Could not load rows." />);
    expect(screen.getByRole("alert").textContent).toContain("Could not load rows.");
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("filters rows by the filter input", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    await user.type(screen.getByLabelText("Filter…"), "Ada");
    expect(bodyRowTexts()).toEqual(["Ada36"]);
    await user.clear(screen.getByLabelText("Filter…"));
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("paginates with Previous/Next and shows the page count", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} pageSize={1} />);
    expect(bodyRowTexts()).toEqual(["Bob30"]);
    expect(screen.getByText("Page 1 of 2").textContent).toBe("Page 1 of 2");
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(bodyRowTexts()).toEqual(["Ada36"]);
    expect(screen.getByText("Page 2 of 2").textContent).toBe("Page 2 of 2");
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(bodyRowTexts()).toEqual(["Bob30"]);
  });
  it("returns to the first page when the filter changes", async () => {
    const user = userEvent.setup();
    const many: Person[] = [
      { name: "Ada", age: 36 },
      { name: "Bob", age: 30 },
      { name: "Cy", age: 41 },
      { name: "Ada Two", age: 22 },
    ];
    render(<DataTable columns={columns} data={many} pageSize={1} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 3 of 4").textContent).toBe("Page 3 of 4");
    await user.type(screen.getByLabelText("Filter…"), "Ada");
    expect(bodyRowTexts()).toEqual(["Ada36"]);
    expect(screen.getByText("Page 1 of 2").textContent).toBe("Page 1 of 2");
  });

  it("hides pagination when the filter leaves no rows", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} pageSize={1} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
    await user.type(screen.getByLabelText("Filter…"), "nobody");
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    expect(screen.queryByText(/Page \d+ of/)).toBeNull();
  });
});

describe("DataTablePagination", () => {
  it("does not submit an enclosing form when Next is clicked", async () => {
    const submitted = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={submitted}>
        <DataTablePagination page={1} pageCount={2} canPrevious={false} canNext onPrevious={() => {}} onNext={() => {}} />
      </form>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
    expect(submitted).not.toHaveBeenCalled();
  });

  it("does not submit an enclosing form when Previous is clicked", async () => {
    const submitted = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={submitted}>
        <DataTablePagination page={2} pageCount={2} canPrevious canNext={false} onPrevious={() => {}} onNext={() => {}} />
      </form>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Previous" }));
    expect(submitted).not.toHaveBeenCalled();
  });

  it("composes standalone paging with explicit state", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <DataTablePagination
        page={2}
        pageCount={4}
        canPrevious
        canNext={false}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );
    expect(screen.getByText("Page 2 of 4")).not.toBeNull();
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });
});

describe("DataTable tokens", () => {
  it.each([
    ["rows", <DataTable columns={columns} data={data} pageSize={1} />],
    ["empty", <DataTable columns={columns} data={[]} />],
    ["loading", <DataTable columns={columns} data={data} loading />],
    ["error", <DataTable columns={columns} data={data} error="Boom" />],
    [
      "standalone",
      <Table>
        <TableBody>
          <DataTableEmpty colSpan={3} message="Nothing here." />
        </TableBody>
      </Table>,
    ],
  ])("carries no value arbitraries (%s)", (_label, ui) => {
    const { container, unmount } = render(ui);
    const classes = [...container.querySelectorAll("[class]")]
      .map((el) => el.getAttribute("class") ?? "")
      .join(" ");
    expect(classes.length).toBeGreaterThan(0);
    assertNoValueArbitraries(classes);
    unmount();
  });
});

describe("DataTableToolbar", () => {
  it("composes a standalone labelled filter input with token width", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataTableToolbar value="" onChange={onChange} placeholder="Filter…" />);
    const input = screen.getByLabelText("Filter…");
    expect(input.tagName).toBe("INPUT");
    expect(input.classList.contains("max-w-data-table-filter-width")).toBe(true);
    await user.type(input, "A");
    expect(onChange).toHaveBeenCalledWith("A");
  });
});
