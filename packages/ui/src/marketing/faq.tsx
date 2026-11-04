import { useId } from "react";
import type * as React from "react";
import { ChevronDown } from "lucide-react";

import { Container } from "../layout.js";
import { Text } from "../typography.js";
import { cn } from "../utils.js";
import { SectionHeader } from "./section-header.js";

export interface FaqItem {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  question: React.ReactNode;
  answer: React.ReactNode;
}

export type FaqProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Section title, rendered as a level-2 heading. */
  title: React.ReactNode;
  description?: React.ReactNode;
  items: FaqItem[];
};

/** Questions that open in place. Native `details`, so it works without script and keeps find-in-page. */
function Faq({ title, description, items, className, ...props }: FaqProps) {
  const titleId = useId();
  return (
    <section
      data-slot="faq"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="reading" className="flex flex-col gap-10">
        <SectionHeader titleId={titleId} title={title} description={description} />
        <div className="flex flex-col">
          {items.map((item, index) => (
            <details key={item.id ?? index} data-slot="faq-item" className="group border-b">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium focus-ring-control [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
                />
              </summary>
              <Text variant="muted" className="pb-4">
                {item.answer}
              </Text>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export { Faq };
