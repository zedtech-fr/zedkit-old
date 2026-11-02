"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  Button,
  ConfirmDialog,
  Stack,
  Text,
  createDataTableColumns,
} from "@zedtech/zedkit-ui";

import type { AdminAppRow } from "./admin-dashboard-demo-types";
import { adminDashboardDemoCopy } from "@/components/i18n/admin-dashboard-demo-copy";

const tableHelper = createDataTableColumns<AdminAppRow>();

/** Row delete: an outlined icon, red only in its icon; the solid destructive button lives in the confirmation. */
function DeleteRow({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="text-destructive"
          aria-label={adminDashboardDemoCopy.columns.deleteAriaLabel(name)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      }
      title={adminDashboardDemoCopy.columns.deleteTitle}
      description={adminDashboardDemoCopy.columns.deleteDescription(name)}
      confirmLabel={adminDashboardDemoCopy.columns.deleteConfirm}
      onConfirm={onConfirm}
    />
  );
}

export function buildAdminDashboardColumns({
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (row: AdminAppRow) => void;
  onDelete: (id: string) => void;
}) {
  return [
    tableHelper.accessor("name", {
      header: adminDashboardDemoCopy.columns.name,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-11 w-full justify-start px-2 font-normal"
          aria-pressed={selectedId === row.original.id}
          onClick={() => onSelect(row.original.id)}
        >
          {row.original.name}
        </Button>
      ),
    }),
    tableHelper.accessor("region", { header: adminDashboardDemoCopy.columns.region }),
    tableHelper.display({
      id: "actions",
      // Icons say it; the name stays for assistive tech and frees ~40px on a phone.
      header: () => (
        <Text as="span" className="sr-only">
          {adminDashboardDemoCopy.columns.actions}
        </Text>
      ),
      cell: ({ row }) => (
        <Stack direction="horizontal" gap={1} className="flex-nowrap justify-end" data-demo-row-actions>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={adminDashboardDemoCopy.columns.editAriaLabel(row.original.name)}
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <DeleteRow name={row.original.name} onConfirm={() => onDelete(row.original.id)} />
        </Stack>
      ),
    }),
  ];
}
