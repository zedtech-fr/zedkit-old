"use client";

import { useId, useState } from "react";
import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import { roleForExportSymbol } from "@/lib/import-symbols";
import { componentExportsPanelCopy } from "@/components/i18n/component-exports-panel-copy";
import { ComponentWrapsLine } from "./component-wraps-line";

export function ComponentExportsPanel({ symbols, wraps }: { symbols: string[]; wraps: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <Stack gap={2}>
      <Button type="button" variant="ghost" size="sm" className="w-fit"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}>
        {open ? componentExportsPanelCopy.hideSymbols : componentExportsPanelCopy.showSymbols}
      </Button>
      {open ? (
        <Stack gap={3} id={panelId}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{componentExportsPanelCopy.table.symbol}</TableHead>
                <TableHead>{componentExportsPanelCopy.table.role}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {symbols.map((name) => (
                <TableRow key={name}>
                  <TableCell className="font-mono text-xs">{name}</TableCell>
                  <TableCell className="text-muted-foreground">{roleForExportSymbol(name)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ComponentWrapsLine wraps={wraps} />
        </Stack>
      ) : (
        <Stack gap={1}>
          <Text variant="muted" className="text-xs">
            {componentExportsPanelCopy.symbolCountLine(symbols.length)}
          </Text>
          <ComponentWrapsLine wraps={wraps} />
        </Stack>
      )}
    </Stack>
  );
}
