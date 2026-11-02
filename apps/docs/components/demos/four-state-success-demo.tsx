"use client";

import { DataTable, createDataTableColumns } from "@zedtech/zedkit-ui";
import { fourStateCopy } from "@/components/demos/i18n/four-state-copy";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [
  helper.accessor("name", { header: fourStateCopy.success.columns.name }),
  helper.accessor("age", { header: fourStateCopy.success.columns.age }),
];
const rows: Person[] = [...fourStateCopy.success.rows];

export function FourStateSuccessDemo() {
  return <DataTable columns={columns} data={rows} />;
}
