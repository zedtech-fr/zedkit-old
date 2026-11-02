import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-foreground [&>svg+div]:-translate-y-alert-icon-nudge [&>svg~*]:pl-alert-content-indent",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/90 text-destructive-foreground dark:border-destructive [&>svg]:text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof alertVariants> {
  asChild?: boolean;
}

function Alert({ className, variant, asChild = false, ...props }: AlertProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

function AlertTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  // Children are explicit (not part of the props spread) so the
  // heading-has-content rule can see them; renders identically.
  return (
    <h2 data-slot="alert-title" className={cn("mb-1 text-base leading-none font-medium tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
