import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppShell,
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSkeleton,
  CardTitle,
  Checkbox,
  Checkmark,
  ConfirmDialog,
  Container,
  DataTable,
  DataTableSkeleton,
  DatePicker,
  DetailPanel,
  DetailPanelSkeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Heading,
  Input,
  Label,
  LivePulse,
  Section,
  Stack,
  StatusDot,
  StatusLabel,
  UpdatedAgo,
  EmptyState,
  ErrorState,
  OfflineNote,
  OptionCards,
  PageHeader,
  PageHeaderSkeleton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressBar,
  PromptInput,
  Spinner,
  SecretField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Switch,
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
import {
  CtaBand,
  Faq,
  FeatureGrid,
  GlassSurface,
  Hero,
  HowItWorks,
  LocaleSwitch,
  LogoBand,
  MarketingFooter,
  MarketingHeader,
  MediaSection,
  Pricing,
  Testimonials,
} from "#marketing/index.js";
import { X } from "lucide-react";
import { FormDemo } from "./form-demo.js";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [helper.accessor("name", { header: "Name" }), helper.accessor("age", { header: "Age" })];
const rows: Person[] = [
  { name: "Ada", age: 36 },
  { name: "Bob", age: 30 },
  { name: "Cara", age: 28 },
];

const SECTIONS = [
  ["primitives", "Primitives"],
  ["overlays", "Overlays"],
  ["data-table", "Data table"],
  ["layout", "Layout"],
  ["loading", "Loading"],
  ["wizard", "Wizard"],
  ["forms", "Forms"],
  ["marketing", "Marketing"],
] as const;

function GallerySection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 border-b pb-8 last:border-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  return (
    <AppShell
      sidebar={
        <nav className="space-y-1 p-4" aria-label="Gallery sections">
          <p className="px-2 pb-2 text-sm font-semibold">UI gallery</p>
          {SECTIONS.map(([id, title]) => (
            <a key={id} href={`#${id}`} className="block rounded-md px-2 py-1 text-sm hover:bg-accent">
              {title}
            </a>
          ))}
        </nav>
      }
      topbar={
        <div className="flex items-center justify-between p-4">
          <p className="text-sm font-medium">Component gallery (static preview)</p>
          <LivePulse />
        </div>
      }
    >
      <PageHeader
        title="UI gallery"
        description="Every component in every state. Static render for visual review; behavior is covered by unit tests."
      />
      <div className="space-y-8">
        <GallerySection id="primitives" title="Primitives">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="flex items-center gap-3" aria-label="Status dots">
            <StatusDot tone="active" />
            <StatusDot tone="idle" />
            <StatusDot tone="success" />
            <StatusDot tone="warning" />
            <StatusDot tone="danger" />
            <Checkmark label="Saved" />
          </div>
          <div className="max-w-sm space-y-2">
            <ProgressBar value={65} label="Uploading report" />
            <ProgressBar value={100} label="Sync complete" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusLabel tone="loading">Saving report…</StatusLabel>
            <StatusLabel tone="saved">Saved</StatusLabel>
            <StatusLabel tone="error">Could not save</StatusLabel>
            <UpdatedAgo date={Date.now() - 3 * 60_000} />
          </div>
          <div className="max-w-sm space-y-2">
            <OfflineNote />
          </div>
          <div className="max-w-sm space-y-2">
            <EmptyState title="No invoices" description="Create an invoice to send to a client." actions={<Button>New invoice</Button>} />
            <ErrorState title="Could not load invoices" description="Check your connection and try again." actions={<Button variant="outline">Try again</Button>} />
            <Spinner />
          </div>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="gallery-name">Name</Label>
            <Input id="gallery-name" placeholder="Ada" />
          </div>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="gallery-bio">Bio</Label>
            <Textarea id="gallery-bio" placeholder="A few words." />
          </div>
          <Separator />
          <Skeleton className="h-4 w-48" />
          <div className="space-y-2">
            <Heading level={1}>Page title</Heading>
            <Heading level={2}>Section title</Heading>
            <Text>Body copy for paragraphs.</Text>
            <Text variant="muted">Muted secondary copy.</Text>
          </div>
        </GallerySection>

        <GallerySection id="overlays" title="Overlays">
          {/* Closed on purpose: an open modal would dim the whole
              review surface. Open behavior is covered by unit tests. */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Details</DialogTitle>
              <DialogDescription>Dialog content.</DialogDescription>
            </DialogContent>
          </Dialog>
          <ConfirmDialog
            trigger={<Button variant="destructive">Delete</Button>}
            title="Delete item?"
            description="This cannot be undone."
            onConfirm={() => {}}
          />
          <div className="flex flex-wrap gap-2">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHandle />
                <DrawerTitle>Filters</DrawerTitle>
                <DrawerDescription>Bottom sheet content.</DrawerDescription>
              </DrawerContent>
            </Drawer>
            <Drawer direction="right">
              <DrawerTrigger asChild>
                <Button variant="outline">Open drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close details"
                    className="absolute top-4 right-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
                <DrawerTitle>Details</DrawerTitle>
                <DrawerDescription>Side panel content.</DrawerDescription>
              </DrawerContent>
            </Drawer>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Filters">
              <Text>Filter invoices.</Text>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Save</Button>
            </TooltipTrigger>
            <TooltipContent>Saves the invoice</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Duplicate invoice</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Calendar defaultMonth={new Date(2026, 9, 1)} today={new Date(2026, 9, 15)} />
          <DatePicker defaultMonth={new Date(2026, 9, 1)} today={new Date(2026, 9, 15)} />
          <SecretField id="gallery-key" value="shown-once-value" aria-label="API key" />
          <Alert className="max-w-sm">
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>Something worth knowing.</AlertDescription>
          </Alert>
          <Alert variant="destructive" className="max-w-sm">
            <AlertTitle>Failed</AlertTitle>
            <AlertDescription>Something went wrong.</AlertDescription>
          </Alert>
          <Toaster />
        </GallerySection>

        <GallerySection id="data-table" title="Data table">
          <h3 className="text-sm font-medium text-muted-foreground">With rows</h3>
          <DataTable columns={columns} data={rows} pageSize={2} />
          <h3 className="text-sm font-medium text-muted-foreground">Empty</h3>
          <DataTable columns={columns} data={[]} />
          <h3 className="text-sm font-medium text-muted-foreground">Loading</h3>
          <DataTable columns={columns} data={[]} loading />
          <h3 className="text-sm font-medium text-muted-foreground">Error</h3>
          <DataTable columns={columns} data={[]} error="Could not load rows." />
        </GallerySection>

        <GallerySection id="layout" title="Layout">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Server</CardTitle>
              <CardDescription>Connection details.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Body text.</p>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Footer text.</p>
            </CardFooter>
          </Card>
          <DetailPanel
            items={[
              { label: "Name", value: "Ada" },
              { label: "Region", value: "eu" },
            ]}
          />
          <Tabs defaultValue="one" className="max-w-sm">
            <TabsList>
              <TabsTrigger value="one">First</TabsTrigger>
              <TabsTrigger value="two">Second</TabsTrigger>
            </TabsList>
            <TabsContent value="one">First panel.</TabsContent>
            <TabsContent value="two">Second panel.</TabsContent>
          </Tabs>
          <Section title="Team" description="Who can access the workspace.">
            <Stack direction="horizontal" gap={2}>
              <Badge>Ada</Badge>
              <Badge variant="secondary">Bob</Badge>
            </Stack>
          </Section>
          <div className="space-y-2">
            <Container width="narrow" className="border py-2 text-sm">
              Narrow container
            </Container>
            <Container width="reading" className="border py-2 text-sm">
              Reading container
            </Container>
            <Container className="border py-2 text-sm">Default container</Container>
            <Container width="wide" className="border py-2 text-sm">
              Wide container
            </Container>
          </div>
          <Section bleed tone="muted" spacing="sm" title="Bleed section" description="Edge to edge, content capped.">
            <p className="text-sm">Band content.</p>
          </Section>
          <div className="flex gap-4">
            <LivePulse />
            <LivePulse active={false} />
          </div>
        </GallerySection>

        <GallerySection id="loading" title="Loading">
          <PageHeaderSkeleton label="Loading page" />
          <div className="max-w-sm">
            <CardSkeleton label="Loading card" />
          </div>
          <DetailPanelSkeleton label="Loading details" rows={2} />
          <DataTableSkeleton label="Loading table" columns={3} rows={2} />
        </GallerySection>

        <GallerySection id="forms" title="Forms">
          <FormDemo />
          <div className="max-w-sm space-y-3" data-testid="gallery-prompt-input">
            <PromptInput
              sendLabel="Send"
              value="Ask about your catalog"
              onChange={() => {}}
              onSubmit={() => {}}
              aria-label="Message"
              placeholder="Ask anything"
            />
            <PromptInput
              sendLabel="Send"
              value="Working…"
              busy
              onCancel={() => {}}
              cancelLabel="Stop"
              onChange={() => {}}
              onSubmit={() => {}}
              aria-label="Message while busy"
            />
          </div>
          <Select>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Pick a region" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Regions</SelectLabel>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="us">Americas</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Checkbox id="gallery-terms" defaultChecked />
            <Label htmlFor="gallery-terms">Accept the terms</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="gallery-notify" defaultChecked />
            <Label htmlFor="gallery-notify">Notify me</Label>
          </div>
        </GallerySection>

        <GallerySection id="wizard" title="Wizard">
          <WizardSteps steps={["Pick", "Configure", "Test"]} current={1} />
          <OptionCards
            options={[
              { id: "a", title: "Alpha", description: "First option." },
              { id: "b", title: "Beta", description: "Second option." },
            ]}
            selected={["a"]}
            onChange={() => {}}
          />
          <OptionCards
            multiple={false}
            label="Pick one"
            options={[
              { id: "a", title: "Alpha", description: "First option." },
              { id: "b", title: "Beta", description: "Second option." },
            ]}
            selected={["b"]}
            onChange={() => {}}
          />
        </GallerySection>

        <GallerySection id="marketing" title="Marketing">
          <MarketingHeader
            sticky={false}
            brand={<a href="#marketing" className="inline-flex min-h-11 items-center font-semibold">Harbor</a>}
            links={[
              <a key="docs" href="#marketing">Docs</a>,
              <a key="pricing" href="#marketing">Pricing</a>,
            ]}
            actions={
              <>
                <LocaleSwitch
                  locales={[
                    { code: "en", label: "EN", href: "#marketing" },
                    { code: "fr", label: "FR", href: "#marketing" },
                  ]}
                  current="en"
                />
                <Button size="sm">Create an account</Button>
              </>
            }
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassSurface>Plain surface</GlassSurface>
            <GlassSurface tone="raised">Raised surface</GlassSurface>
            <GlassSurface tone="tinted">Tinted surface</GlassSurface>
          </div>
          <Hero
            eyebrow="Gallery"
            title="Keep your shop. Add live updates."
            description="Stock, orders and offers update on the page without a refresh."
            actions={
              <>
                <Button size="lg">Create an account</Button>
                <Button size="lg" variant="outline">
                  Read the docs
                </Button>
              </>
            }
          />
          <LogoBand
            title="Works with the shops you know"
            logos={[
              { name: "Harbor Studio", logo: <span className="text-lg font-semibold">Harbor</span> },
              { name: "North Shop", logo: <span className="text-lg font-semibold">North</span> },
              { name: "Linen & Co", logo: <span className="text-lg font-semibold">Linen</span> },
            ]}
          />
          <FeatureGrid
            title="Built for the shop you already run"
            description="Add live features next to it, without replatforming."
            features={[
              { title: "Live stock", description: "Counts follow every sale." },
              { title: "Personal offers", description: "Each visitor sees what fits." },
              { title: "Shopping assistant", description: "Answers from your catalog." },
            ]}
          />
          <HowItWorks
            title="Live in three steps"
            steps={[
              { title: "Create an account", description: "No card needed." },
              { title: "Create a key", description: "A staging key takes a minute." },
              { title: "See your first event", description: "It shows up in the console." },
            ]}
          />
          <Testimonials
            title="What shops say"
            items={[
              { quote: "We launched a new offer in a day.", name: "Ada Lovelace", role: "Head of e-commerce, Harbor Studio", avatar: "AL" },
              { quote: "Stock on the page is always right.", name: "Grace Hopper", role: "Founder, North Shop", avatar: "GH" },
            ]}
          />
          <MediaSection
            title="An assistant that knows your catalog"
            description="Visitors ask in plain words and get answers from your products."
            points={["Reads your products and stock", "Never changes an order"]}
            media={<p className="text-sm text-muted-foreground">Demo or screenshot goes here.</p>}
          />
          <Pricing
            title="Simple pricing"
            description="Start on a staging key. Pay when you go live."
            plans={[
              { name: "Starter", price: "€0", period: "per month", features: ["1 staging key", "Community support"], action: <Button variant="outline">Start free</Button> },
              { name: "Growth", price: "€29", period: "per month", features: ["5 keys", "Email support"], action: <Button>Choose Growth</Button>, highlighted: true, badge: "Most popular" },
            ]}
          />
          <Faq
            title="Questions"
            items={[
              { question: "Do I need to change my shop?", answer: "No. It runs next to the shop you already have." },
              { question: "How long does a key take?", answer: "About a minute on staging." },
            ]}
          />
          <CtaBand
            title="Try it on a staging key"
            description="Sign up, create a key, see your first event in minutes."
            actions={<Button size="lg">Create an account</Button>}
          />
          <MarketingFooter
            brand={<span className="font-semibold">Harbor</span>}
            description="Live features for the shop you already run."
            columns={[
              { title: "Product", links: [<a key="docs" href="#marketing">Docs</a>, <a key="pricing" href="#marketing">Pricing</a>] },
              { title: "Company", links: [<a key="about" href="#marketing">About</a>] },
            ]}
            legal={<p>© 2026 Harbor</p>}
          />
        </GallerySection>
      </div>
    </AppShell>
  );
}
