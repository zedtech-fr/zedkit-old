import { useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";

export type HeroProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Short line above the title (a product area, a release). */
  eyebrow?: React.ReactNode;
  /** The one promise of the page. Rendered as the page heading. */
  title: React.ReactNode;
  /** One or two sentences that make the promise concrete. */
  description?: React.ReactNode;
  /** Calls to action, most important first (buttons or links). */
  actions?: React.ReactNode;
  /** Picture, code sample or demo beside the text (below it on phones). */
  media?: React.ReactNode;
  /** Text alignment when there is no `media`. */
  align?: "center" | "start" | undefined;
  /** Heading level: `1` on a page's first screen, `2` when the page already has an `h1`. */
  headingLevel?: 1 | 2 | undefined;
};

/**
 * First screen of a public page: promise, proof, calls to action. Strings
 * are props; the page background comes from the identity.
 */
function Hero({
  eyebrow,
  title,
  description,
  actions,
  media,
  align = "center",
  headingLevel = 1,
  className,
  ...props
}: HeroProps) {
  const titleId = useId();
  const centered = align === "center" && !media;
  return (
    <section
      data-slot="hero"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="default" className={cn(media && "grid items-center gap-10 lg:grid-cols-2")}>
        <div className={cn("flex min-w-0 flex-col gap-5", centered && "mx-auto max-w-reading items-center text-center")}>
          {eyebrow ? (
            <Text as="p" variant="muted" className="font-medium text-primary">
              {eyebrow}
            </Text>
          ) : null}
          <Heading id={titleId} level={headingLevel} className="text-4xl font-semibold text-balance sm:text-5xl">
            {title}
          </Heading>
          {description ? (
            <Text className="max-w-reading text-lg text-balance text-muted-foreground">{description}</Text>
          ) : null}
          {actions ? (
            <div
              data-slot="hero-actions"
              className="flex w-full flex-col gap-3 pt-2 *:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:*:w-auto"
            >
              {actions}
            </div>
          ) : null}
        </div>
        {media ? (
          <div data-slot="hero-media" className="min-w-0">
            {media}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export { Hero };
