import {
  DataTableEmpty,
  Stack,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import { dataTableCopy } from "@/components/demos/i18n/data-table-copy";

/** No-results row inside your own table body, with a sentence that says what to do next. */
export function DataTableEmptyDemo() {
  return (
    <Stack gap={3}>
      <Text variant="muted">{dataTableCopy.empty.searchHint}</Text>
      <Table aria-label={dataTableCopy.empty.tableAriaLabel}>
        <TableHeader>
          <TableRow>
            <TableHead>{dataTableCopy.empty.columns.product}</TableHead>
            <TableHead>{dataTableCopy.empty.columns.stock}</TableHead>
            <TableHead>{dataTableCopy.empty.columns.price}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <DataTableEmpty colSpan={3} message={dataTableCopy.empty.message} />
        </TableBody>
      </Table>
    </Stack>
  );
}
