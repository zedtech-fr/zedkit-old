import { ScrollGallery, Stack, Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";

const LOOKS = [
  ["one", "One"],
  ["two", "Two"],
  ["three", "Three"],
  ["four", "Four"],
  ["five", "Five"],
] as const;

/** Identity chips in a single scroll row (tabs inside ScrollGallery). */
export function ScrollGalleryIdentityDemo() {
  return (
    <Tabs defaultValue="one">
      <ScrollGallery className="w-full max-w-sm">
        <TabsList className="inline-flex w-max flex-nowrap" aria-label="Looks">
          {LOOKS.map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollGallery>
      {LOOKS.map(([value, label]) => (
        <TabsContent key={value} value={value} className="text-sm text-muted-foreground">
          {label}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Filter-style links in a horizontal snap row. */
export function ScrollGalleryChipsDemo() {
  return (
    <ScrollGallery className="max-w-sm">
      <Stack direction="horizontal" gap={2} className="w-max">
        <a className="shrink-0 snap-start rounded-md border px-3 py-2" href="#alpha">
          Alpha
        </a>
        <a className="shrink-0 snap-start rounded-md border px-3 py-2" href="#beta">
          Beta
        </a>
        <a className="shrink-0 snap-start rounded-md border px-3 py-2" href="#gamma">
          Gamma
        </a>
        <a className="shrink-0 snap-start rounded-md border px-3 py-2" href="#delta">
          Delta
        </a>
      </Stack>
    </ScrollGallery>
  );
}
