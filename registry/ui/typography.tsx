import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { headingLevelDefaultRole, type TypeRole } from "@/components/ui/type-roles";

// No shadcn registry item exists for typography (docs-only class
// recipes), so these thin wrappers carry the documented styles.
// Semantic level (h1–h4 tag) is decoupled from visual role (tokens).

const roleClasses: Record<TypeRole, string> = {
  display: "text-zk-type-display tracking-tight",
  title: "text-zk-type-section tracking-tight",
  heading: "text-zk-type-band tracking-tight",
  section: "text-zk-type-section tracking-tight",
  band: "text-zk-type-band tracking-tight",
  cardTitle: "text-zk-type-card-title tracking-tight",
  lead: "text-zk-type-lead",
  body: "text-zk-type-body",
  prose: "text-zk-type-prose",
  small: "text-zk-type-small",
  caption: "text-zk-type-label",
  label: "text-zk-type-label",
  nav: "text-zk-type-nav",
};

const headingVariants = cva("scroll-m-heading-scroll", {
  variants: {
    typeRole: roleClasses,
  },
});

export type HeadingProps = React.ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & {
    /** Semantic outline level: picks the default tag (`h1`–`h4`). */
    level?: 1 | 2 | 3 | 4;
    /** Visual type role; defaults from `level` when omitted. */
    typeRole?: TypeRole;
    /** Tag override when the outline needs a different element. */
    as?: "h1" | "h2" | "h3" | "h4" | "div";
    /** Merge styles onto the child (Radix Slot) instead of rendering a tag. */
    asChild?: boolean;
  };

function Heading({ level = 1, typeRole, as, asChild = false, className, ...props }: HeadingProps) {
  const visualRole = typeRole ?? headingLevelDefaultRole[level];
  const classes = cn(headingVariants({ typeRole: visualRole }), className);
  if (asChild) {
    return <Slot data-slot="heading" className={classes} {...props} />;
  }
  const Tag = (as ?? `h${level}`) as "h1";
  return <Tag data-slot="heading" className={classes} {...props} />;
}

const textVariants = cva("leading-body", {
  variants: {
    variant: {
      body: "text-zk-type-body",
      muted: "text-zk-type-body text-sm text-muted-foreground",
    },
    typeRole: {
      lead: "text-zk-type-lead",
      body: "text-zk-type-body",
      prose: "text-zk-type-prose",
      small: "text-zk-type-small",
      caption: "text-zk-type-label",
      label: "text-zk-type-label",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export type TextProps = React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    /** Tag override (`p` by default). */
    as?: "p" | "span" | "div";
    /** Merge styles onto the child (Radix Slot) instead of rendering a tag. */
    asChild?: boolean;
  };

function Text({ variant, typeRole, as: Tag = "p", asChild = false, className, ...props }: TextProps) {
  const classes = cn(textVariants({ variant, typeRole }), className);
  if (asChild) {
    return <Slot data-slot="text" className={classes} {...props} />;
  }
  return <Tag data-slot="text" className={classes} {...props} />;
}

export { Heading, headingVariants, Text, textVariants };
export { typeRoleClass, signatureMotionClass, headingLevelDefaultRole, type TypeRole, type SignatureMotion } from "@/components/ui/type-roles";
