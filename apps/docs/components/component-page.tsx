import Link from "next/link";
import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { registryBrickNames } from "../content/registry-site";
import { componentPageSections } from "../lib/component-page-sections.mjs";
import { DEFAULT_PROPS_PRIORITY } from "../lib/props-priority.mjs";
import { ComponentPreview } from "./component-preview";
import { ComponentWrapsLine } from "./component-wraps-line";
import { MaturityBadge } from "./maturity-badge";
import { PropsTable } from "./props-table";
import { AdoptionPanelView, adoptionPlanFor } from "./adoption-panel-view";
import { highlightedTs } from "./highlighted-code";
import { componentPageCopy } from "@/components/i18n/component-page-copy";
import type { AdoptionPlan } from "@/lib/adoption-types";

export interface CatalogExample {
  title: string;
  code: string;
}

export interface RelatedLink {
  title: string;
  href: string;
}

/** The typed adoption contract the catalog declares for the need (JavaScript, stylesheet or config). */
type CatalogAdoption = Parameters<typeof adoptionPlanFor>[0]["need"]["adoption"];

export interface ComponentPageProps {
  /** Catalog heading of the need. */
  needName: string;
  shortName: string;
  adoption: CatalogAdoption;
  /** When the first example is a whole file, where it goes (for instance `src/app/layout.tsx`). */
  exampleFile?: string;
  packageName: string;
  version: string;
  status: string;
  purpose: string;
  audience: string;
  whenToUse: string;
  whenNotToUse: string;
  wraps: string;
  registry: string;
  demo: string;
  propsFile: string | null;
  propsName: string | null;
  propsPriority?: string[];
  /** Folds every prop outside `propsPriority`; names and links the folded group. */
  propsRest?: { summary: string; href: string };
  examples: CatalogExample[];
  /** Example title → demo registry key: a live preview rendered above that code block. */
  examplePreviews?: Record<string, string>;
  a11y: string;
  troubleshooting: string;
  related: RelatedLink[];
}

/** Catalog prose marks code with backticks; render them as `<code>`, not literal ticks. */
function inlineCode(text: string) {
  return text.split(/`([^`]+)`/).map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

export async function ComponentPage({
  needName,
  shortName,
  adoption,
  exampleFile,
  packageName,
  version,
  status,
  purpose,
  audience,
  whenToUse,
  whenNotToUse,
  wraps,
  registry,
  demo,
  propsFile,
  propsName,
  propsPriority = DEFAULT_PROPS_PRIORITY,
  propsRest,
  examples,
  examplePreviews = {},
  a11y,
  troubleshooting,
  related,
}: ComponentPageProps) {
  const hasProps = Boolean(propsFile && propsName);
  const sections = componentPageSections({ hasProps, a11y, related, troubleshooting });
  const copyable = registry.length > 0 && registryBrickNames.includes(registry);
  const plan: AdoptionPlan = adoptionPlanFor({
    need: { need: needName, shortName, adoption, examples, registry: copyable ? registry : "", ...(exampleFile ? { exampleFile } : {}) },
    packageName,
  });

  return (
    <Stack gap={8}>
      <Stack gap={3}>
        {status !== "stable" ? <MaturityBadge status={status} /> : null}
        <Text className="text-base text-muted-foreground sm:text-lg">{purpose}</Text>
      </Stack>

      <Stack id="example">
        <ComponentPreview demo={demo} hasProps={hasProps} a11yRoot />
      </Stack>

      <dl id="guidance" className="m-0 grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-[max-content_1fr] sm:items-baseline">
        <dt className="m-0 font-normal text-foreground">{componentPageCopy.guidance.who}</dt>
        <dd className="m-0 min-w-0">{audience}</dd>
        <dt className="m-0 font-normal text-foreground">{componentPageCopy.guidance.useWhen}</dt>
        <dd className="m-0 min-w-0">{whenToUse}</dd>
        <dt className="m-0 font-normal text-foreground">{componentPageCopy.guidance.avoidWhen}</dt>
        <dd className="m-0 min-w-0">{whenNotToUse}</dd>
      </dl>

      <Section title={componentPageCopy.sections.installOrCopy} id="install-or-copy" className="space-y-3">
        <Stack gap={3}>
          <AdoptionPanelView plan={plan} />
          <Text variant="muted" className="text-xs">
            {componentPageCopy.packageVersionLine(version)}
          </Text>
        </Stack>
      </Section>

      <Section title={componentPageCopy.sections.usageAndStates} id="usage-and-states" className="space-y-3">
        <Stack gap={4}>
          {copyable ? (
            <Text variant="muted" className="text-sm" data-usage-import-note="">
              {componentPageCopy.usageImportNote(registry)}
            </Text>
          ) : null}
          {await Promise.all(
            examples.map(async (ex) => {
              const previewDemo = examplePreviews[ex.title];
              return (
                <Stack key={ex.title} gap={2}>
                  {previewDemo ? (
                    <>
                      <Heading level={3}>{ex.title}</Heading>
                      <ComponentPreview demo={previewDemo} hasProps={false} />
                      {await highlightedTs(ex.code)}
                    </>
                  ) : (
                    await highlightedTs(ex.code, ex.title)
                  )}
                </Stack>
              );
            }),
          )}
          <ComponentWrapsLine wraps={wraps} />
        </Stack>
      </Section>

      {sections.includes("props") ? (
        <Section title={componentPageCopy.sections.props} id="props">
          <PropsTable file={propsFile!} name={propsName!} priority={propsPriority} {...(propsRest ? { rest: propsRest } : {})} />
        </Section>
      ) : null}

      {sections.includes("accessibility") ? (
        <Section title={componentPageCopy.sections.accessibility} id="accessibility">
          <Text>{inlineCode(a11y)}</Text>
        </Section>
      ) : null}

      {sections.includes("related") ? (
        <Section title={componentPageCopy.sections.related} id="related">
          <Stack gap={2}>
            {related.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary underline underline-offset-4 hover:no-underline">
                {link.title}
              </Link>
            ))}
          </Stack>
        </Section>
      ) : null}

      {sections.includes("troubleshooting") ? (
        <Section title={componentPageCopy.sections.troubleshooting} id="troubleshooting">
          <Text>{troubleshooting}</Text>
        </Section>
      ) : null}
    </Stack>
  );
}
