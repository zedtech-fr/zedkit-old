import type { ComponentProps } from "react";
import { Stack } from "@zedtech/zedkit-ui";

/** Prose markdown tables: mobile stack + quiet inline code (see docs-tables.css). */
export function DocsProseTable(props: ComponentProps<"table">) {
  return (
    <Stack data-docs-table="" className="my-4 min-w-0" tabIndex={0}>
      <table {...props} />
    </Stack>
  );
}
