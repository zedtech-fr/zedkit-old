import { useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";
import { GlassSurface } from "./glass-surface.js";
import { SectionHeader } from "./section-header.js";

export interface FeatureItem {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Decorative icon (hidden from assistive tech); pass an SVG element. */
  icon?: React.ReactNode;
}

export type FeatureGridProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Section title, rendered as a level-2 heading. */
  title: React.ReactNode;
  description?: React.ReactNode;
  features: FeatureItem[];
  /** Columns from the `lg` breakpoint up; always 1 on phones and 2 from `sm`. */
  columns?: 2 | 3 | 4 | undefined;
};

const columnClass = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

/** A titled grid of short benefits, each on its own glass surface. */
function FeatureGrid({ title, description, features, columns = 3, className, ...props }: FeatureGridProps) {
  const titleId = useId();
  return (
    <section
      data-slot="feature-grid"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="default" className="flex flex-col gap-10">
        <SectionHeader titleId={titleId} title={title} description={description} />
        <ul className={cn("grid list-none gap-4 p-0 sm:grid-cols-2", columnClass[columns])}>
          {features.map((feature, index) => (
            <GlassSurface key={feature.id ?? index} as="li" className="flex flex-col gap-3">
              {feature.icon ? (
                <span
                  data-slot="feature-icon"
                  aria-hidden="true"
                  className="grid size-10 place-content-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5"
                >
                  {feature.icon}
                </span>
              ) : null}
              <Heading level={3} className="text-xl">
                {feature.title}
              </Heading>
              {feature.description ? <Text variant="muted">{feature.description}</Text> : null}
            </GlassSurface>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export { FeatureGrid };
