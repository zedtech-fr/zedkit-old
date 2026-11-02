"use client";

import {
  AppShell,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  FieldLabel,
  Input,
  PageHeader,
  Stack,
  Text,
  createDataTableColumns,
} from "@zedtech/zedkit-ui";

interface ItemRow {
  name: string;
  status: string;
}

const columnHelper = createDataTableColumns<ItemRow>();

const seed: ItemRow[] = [
  { name: "reports-api", status: "active" },
  { name: "billing-worker", status: "paused" },
  { name: "webhooks", status: "active" },
  { name: "search-index", status: "paused" },
];

function Sidebar() {
  return (
    <Stack gap={4} className="h-full p-3">
      <Stack gap={1}>
        <Text className="font-semibold">Harbor Studio</Text>
        <Text variant="muted" className="text-xs">
          Admin
        </Text>
      </Stack>
      <nav aria-label="Main">
        <Stack gap={1}>
          <Button type="button" variant="secondary" className="w-full justify-start" aria-current="page">
            Projects
          </Button>
          <Button type="button" variant="ghost" className="w-full justify-start">
            Services
          </Button>
          <Button type="button" variant="ghost" className="w-full justify-start">
            Settings
          </Button>
        </Stack>
      </nav>
    </Stack>
  );
}

function TopBar() {
  return (
    <Stack direction="horizontal" gap={2} className="justify-end px-4 py-2">
      <Text
        as="span"
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        MC
      </Text>
      <Text as="span" className="text-sm font-medium">
        Maya Chen
      </Text>
    </Stack>
  );
}

export function AdminDashboardPage() {
  const columns = [
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ getValue }: { getValue: () => string }) => (
        <Badge variant={getValue() === "active" ? "success" : "warning"}>{getValue()}</Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: ItemRow; id: string } }) => (
        <Stack direction="horizontal" gap={2}>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">Edit</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle>Edit {row.original.name}</DrawerTitle>
                <DrawerDescription>Update the display name. Focus returns here when you close the drawer.</DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <Field>
                  <FieldLabel htmlFor={`name-${row.id}`}>Name</FieldLabel>
                  <Input id={`name-${row.id}`} defaultValue={row.original.name} />
                </Field>
              </DrawerBody>
              <DrawerFooter>
                <Button type="button">Save</Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm">Delete</Button>}
            title={`Delete ${row.original.name}?`}
            description="This removes the row from the table in this demo."
            onConfirm={() => {}}
          />
        </Stack>
      ),
    }),
  ];

  return (
    <AppShell sidebar={<Sidebar />} topbar={<TopBar />}>
      <PageHeader title="Projects" description="Services in this workspace. Edit a row or remove it." />
      <DataTable columns={columns} data={seed} pageSize={6} />
    </AppShell>
  );
}
