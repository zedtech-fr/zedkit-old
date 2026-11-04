import { useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";
import { SectionHeader } from "./section-header.js";

export interface HowItWorksStep {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  title: React.ReactNode;
  description?: React.ReactNode;
}

export type HowItWorksProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Section title, rendered as a level-2 heading. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Two to four steps, in order; numbers are added for you. */
  steps: HowItWorksStep[];
};

/** Numbered steps that take a visitor from sign-up to a first result. */
function HowItWorks({ title, description, steps, className, ...props }: HowItWorksProps) {
  const titleId = useId();
  return (
    <section
      data-slot="how-it-works"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="default" className="flex flex-col gap-10">
        <SectionHeader titleId={titleId} title={title} description={description} />
        <ol className="grid list-none gap-8 p-0 md:auto-cols-fr md:grid-flow-col md:gap-6">
          {steps.map((step, index) => (
            <li key={step.id ?? index} data-slot="how-it-works-step" className="flex gap-4 md:flex-col">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-content-center rounded-full bg-primary font-semibold text-primary-foreground"
              >
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <Heading level={3} className="text-xl">
                  {step.title}
                </Heading>
                {step.description ? <Text variant="muted">{step.description}</Text> : null}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export { HowItWorks };
