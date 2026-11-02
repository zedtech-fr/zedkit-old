"use client";

import { useState } from "react";
import {
  DataTableEmpty,
  DataTableToolbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import { dataTableCopy } from "@/components/demos/i18n/data-table-copy";

const customers = [...dataTableCopy.toolbar.customers];

/** The filter box on its own: you decide what it filters (here, name or city). */
export function DataTableToolbarDemo() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = customers.filter((c) => `${c.name} ${c.city}`.toLowerCase().includes(needle));
  return (
    <Stack gap={3}>
      <DataTableToolbar value={query} onChange={setQuery} placeholder={dataTableCopy.toolbar.placeholder} />
      <Text variant="muted" aria-live="polite">
        {dataTableCopy.toolbar.count(rows.length, customers.length)}
      </Text>
      <Table aria-label={dataTableCopy.toolbar.tableAriaLabel}>
        <TableHeader>
          <TableRow>
            <TableHead>{dataTableCopy.toolbar.columns.customer}</TableHead>
            <TableHead>{dataTableCopy.toolbar.columns.city}</TableHead>
            <TableHead>{dataTableCopy.toolbar.columns.orders}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <DataTableEmpty colSpan={3} message={dataTableCopy.toolbar.emptyMessage} />
          ) : (
            rows.map((c) => (
              <TableRow key={c.name}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.city}</TableCell>
                <TableCell>{c.orders}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
