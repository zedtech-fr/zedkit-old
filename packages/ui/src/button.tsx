"use client";

import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap focus-ring-control disabled:pointer-events-none disabled:opacity-50 motion-safe:button-press [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background text-foreground shadow-sm hover:bg-muted hover:text-foreground aria-pressed:border-input aria-pressed:bg-secondary aria-pressed:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "text-foreground hover:bg-muted/80 hover:text-foreground aria-pressed:bg-secondary/80 aria-pressed:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline focus-visible:underline",
      },
      size: {
        default: "h-control-height px-4 py-2",
        sm: "h-control-height-sm rounded-md px-3 text-xs",
        lg: "h-control-height-lg rounded-md px-8",
        icon: "size-control-height",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        class:
          "h-auto min-h-0 bg-transparent px-0 py-0 shadow-none hover:bg-transparent active:bg-transparent",
      },
      { variant: "link", size: "sm", class: "min-h-11 px-2 text-sm" },
      { variant: "link", size: "default", class: "min-h-11 px-3" },
      { variant: "link", size: "lg", class: "min-h-11 px-4 text-base" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
