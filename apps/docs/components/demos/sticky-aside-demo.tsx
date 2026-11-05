"use client";

import { Button, Card, CardContent, Heading, StickyAside, Stack, Text } from "@zedtech/zedkit-ui";

const steps = [
  { title: "Install the package", body: "Add the UI kit to your app." },
  { title: "Import the styles", body: "Pull in the kit CSS once in your globals." },
  { title: "Render a control", body: "Use a primitive in your page." },
];

export function StickyAsideDemo() {
  return (
    <StickyAside className="min-h-80 [--zk-sticky-top:4.5rem]" side="right">
      <StickyAside.Main>
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {steps.map((step, index) => (
            <li key={step.title} className="min-w-0">
              <Stack gap={1}>
                <Text variant="muted" className="text-xs">
                  Step {index + 1}
                </Text>
                <Heading level={3}>{step.title}</Heading>
                <Text variant="muted">{step.body}</Text>
              </Stack>
            </li>
          ))}
        </ol>
      </StickyAside.Main>
      <StickyAside.Aside asChild>
        <Card>
          <CardContent className="pt-card-padding">
            <Stack gap={2} role="group" aria-label="Rendered example">
              <Text className="text-xs font-medium text-muted-foreground">Rendered example</Text>
              <Button>Save</Button>
            </Stack>
          </CardContent>
        </Card>
      </StickyAside.Aside>
    </StickyAside>
  );
}

export function StickyAsideDocStepsDemo() {
  return (
    <StickyAside side="left" from="md" ratio="2/5" scrollable className="[--zk-sticky-top:4.5rem]">
      <StickyAside.Main>
        <Stack gap={3}>
          <Heading level={3}>Write the guide</Heading>
          <Text variant="muted">Steps stay in the main column for reading order.</Text>
        </Stack>
      </StickyAside.Main>
      <StickyAside.Aside>
        <Card>
          <CardContent className="pt-card-padding">
            <Text variant="muted" className="text-sm">
              Summary or preview — sticks while the section scrolls; pass scrollable when this block is taller than the viewport.
            </Text>
          </CardContent>
        </Card>
      </StickyAside.Aside>
    </StickyAside>
  );
}
