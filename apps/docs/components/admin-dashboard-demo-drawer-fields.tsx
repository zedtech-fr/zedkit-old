"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@zedtech/zedkit-ui";

import type { AdminDashboardFormControl } from "./admin-dashboard-demo-form";
import { adminDashboardDemoCopy } from "@/components/i18n/admin-dashboard-demo-copy";

export function AdminDashboardDemoDrawerFields({
  form,
}: {
  form: AdminDashboardFormControl;
}) {
  return (
    <Stack gap={4} className="py-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{adminDashboardDemoCopy.drawer.fieldName}</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{adminDashboardDemoCopy.drawer.fieldRegion}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={adminDashboardDemoCopy.drawer.regionPlaceholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="eu">{adminDashboardDemoCopy.drawer.regionEu}</SelectItem>
                <SelectItem value="us">{adminDashboardDemoCopy.drawer.regionUs}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </Stack>
  );
}
