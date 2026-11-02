"use client";

import { AdminDashboardDemoApp, type PreviewMode } from "../admin-dashboard-demo-app";

export function HomeAdminDashboardDemo({
  label,
  preview,
  onPreviewChange,
  variant = "home",
}: {
  label?: string;
  preview?: PreviewMode;
  onPreviewChange?: (mode: PreviewMode) => void;
  variant?: "default" | "home";
}) {
  return (
    <AdminDashboardDemoApp
      {...(label ? { label } : {})}
      {...(preview !== undefined ? { preview } : {})}
      {...(onPreviewChange ? { onPreviewChange } : {})}
      variant={variant}
    />
  );
}
