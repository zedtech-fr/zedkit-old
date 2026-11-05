"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { surfaceVariants } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useUiMessages } from "@/components/ui/ui-provider";

export interface CardSkeletonProps {
  label?: string;
  className?: string;
}

/**
 * Faithful loading shape of Card: header block plus three text lines
 * in the same bordered box, so content lands without shifting.
 */
export function CardSkeleton({ label, className }: CardSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="card-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn(surfaceVariants({ variant: "solid", elevation: 2, radius: "xl", padding: "card" }), className)}
    >
      <div className="space-y-card-stack">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
