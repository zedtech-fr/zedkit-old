import type * as React from "react";

import { cn } from "./utils.js";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** A back link shown above the title (for example a link-variant Button). Spaced by `--spacing-page-header-back-gap`. */
  back?: React.ReactNode;
  /** Heading tag for the title. Use `h2` when the page already has an `h1` (a header shown inside a preview). */
  titleAs?: "h1" | "h2";
  className?: string;
}

export function PageHeader({ title, description, actions, back, titleAs: Title = "h1", className }: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn("mb-page-header-offset flex flex-col gap-page-header-title-gap", className)}>
      {back ? (
        <div data-slot="page-header-back" className="-mx-2 mb-page-header-back-gap flex w-fit items-center">
          {back}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title className="text-2xl font-semibold tracking-tight">{title}</Title>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
