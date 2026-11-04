import { ScrollGallery, Stack, Tabs, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";

/** Identity chips in a single scroll row (tabs inside ScrollGallery). */
export function ScrollGalleryIdentityDemo() {
  return (
    <Tabs defaultValue="one">
      <ScrollGallery className="w-full max-w-sm">
        <TabsList className="inline-flex w-max flex-nowrap" aria-label="Looks">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
          <TabsTrigger value="three">Three</TabsTrigger>
          <TabsTrigger value="four">Four</TabsTrigger>
          <TabsTrigger value="five">Five</TabsTrigger>
        </TabsList>
      </ScrollGallery>
    </Tabs>
  );
}

/** Filter-style links in a horizontal snap row. */
export function ScrollGalleryChipsDemo() {
  return (
    <ScrollGallery className="max-w-sm">
      <Stack direction="row" gap={2} className="w-max">
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
