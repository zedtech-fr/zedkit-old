import { Children, useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Text } from "../typography.js";
import { cn } from "../utils.js";

export interface MarketingFooterColumn {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  /** Column heading, for example "Product". */
  title: string;
  /** Links (anchors or your router's links). */
  links: React.ReactNode[];
}

export type MarketingFooterProps = Omit<React.ComponentProps<"footer">, "children"> & {
  /** Logo and name. */
  brand?: React.ReactNode;
  /** One sentence under the brand. */
  description?: React.ReactNode;
  /** Link columns; each is its own labelled navigation. */
  columns?: MarketingFooterColumn[] | undefined;
  /** Bottom line: copyright, legal links, language switch. */
  legal?: React.ReactNode;
};

const linkClass =
  "[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:text-sm [&_a]:text-muted-foreground [&_a]:hover:text-foreground [&_a]:hover:underline";

function FooterColumn({ column }: { column: MarketingFooterColumn }) {
  const titleId = useId();
  return (
    <nav aria-labelledby={titleId} className="flex min-w-0 flex-col gap-1">
      <p id={titleId} className="text-sm font-semibold">
        {column.title}
      </p>
      <ul className={cn("flex list-none flex-col p-0", linkClass)}>
        {Children.toArray(column.links).map((link, index) => (
          <li key={index}>{link}</li>
        ))}
      </ul>
    </nav>
  );
}

/** Public-page footer: brand, short description, link columns, bottom line. */
function MarketingFooter({ brand, description, columns = [], legal, className, ...props }: MarketingFooterProps) {
  return (
    <footer data-slot="marketing-footer" className={cn("border-t bg-card text-card-foreground", className)} {...props}>
      <Container width="default" className="flex flex-col gap-10 py-section-md">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-3">
            {brand}
            {description ? <Text variant="muted">{description}</Text> : null}
          </div>
          {columns.length > 0 ? (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-2">
              {columns.map((column, index) => (
                <FooterColumn key={column.id ?? index} column={column} />
              ))}
            </div>
          ) : null}
        </div>
        {legal ? (
          <div
            data-slot="marketing-footer-legal"
            className="flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
          >
            {legal}
          </div>
        ) : null}
      </Container>
    </footer>
  );
}

export { MarketingFooter };
