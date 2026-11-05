import { HomeLink } from "@/ui/home/home-link";
import { Button, Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { CatalogActionLabel } from "@/components/docs-action-label";
import {
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

/** Each name is a control: bordered like one, 44px tall on a phone, 13px text (dense-UI size). */
function FamilyExampleLinks({ examples }: { examples: readonly { label: string; href: string }[] }) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      {examples.map((item) => (
        <Button key={item.href} asChild variant="outline" size="sm" className="min-h-11 px-2 text-sm md:min-h-0 md:px-3">
          <HomeLink href={item.href}>{item.label}</HomeLink>
        </Button>
      ))}
    </Stack>
  );
}

/** Browse UI by task family — one focal list, not a preview card grid. */
export function HomeComponentFamiliesSection({
  componentCount,
}: {
  componentCount: number;
}) {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="components"
      title={homeCopy.componentFamilies.section.title}
      description={homeCopy.componentFamilies.section.description(componentCount)}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} data-home-component-families="">
        <Stack className="min-w-0 divide-y divide-border border-y border-border">
          {homeCopy.componentFamilies.families.map((family) => (
            <Stack
              key={family.label}
              gap={2}
              className="py-4 md:grid md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:items-baseline md:gap-x-8 md:py-6"
            >
              <Stack gap={1} className="min-w-0">
                <Heading level={3} typeRole="heading" data-family-title="">
                  {family.label}
                </Heading>
                <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                  {family.blurb}
                </Text>
              </Stack>
              <FamilyExampleLinks examples={family.examples} />
            </Stack>
          ))}
        </Stack>
        <Button asChild variant="outline" className="w-fit">
          <HomeLink href="/catalog?area=ui">
            <CatalogActionLabel>{homeCopy.componentFamilies.section.browseAll}</CatalogActionLabel>
          </HomeLink>
        </Button>
      </Stack>
    </Section>
  );
}
