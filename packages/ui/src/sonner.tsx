// Derived from shadcn/ui (sonner) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

/**
 * Themed toast viewport: render once near the app root, then call
 * sonner's `toast()` anywhere. Styling follows the theme tokens.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      data-slot="toaster"
      toastOptions={{
        classNames: {
          toast: "bg-card text-card-foreground border-border",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast, type ToasterProps };
