"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  Stack,
  Text,
  createDataTableColumns,
  type BadgeProps,
} from "@zedtech/zedkit-ui";
import { dataTableCopy } from "@/components/demos/i18n/data-table-copy";

interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: "Paid" | "Shipped" | "Pending" | "Refunded";
}

const STATUS_VARIANT: Record<Order["status"], BadgeProps["variant"]> = {
  Paid: "success",
  Shipped: "secondary",
  Pending: "warning",
  Refunded: "outline",
};

const orders: Order[] = [...dataTableCopy.demo.orders];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const helper = createDataTableColumns<Order>();
const columns = [
  helper.accessor("id", { header: dataTableCopy.demo.columns.order }),
  helper.accessor("customer", { header: dataTableCopy.demo.columns.customer }),
  helper.accessor("date", {
    header: dataTableCopy.demo.columns.date,
    cell: ({ getValue }) => day.format(new Date(`${getValue()}T00:00:00Z`)),
  }),
  helper.accessor("total", { header: dataTableCopy.demo.columns.total, cell: ({ getValue }) => money.format(getValue()) }),
  helper.accessor("status", {
    header: dataTableCopy.demo.columns.status,
    cell: ({ getValue }) => <Badge variant={STATUS_VARIANT[getValue()]}>{getValue()}</Badge>,
  }),
];

const VIEWS = dataTableCopy.demo.views;
type View = (typeof VIEWS)[number];

/** Store admin: filter, sort by a column header, page through 12 orders; switch the view to see each state. */
export function DataTableDemo() {
  const [view, setView] = useState<View>("Orders");
  return (
    <Stack gap={4}>
      <Stack direction="horizontal" gap={2} className="flex-wrap" role="group" aria-label={dataTableCopy.demo.stateGroupAriaLabel}>
        {VIEWS.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={view === name ? "default" : "outline"}
            aria-pressed={view === name}
            onClick={() => setView(name)}
          >
            {name}
          </Button>
        ))}
      </Stack>
      <Text variant="muted">{dataTableCopy.demo.hint}</Text>
      <DataTable
        columns={columns}
        data={view === "Empty" ? [] : orders}
        loading={view === "Loading"}
        error={view === "Error" ? dataTableCopy.demo.error : null}
        emptyMessage={dataTableCopy.demo.emptyMessage}
        emptyAction={
          view === "Empty" ? (
            <Button size="sm" type="button">
              {dataTableCopy.demo.emptyAction}
            </Button>
          ) : undefined
        }
        filterPlaceholder={dataTableCopy.demo.filterPlaceholder}
        pageSize={5}
      />
    </Stack>
  );
}
