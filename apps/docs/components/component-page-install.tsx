import Link from "next/link";
import { highlight } from "fumadocs-core/highlight";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Stack, Tabs as KitTabs, TabsContent, TabsList, TabsTrigger, Text } from "@zedtech/zedkit-ui";
import { symbolsFromImport } from "../lib/import-symbols";
import { dlxRunner, packageManagers, type PackageManager } from "../lib/package-manager-commands";
import { registryShadcnAddCommand } from "../lib/registry-shadcn-command";
import { RegistryBrickInlineName } from "./registry-brick-name";
import { componentPageCopy } from "@/components/i18n/component-page-copy";

export async function highlightedTs(code: string, title?: string) {
  const highlighted = await highlight(code, { lang: "tsx", components: { pre: Pre } });
  return (
    <CodeBlock
      {...(title ? { title } : {})}
      allowCopy
    >
      {highlighted}
    </CodeBlock>
  );
}

/** One highlighted command per package manager, pnpm first. */
export async function packageManagerTabs(command: (pm: PackageManager) => string) {
  return (
    <KitTabs defaultValue={packageManagers[0]} className="flex min-w-0 flex-col gap-2">
      <TabsList className="h-auto w-fit gap-1 rounded-none bg-transparent p-0">
        {packageManagers.map((pm) => (
          <TabsTrigger
            key={pm}
            value={pm}
            className="h-8 rounded-md px-3 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {pm}
          </TabsTrigger>
        ))}
      </TabsList>
      {await Promise.all(
        packageManagers.map(async (pm) => (
          <TabsContent key={pm} value={pm} className="mt-0">
            {await highlightedTs(command(pm))}
          </TabsContent>
        )),
      )}
    </KitTabs>
  );
}

export function importSnippet(importLine: string): string {
  const symbols = symbolsFromImport(importLine);
  const pkg = importLine.match(/`([^`]+)`/)?.[1] ?? "@zedtech/zedkit-ui";
  const types = symbols.filter((name) => name.endsWith("Props"));
  const values = symbols.filter((name) => !name.endsWith("Props"));
  return [
    values.length > 0 ? `import { ${values.join(", ")} } from "${pkg}";` : "",
    types.length > 0 ? `import type { ${types.join(", ")} } from "${pkg}";` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function registryImportSnippet(importLine: string, registry: string): string {
  const name = symbolsFromImport(importLine).find((symbol) => !symbol.endsWith("Props") && !symbol.endsWith("Variants"));
  return `import { ${name ?? "Button"} } from "@/components/ui/${registry}";`;
}

const ADOPTION_TRIGGER_CLASS =
  "h-9 rounded-md px-3 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function adoptionTabsList(tabs: readonly { value: string; label: string }[]) {
  return (
    <TabsList className="h-auto w-fit flex-wrap gap-1 rounded-none bg-transparent p-0">
      {tabs.map(({ value, label }) => (
        <TabsTrigger key={value} value={value} className={ADOPTION_TRIGGER_CLASS}>
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

/** "Registry copy": add it with the shadcn CLI (a command per package manager), or paste the file by hand. */
export async function registryCopyTabs({
  site,
  registry,
  importLine,
  source,
}: {
  site: string;
  registry: string;
  importLine: string;
  source: string;
}) {
  return (
    <KitTabs defaultValue="cli" className="flex flex-col gap-3">
      {adoptionTabsList(componentPageCopy.registryTabs)}
      <TabsContent value="cli" className="mt-0">
        <Stack gap={3}>
          <Text variant="muted" className="text-sm">
            {componentPageCopy.cliLead}
          </Text>
          {await packageManagerTabs((pm) => registryShadcnAddCommand(site, registry, dlxRunner(pm)))}
          {await highlightedTs(registryImportSnippet(importLine, registry))}
          <Text variant="muted" className="text-sm">
            {componentPageCopy.registryContinuation}{" "}
            <Link href="/docs/zedkit-and-shadcn" className="text-primary underline underline-offset-4 hover:no-underline">
              {componentPageCopy.registryContinuationLink}
            </Link>
          </Text>
        </Stack>
      </TabsContent>
      <TabsContent value="manual" className="mt-0">
        <Stack gap={3}>
          <Text variant="muted" className="text-sm">
            {componentPageCopy.sourceLead}
          </Text>
          <RegistryBrickInlineName name={registry} />
          {await highlightedTs(source, `components/ui/${registry}.tsx`)}
          {await highlightedTs(registryImportSnippet(importLine, registry))}
        </Stack>
      </TabsContent>
    </KitTabs>
  );
}
