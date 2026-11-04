import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border text-xs focus-ring transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary px-badge-inline py-badge-block font-semibold text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary px-badge-inline py-badge-block font-semibold text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive px-badge-inline py-badge-block font-semibold text-destructive-foreground shadow hover:bg-destructive/80",
        success:
          "border-transparent bg-success px-badge-inline py-badge-block font-semibold text-success-foreground shadow hover:bg-success/90",
        warning:
          "border-transparent bg-warning px-badge-inline py-badge-block font-semibold text-warning-foreground shadow hover:bg-warning/90",
        outline: "px-badge-inline py-badge-block font-semibold text-foreground",
        /** Quiet metadata (a version, a count): caption size, muted, mono tabular numerals, no surface. */
        meta: "rounded-sm border-transparent bg-transparent px-0.5 py-0 font-mono font-normal text-muted-foreground tabular-nums shadow-none hover:text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
