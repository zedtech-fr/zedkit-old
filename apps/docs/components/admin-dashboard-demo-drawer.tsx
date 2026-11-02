"use client";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  Form,
  FormSubmit,
} from "@zedtech/zedkit-ui";

import { AdminDashboardDemoDrawerFields } from "./admin-dashboard-demo-drawer-fields";
import type { AdminDashboardFormControl } from "./admin-dashboard-demo-form";
import { type AdminDashboardFormValues } from "./admin-dashboard-demo-types";
import { adminDashboardDemoCopy } from "@/components/i18n/admin-dashboard-demo-copy";

export function AdminDashboardDemoDrawer({
  open,
  editingId,
  form,
  onOpenChange,
  onCloseAutoFocus,
  onAnimationEnd,
  onSubmit,
}: {
  open: boolean;
  editingId: string | null;
  form: AdminDashboardFormControl;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
  onAnimationEnd: (open: boolean) => void;
  onSubmit: (values: AdminDashboardFormValues) => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onAnimationEnd={onAnimationEnd}
      direction="right"
    >
      <DrawerContent onCloseAutoFocus={onCloseAutoFocus}>
        <DrawerHandle />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle>
                {editingId ? adminDashboardDemoCopy.drawer.editTitle : adminDashboardDemoCopy.drawer.addTitle}
              </DrawerTitle>
              <DrawerDescription>{adminDashboardDemoCopy.drawer.description}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <AdminDashboardDemoDrawerFields form={form} />
            </DrawerBody>
            <DrawerFooter>
              <FormSubmit>
                {editingId ? adminDashboardDemoCopy.drawer.saveChanges : adminDashboardDemoCopy.drawer.createApp}
              </FormSubmit>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  {adminDashboardDemoCopy.drawer.cancel}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
