"use client";

import { useRef, useState } from "react";

import { DOCS_TYPE_BODY_CLASS, DOCS_TYPE_H3_CLASS, DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import {
  Button,
  DataTable,
  DetailPanel,
  Heading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  Toaster,
  toast,
} from "@zedtech/zedkit-ui";

import { buildAdminDashboardColumns } from "./admin-dashboard-demo-columns";
import {
  AdminDashboardDemoDrawer,
} from "./admin-dashboard-demo-drawer";
import { useAdminDashboardForm } from "./admin-dashboard-demo-form";
import {
  adminDashboardSeedApps,
  type AdminAppRow,
  type AdminDashboardFormValues,
  type PreviewMode,
} from "./admin-dashboard-demo-types";
import { adminDashboardDemoCopy } from "@/components/i18n/admin-dashboard-demo-copy";

export type { PreviewMode } from "./admin-dashboard-demo-types";

/**
 * Shared interactive admin dashboard (home demo + future tutorial).
 * Local state only; preview modes exercise DataTable loading/empty/error.
 */
export function AdminDashboardDemoApp({
  label = adminDashboardDemoCopy.defaultAriaLabel,
  preview: previewProp,
  onPreviewChange,
  variant = "default",
}: {
  label?: string;
  preview?: PreviewMode;
  onPreviewChange?: (mode: PreviewMode) => void;
  variant?: "default" | "home";
}) {
  const isHome = variant === "home";
  const [apps, setApps] = useState<AdminAppRow[]>(adminDashboardSeedApps);
  const [previewInternal, setPreviewInternal] = useState<PreviewMode>("ready");
  const preview = previewProp ?? previewInternal;
  const setPreview = (mode: PreviewMode) => {
    onPreviewChange?.(mode);
    if (previewProp === undefined) setPreviewInternal(mode);
  };
  const [selectedId, setSelectedId] = useState<string | null>(adminDashboardSeedApps[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const openerNameRef = useRef<string | null>(null);
  const form = useAdminDashboardForm();

  const selectedApp = selectedId ? apps.find((row) => row.id === selectedId) : undefined;

  /**
   * Remember what opened the overlay so focus can go back to it. A press does not always focus its button (Safari,
   * and any press that lands while the table re-renders), so when nothing usable has focus the control's name is kept.
   */
  function rememberOpener(name: string) {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    openerNameRef.current = name;
  }

  function restoreOpener() {
    const remembered = openerRef.current;
    const name = remembered?.getAttribute("aria-label") ?? openerNameRef.current;
    const text = remembered?.textContent?.trim() || name || "";
    const find = () => {
      if (remembered && document.contains(remembered)) return remembered;
      const scope = document.querySelector(`[aria-label="${CSS.escape(label)}"]`);
      if (!scope) return null;
      const byName = name ? scope.querySelector<HTMLElement>(`button[aria-label="${CSS.escape(name)}"]`) : null;
      return byName ?? [...scope.querySelectorAll("button")].find((el) => el.textContent?.trim() === text) ?? null;
    };
    // The opener can still be inert for a frame or two while the overlay's outside-content lock is released (a
    // focus() on an inert element is silently ignored), and the table can re-render and replace it just after.
    // So for one second, whenever focus has fallen to the page (or is still inside the closing overlay), put it
    // back; as soon as the visitor has moved focus somewhere real, leave it alone.
    const started = performance.now();
    const attempt = () => {
      const target = find();
      const active = document.activeElement;
      const adrift = !active || active === document.body || active.closest("[role='dialog']") !== null;
      if (target && active !== target && adrift) target.focus({ preventScroll: true });
      if (performance.now() - started < 1000) requestAnimationFrame(attempt);
    };
    requestAnimationFrame(() => requestAnimationFrame(attempt));
  }

  function openCreate() {
    rememberOpener(adminDashboardDemoCopy.addApp);
    setEditingId(null);
    form.reset({ name: "", region: "eu" });
    setDrawerOpen(true);
  }

  function openEdit(row: AdminAppRow) {
    rememberOpener(adminDashboardDemoCopy.columns.editAriaLabel(row.name));
    setEditingId(row.id);
    form.reset({ name: row.name, region: row.region });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  function onSubmit(values: AdminDashboardFormValues) {
    if (editingId) {
      setApps((prev) => prev.map((row) => (row.id === editingId ? { ...row, ...values } : row)));
      toast.success(adminDashboardDemoCopy.toast.updated);
    } else {
      setApps((prev) => [...prev, { id: `app-${Date.now()}`, ...values }]);
      toast.success(adminDashboardDemoCopy.toast.added);
    }
    closeDrawer();
    restoreOpener();
  }

  function deleteApp(id: string) {
    setApps((prev) => prev.filter((row) => row.id !== id));
    setSelectedId((current) => (current === id ? null : current));
    toast.success(adminDashboardDemoCopy.toast.removed);
  }

  const tableData = preview === "empty" ? [] : apps;
  const loading = preview === "loading";
  const error = preview === "error" ? adminDashboardDemoCopy.loadError : null;

  const columns = buildAdminDashboardColumns({
    selectedId,
    onSelect: setSelectedId,
    onEdit: openEdit,
    onDelete: deleteApp,
  });

  const toolbarPad = isHome ? "p-3" : "p-4";
  const bodyPad = isHome ? "p-3 pt-0" : "p-4";

  return (
    <>
      <Toaster />
      <Stack className="w-full min-w-0" aria-label={label} data-admin-dashboard-demo={isHome ? "home" : undefined} {...(!isHome ? { "data-demo-specimen": "" } : {})}>
        {isHome ? (
          <Stack
            direction="horizontal"
            gap={3}
            className={`items-start justify-between border-b border-border ${toolbarPad}`}
            data-demo-toolbar
          >
            <Stack gap={1} className="min-w-0">
              <Heading level={2} className={`${DOCS_TYPE_H3_CLASS} tracking-tight`}>
                {adminDashboardDemoCopy.heading}
              </Heading>
              <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
                {adminDashboardDemoCopy.homeHint}
              </Text>
            </Stack>
            <Button type="button" className="shrink-0" onClick={openCreate}>
              {adminDashboardDemoCopy.addApp}
            </Button>
          </Stack>
        ) : (
          <Stack gap={3} className={`border-b border-border ${toolbarPad}`} data-demo-toolbar>
            <Heading level={2} className={`${DOCS_TYPE_H3_CLASS} tracking-tight`}>
              {adminDashboardDemoCopy.heading}
            </Heading>
            <Text variant="muted" className={DOCS_TYPE_BODY_CLASS}>
              {adminDashboardDemoCopy.defaultHint}
            </Text>
            <Stack direction="horizontal" gap={2} className="flex-nowrap items-center">
              <Select value={preview} onValueChange={(value) => setPreview(value as PreviewMode)}>
                <SelectTrigger className="min-w-0 flex-1" aria-label={adminDashboardDemoCopy.previewModeAriaLabel}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">{adminDashboardDemoCopy.previewModes.ready}</SelectItem>
                  <SelectItem value="loading">{adminDashboardDemoCopy.previewModes.loading}</SelectItem>
                  <SelectItem value="empty">{adminDashboardDemoCopy.previewModes.empty}</SelectItem>
                  <SelectItem value="error">{adminDashboardDemoCopy.previewModes.error}</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" className="shrink-0" onClick={openCreate}>
                {adminDashboardDemoCopy.addApp}
              </Button>
            </Stack>
          </Stack>
        )}
        <Stack gap={isHome ? 2 : 4} className={`min-w-0 ${bodyPad}`}>
          <DataTable
            columns={columns}
            data={tableData}
            loading={loading}
            error={error}
            emptyMessage={adminDashboardDemoCopy.emptyMessage}
            pageSize={5}
          />
          {!isHome && preview === "ready" && !loading && !error ? (
            selectedApp ? (
              <DetailPanel
                className="min-w-0"
                items={[
                  { label: adminDashboardDemoCopy.detail.name, value: selectedApp.name },
                  { label: adminDashboardDemoCopy.detail.region, value: selectedApp.region },
                  { label: adminDashboardDemoCopy.detail.id, value: selectedApp.id },
                ]}
              />
            ) : (
              <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
                {adminDashboardDemoCopy.detail.selectRow}
              </Text>
            )
          ) : null}
        </Stack>
      </Stack>

      <AdminDashboardDemoDrawer
        open={drawerOpen}
        editingId={editingId}
        form={form}
        onOpenChange={(open) => (open ? setDrawerOpen(true) : closeDrawer())}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreOpener();
        }}
        onAnimationEnd={(open) => {
          if (!open) restoreOpener();
        }}
        onSubmit={onSubmit}
      />
    </>
  );
}
