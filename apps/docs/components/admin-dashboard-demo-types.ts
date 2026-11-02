import { z } from "zod";

export type AdminAppRow = { id: string; name: string; region: "eu" | "us" };

export type PreviewMode = "ready" | "loading" | "empty" | "error";

export const adminDashboardFormSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters."),
  region: z.enum(["eu", "us"]),
});

export type AdminDashboardFormValues = z.infer<typeof adminDashboardFormSchema>;

export const adminDashboardSeedApps: AdminAppRow[] = [
  { id: "seed-console", name: "console", region: "eu" },
  { id: "seed-worker", name: "worker", region: "us" },
  { id: "seed-gateway", name: "gateway", region: "eu" },
  { id: "seed-billing", name: "billing", region: "us" },
];
