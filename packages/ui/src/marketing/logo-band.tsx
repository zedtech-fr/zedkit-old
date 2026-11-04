import { useId } from "react";
import type * as React from "react";

import { Container } from "../layout.js";
import { Text } from "../typography.js";
import { cn } from "../utils.js";

export interface LogoBandItem {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  /** Name of the company or product; read out in place of the logo. */
  name: string;
  /** The logo as an `svg` or `img`; it is hidden from assistive tech, the name is read instead. */
  logo: React.ReactNode;
  /** Link to the company, if any. */
  href?: string | undefined;
}

export type LogoBandProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Short line above the logos, for example "Works with". */
  title: string;
  logos: LogoBandItem[];
};

/** A quiet row of logos: who uses it, or what it works with. */
function LogoBand({ title, logos, className, ...props }: LogoBandProps) {
  const titleId = useId();
  return (
    <section
      data-slot="logo-band"
      aria-labelledby={titleId}
      className={cn("py-section-sm", className)}
      {...props}
    >
      <Container width="default" className="flex flex-col items-center gap-6">
        <Text id={titleId} variant="muted" className="text-center">
          {title}
        </Text>
        <ul className="flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-4 p-0 text-muted-foreground">
          {logos.map((item, index) => {
            const body = (
              <>
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 items-center [&_img]:h-8 [&_img]:w-auto [&_svg]:h-8 [&_svg]:w-auto"
                >
                  {item.logo}
                </span>
                <span className="sr-only">{item.name}</span>
              </>
            );
            return (
              <li key={item.id ?? index} data-slot="logo-band-item">
                {item.href ? (
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md focus-ring-control hover:text-foreground"
                  >
                    {body}
                  </a>
                ) : (
                  <span className="inline-flex min-h-11 items-center">{body}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export { LogoBand };
