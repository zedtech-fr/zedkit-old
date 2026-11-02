"use client";

import { useValidatedForm } from "@zedtech/zedkit-ui";

import { adminDashboardFormSchema } from "./admin-dashboard-demo-types";

export function useAdminDashboardForm() {
  return useValidatedForm(adminDashboardFormSchema, {
    defaultValues: { name: "", region: "eu" },
  });
}

export type AdminDashboardFormControl = ReturnType<typeof useAdminDashboardForm>;
