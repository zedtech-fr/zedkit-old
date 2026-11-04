import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { RegionSelect, stubSelectJsdom } from "./select-fixture.js";

beforeAll(() => {
  stubSelectJsdom();
  stubDrawerJsdom();
});

import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  DataTable,
  DetailPanel,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Heading,
  Input,
  Label,
  LivePulse,
  OptionCards,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RouteModal,
  SecretField,
  Section,
  Separator,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WizardSteps,
  createDataTableColumns,
} from "#index.js";
import { FormDemo } from "#preview/form-demo.js";

// Page-level rules (landmarks, document title/lang) belong to the page,
// not to a component in isolation, so they stay out of this suite.
const COMPONENT_AXE_OPTIONS = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

// Note: no toHaveNoViolations matcher — vitest-axe 0.1.0 ships no
// usable matcher types under NodeNext/vitest 2, so assert the
// violations array directly (failures print the full violation).
async function expectNoViolations(element: HTMLElement): Promise<void> {
  const results = await axe(element, COMPONENT_AXE_OPTIONS);
  expect(results.violations).toEqual([]);
}

describe("a11y", () => {
  it("headings and text", async () => {
    const { container } = render(
      <>
        <Heading level={1}>Title</Heading>
        <Heading level={2}>Section</Heading>
        <Text>Body copy.</Text>
        <Text variant="muted">Muted copy.</Text>
      </>,
    );
    await expectNoViolations(container);
  });

  it("tab list with two panels", async () => {
    const { container } = render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Demo">
          <TabsTrigger value="one">First</TabsTrigger>
          <TabsTrigger value="two">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel.</TabsContent>
        <TabsContent value="two">Second panel.</TabsContent>
      </Tabs>,
    );
    await expectNoViolations(container);
  });

  it("titled section with stacked badges", async () => {
    const { container } = render(
      <Section title="Team" description="Who can access the workspace.">
        <Stack direction="horizontal" gap={2}>
          <Badge>Ada</Badge>
          <Badge variant="secondary">Bob</Badge>
        </Stack>
      </Section>,
    );
    await expectNoViolations(container);
  });

  it("labeled checkbox and switch, checked and unchecked", async () => {
    const { container } = render(
      <>
        <Checkbox id="terms" defaultChecked aria-label="Accept the terms" />
        <Checkbox id="news" aria-label="Subscribe" />
        <Switch id="notify" defaultChecked aria-label="Notify me" />
        <Switch id="quiet" aria-label="Stay quiet" />
      </>,
    );
    await expectNoViolations(container);
  });

  it("labeled textarea", async () => {
    const { container } = render(
      <>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" placeholder="A few words." />
      </>,
    );
    await expectNoViolations(container);
  });

  it("button, badge, input+label, separator, skeleton", async () => {
    const { container } = render(
      <>
        <Button>Save</Button>
        <Badge>New</Badge>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
        <Separator />
        <Skeleton />
      </>,
    );
    await expectNoViolations(container);
  });

  it("open right drawer", async () => {
    const user = userEvent.setup();
    render(
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
          <DrawerDescription>Tracking and timeline.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await expectNoViolations(document.body);
  });

  it("open route modal", async () => {
    render(
      <RouteModal title="Delivery" description="Tracking details." onClose={vi.fn()}>
        <Text>Shared detail view.</Text>
      </RouteModal>,
    );
    await expectNoViolations(document.body);
  });

  it("open popover", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button>Filters</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filters">Open invoices only.</PopoverContent>
      </Popover>,
    );
    await expectNoViolations(document.body);
  });

  it("open tooltip", async () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button>Save</Button>
        </TooltipTrigger>
        <TooltipContent>Saves the invoice</TooltipContent>
      </Tooltip>,
    );
    await expectNoViolations(document.body);
  });

  it("open action menu", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Duplicate invoice</DropdownMenuItem>
          <DropdownMenuItem>Archive invoice</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await expectNoViolations(document.body);
  });

  it("open dialog", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>Shown in a modal.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await expectNoViolations(document.body);
  });

  it("confirm dialog after opening", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await expectNoViolations(document.body);
  });

  it("toaster region", async () => {
    const { container } = render(<Toaster />);
    await expectNoViolations(container);
  });

  it("open select", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await screen.findByRole("option", { name: "Europe" });
    await expectNoViolations(document.body);
  });

  it("default and destructive alerts", async () => {
    const { container } = render(
      <>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something worth knowing.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Failed</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      </>,
    );
    await expectNoViolations(container);
  });

  it("secret field", async () => {
    const { container } = render(<SecretField id="key" value="shown-once" aria-label="API key" />);
    await expectNoViolations(container);
  });

  it("data table with rows, empty, loading, and error states", async () => {
    const helper = createDataTableColumns<{ name: string }>();
    const columns = [helper.accessor("name", { header: "Name" })];
    const { container, unmount } = render(<DataTable columns={columns} data={[{ name: "Ada" }]} />);
    await expectNoViolations(container);
    unmount();
    const empty = render(<DataTable columns={columns} data={[]} />);
    await expectNoViolations(empty.container);
    empty.unmount();
    const loading = render(<DataTable columns={columns} data={[]} loading />);
    await expectNoViolations(loading.container);
    loading.unmount();
    const error = render(<DataTable columns={columns} data={[]} error="Could not load rows." />);
    await expectNoViolations(error.container);
  });

  it("app shell with header", async () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>} topbar={<div>Top</div>}>
        <PageHeader title="Items" />
      </AppShell>,
    );
    await expectNoViolations(container);
  });

  it("detailPanel", async () => {
    const { container } = render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    await expectNoViolations(container);
  });

  it("card with header, content, and footer", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
          <CardDescription>Connection details.</CardDescription>
        </CardHeader>
        <CardContent>Body text.</CardContent>
        <CardFooter>Footer text.</CardFooter>
      </Card>,
    );
    await expectNoViolations(container);
  });

  it("live pulse, idle and active", async () => {
    const { container, unmount } = render(<LivePulse />);
    await expectNoViolations(container);
    unmount();
    const idle = render(<LivePulse active={false} />);
    await expectNoViolations(idle.container);
  });

  it("validated form demo", async () => {
    const { container } = render(<FormDemo />);
    await expectNoViolations(container);
  });

  it("wizard steps and option cards", async () => {
    const { container } = render(
      <>
        <WizardSteps steps={["Pick", "Test"]} current={0} />
        <OptionCards
          options={[{ id: "a", title: "Alpha" }]}
          selected={["a"]}
          onChange={() => {}}
        />
        <OptionCards
          multiple={false}
          label="Delivery"
          options={[
            { id: "a", title: "Alpha" },
            { id: "b", title: "Beta" },
          ]}
          selected={["a"]}
          onChange={() => {}}
        />
      </>,
    );
    await expectNoViolations(container);
  });

  it("field set with labeled input, description, and error", async () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-name">Name</FieldLabel>
            <FieldContent>
              <Input id="field-name" aria-describedby="field-name-hint" />
              <FieldDescription id="field-name-hint">Shown on invoices.</FieldDescription>
              <FieldError errors={[{ message: "Too short." }]} />
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>,
    );
    await expectNoViolations(container);
  });

  it("table with caption, header, body, and footer", async () => {
    const { container } = render(
      <Table>
        <TableCaption>Monthly totals.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>January</TableCell>
            <TableCell>12</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>12</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    await expectNoViolations(container);
  });
});
