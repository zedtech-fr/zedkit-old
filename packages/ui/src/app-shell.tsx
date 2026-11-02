import type * as React from "react";

import { cn } from "./utils.js";

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebar, topbar, children, className }: AppShellProps) {
  return (
    <div data-slot="app-shell" className={cn("flex min-h-svh w-full", className)}>
      <aside className="flex w-app-shell-sidebar shrink-0 flex-col border-r bg-muted/40 max-md:hidden">
        {sidebar}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {topbar ? (
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">{topbar}</header>
        ) : null}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-app-shell-padding-md">{children}</main>
      </div>
    </div>
  );
}
