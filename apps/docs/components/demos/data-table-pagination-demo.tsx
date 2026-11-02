"use client";

import { useState } from "react";
import {
  DataTablePagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zedtech/zedkit-ui";
import { dataTableCopy } from "@/components/demos/i18n/data-table-copy";

const PAGE_SIZE = 5;
const catalog = dataTableCopy.pagination.catalog;

/** Server-style paging: you own the page number and ask your API for each page. */
export function DataTablePaginationDemo() {
  const [page, setPage] = useState(2);
  const pageCount = Math.ceil(catalog.length / PAGE_SIZE);
  const rows = catalog.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <Stack gap={4}>
      <Table aria-label={dataTableCopy.pagination.tableAriaLabel}>
        <TableHeader>
          <TableRow>
            <TableHead>{dataTableCopy.pagination.columns.product}</TableHead>
            <TableHead>{dataTableCopy.pagination.columns.price}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, price]) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell>{price} €</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DataTablePagination
        page={page}
        pageCount={pageCount}
        canPrevious={page > 1}
        canNext={page < pageCount}
        onPrevious={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </Stack>
  );
}
