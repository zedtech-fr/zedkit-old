"use client";

import type * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils.js";

const labelVariants = cva(
  "cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
);

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>;

function Label({ className, ...props }: LabelProps) {
  return <LabelPrimitive.Root data-slot="label" className={cn(labelVariants(), className)} {...props} />;
}

export { Label };
