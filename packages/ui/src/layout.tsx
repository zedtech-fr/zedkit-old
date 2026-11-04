import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";
import { Heading } from "./typography.js";
import { Text } from "./typography.js";

// No shadcn source exists for layout stacks/sections, so these two
// thin wrappers carry the documented spacing patterns. They exist so
// consumers can replace raw <section>/<div> stacks entirely.

const stackVariants = cva("flex", {
  variants: {
    direction: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
    },
    gap: {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      7: "gap-7",
      8: "gap-8",
    },
  },
  defaultVariants: {
    direction: "vertical",
    gap: 4,
  },
});

export type StackProps = React.ComponentProps<"div"> &
  VariantProps<typeof stackVariants> & {
    direction?: "vertical" | "horizontal";
    gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  };

function Stack({ direction, gap, className, ...props }: StackProps) {
  return (
    <div data-slot="stack" className={cn(stackVariants({ direction, gap }), className)} {...props} />
  );
}

const containerVariants = cva("mx-auto w-full", {
  variants: {
    width: {
      narrow: "max-w-narrow",
      reading: "max-w-reading",
      default: "max-w-default",
      wide: "max-w-wide",
      full: "max-w-none",
    },
    gutter: {
      true: "px-page-gutter",
      false: "",
    },
  },
  defaultVariants: {
    width: "default",
    gutter: true,
  },
});

export type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & {
    /** Named measure from the layout token scale. */
    width?: "narrow" | "reading" | "default" | "wide" | "full" | undefined;
    /** Page gutter on both sides (default true). */
    gutter?: boolean | undefined;
  };

function Container({ width, gutter, className, ...props }: ContainerProps) {
  return (
    <div data-slot="container" className={cn(containerVariants({ width, gutter }), className)} {...props} />
  );
}

export type SectionProps = React.ComponentProps<"section"> & {
  /** Section title, rendered as a level-2 heading. */
  title?: React.ReactNode;
  /** Muted description under the title. */
  description?: React.ReactNode;
  /** Actions row, right-aligned next to the title. */
  actions?: React.ReactNode;
  /** Run the section edge to edge; content stays capped by a Container. */
  bleed?: boolean | undefined;
  /** Band background in bleed mode. */
  tone?: "plain" | "muted" | undefined;
  /** Vertical rhythm in bleed mode (section spacing scale). */
  spacing?: "sm" | "md" | "lg" | "xl" | undefined;
  /** Width of the inner container in bleed mode. */
  containerWidth?: ContainerProps["width"];
  /**
   * Scroll-snap align when a `SectionScroll` ancestor is present.
   * Use `none` for bands taller than the viewport or sticky/pin scenes.
   */
  snap?: "start" | "none" | undefined;
};

export type SectionScrollProps = React.ComponentProps<"div">;

/** Marks the document for smooth section scrolling and proximity snap. */
function SectionScroll({ className, ...props }: SectionScrollProps) {
  return <div data-slot="section-scroll" className={className} {...props} />;
}

const sectionSpacing = {
  sm: "py-section-sm",
  md: "py-section-md",
  lg: "py-section-lg",
  xl: "py-section-xl",
} as const;

function Section({
  title,
  description,
  actions,
  bleed = false,
  tone = "plain",
  spacing = "md",
  containerWidth,
  snap = "start",
  children,
  className,
  ...props
}: SectionProps) {
  const header = (title || description || actions) && (
    <div className="flex items-start justify-between gap-4">
      <div>
        {title && (
          <Heading level={2} typeRole="title">
            {title}
          </Heading>
        )}
        {description && (
          <Text variant="muted" typeRole="body">
            {description}
          </Text>
        )}
      </div>
      {actions}
    </div>
  );
  const labelled = typeof title === "string" ? { "aria-label": title } : undefined;
  if (!bleed) {
    return (
      <section data-slot="section" data-snap={snap} className={cn("space-y-4", className)} {...labelled} {...props}>
        {header}
        {children}
      </section>
    );
  }
  return (
    <section
      data-slot="section"
      data-snap={snap}
      className={cn("w-full", sectionSpacing[spacing], tone === "muted" && "bg-muted", className)}
      {...labelled}
      {...props}
    >
      <Container width={containerWidth} className="space-y-4">
        {header}
        {children}
      </Container>
    </section>
  );
}

export { Container, containerVariants, Stack, stackVariants, Section, SectionScroll };
