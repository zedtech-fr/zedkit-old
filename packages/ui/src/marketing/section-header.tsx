import type * as React from "react";

import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";

export interface SectionHeaderProps {
  /** Id of the heading, so the section can name itself with `aria-labelledby`. */
  titleId: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string | undefined;
}

/** Centered title and description shared by the marketing sections (not exported). */
export function SectionHeader({ titleId, title, description, className }: SectionHeaderProps) {
  return (
    <div data-slot="marketing-section-header" className={cn("mx-auto flex max-w-reading flex-col items-center gap-3 text-center", className)}>
      <Heading id={titleId} level={2} className="text-3xl font-semibold text-balance">
        {title}
      </Heading>
      {description ? <Text className="text-balance text-muted-foreground">{description}</Text> : null}
    </div>
  );
}
