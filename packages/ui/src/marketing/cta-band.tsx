import { useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";
import { GlassSurface } from "./glass-surface.js";

export type CtaBandProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** The final ask, one line. Rendered as a level-2 heading. */
  title: React.ReactNode;
  /** One sentence that removes the last doubt. */
  description?: React.ReactNode;
  /** Calls to action, most important first (buttons or links). */
  actions?: React.ReactNode;
};

/** Closing call to action of a public page: a tinted glass band. */
function CtaBand({ title, description, actions, className, ...props }: CtaBandProps) {
  const titleId = useId();
  return (
    <section
      data-slot="cta-band"
      aria-labelledby={titleId}
      className={cn("py-section-sm sm:py-section-md", className)}
      {...props}
    >
      <Container width="default">
        <GlassSurface
          tone="tinted"
          padding="lg"
          className="flex flex-col items-center gap-4 text-center sm:px-12 sm:py-12"
        >
          <Heading id={titleId} level={2} className="text-3xl font-semibold text-balance">
            {title}
          </Heading>
          {description ? (
            <Text className="max-w-reading text-balance text-muted-foreground">{description}</Text>
          ) : null}
          {actions ? (
            <div
              data-slot="cta-band-actions"
              className="flex w-full flex-col gap-3 pt-2 *:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:*:w-auto"
            >
              {actions}
            </div>
          ) : null}
        </GlassSurface>
      </Container>
    </section>
  );
}

export { CtaBand };
