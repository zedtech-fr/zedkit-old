import { useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Text } from "../typography.js";
import { cn } from "../utils.js";
import { GlassSurface } from "./glass-surface.js";
import { SectionHeader } from "./section-header.js";

export interface Testimonial {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  /** What the person said, without quotation marks (the browser draws them for the page language). */
  quote: React.ReactNode;
  /** Person's name. */
  name: string;
  /** Role and company, for example "Head of e-commerce, Harbor Studio". */
  role?: React.ReactNode;
  /** Decorative portrait or initials, hidden from assistive tech. */
  avatar?: React.ReactNode;
}

export type TestimonialsProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Section title, rendered as a level-2 heading. */
  title: React.ReactNode;
  description?: React.ReactNode;
  items: Testimonial[];
};

/** Quotes from real customers, each as a figure on a glass surface. Only pass quotes you may publish. */
function Testimonials({ title, description, items, className, ...props }: TestimonialsProps) {
  const titleId = useId();
  return (
    <section
      data-slot="testimonials"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="default" className="flex flex-col gap-10">
        <SectionHeader titleId={titleId} title={title} description={description} />
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <GlassSurface key={item.id ?? index} as="li" className="flex">
              <figure className="flex min-w-0 flex-1 flex-col justify-between gap-6">
                <blockquote className="text-pretty">
                  <Text as="span" className="before:content-[open-quote] after:content-[close-quote]">{item.quote}</Text>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  {item.avatar ? (
                    <span
                      data-slot="testimonial-avatar"
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-content-center overflow-hidden rounded-full bg-muted text-sm font-semibold [&_img]:size-full [&_img]:object-cover"
                    >
                      {item.avatar}
                    </span>
                  ) : null}
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{item.name}</span>
                    {item.role ? <span className="text-sm text-muted-foreground">{item.role}</span> : null}
                  </span>
                </figcaption>
              </figure>
            </GlassSurface>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export { Testimonials };
