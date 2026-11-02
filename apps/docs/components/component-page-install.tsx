import Link from "next/link";
import type { ReactNode } from "react";
import { highlight } from "fumadocs-core/highlight";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Stack, TabsList, TabsTrigger, Text } from "@zedtech/zedkit-ui";
import { symbolsFromImport } from "../lib/import-symbols";
import { dlxRunner, packageManagers, type PackageManager } from "../lib/package-manager-commands";
import { registryShadcnAddCommand } from "../lib/registry-shadcn-command";
import { CopyMethodPanels, PackageCommandBlock } from "./adoption-client";
import { RegistryBrickInlineName } from "./registry-brick-name";
import { componentPageCopy } from "@/components/i18n/component-page-copy";

const { adoption } = componentPageCopy;

interface CodeOptions {
  lang?: "tsx" | "bash";
  /** Header of the block; the copy button sits beside it. */
  title?: ReactNode;
  /** Accessible name of the scroll area when the title is not plain text. */
  label?: string;
  /** Scroll area height cap (a whole source file). */
  tall?: boolean;
}

function highlighted(code: string, lang: "tsx" | "bash") {
  return highlight(code, { lang, components: { pre: Pre } });
}

async function highlightedCode(code: string, { lang = "tsx", title, label, tall = false }: CodeOptions = {}) {
  const name = label ?? (typeof title === "string" ? title : undefined);
  return (
    <CodeBlock
      {...(title ? { title } : {})}
      viewportProps={{ ...(name ? { "aria-label": name } : {}), ...(tall ? { className: "max-h-96" } : {}) }}
      allowCopy
    >
      {await highlighted(code, lang)}
    </CodeBlock>
  );
}

export function highlightedTs(code: string, title?: string) {
  return highlightedCode(code, title ? { title } : {});
}

/** A terminal command per package manager: pnpm first, switched by a select in the block header. */
async function packageCommand(command: (pm: PackageManager) => string) {
  const variants = Object.fromEntries(
    await Promise.all(packageManagers.map(async (pm) => [pm, await highlighted(command(pm), "bash")] as const)),
  ) as Record<PackageManager, ReactNode>;
  return <PackageCommandBlock title={adoption.terminalTitle} variants={variants} />;
}

/** Two sections that belong together (command or file, then import) share one frame and its border. */
function codeFrame(first: ReactNode, second: ReactNode) {
  return (
    <Stack gap={1} className="gap-0" data-code-frame="">
      {first}
      {second}
    </Stack>
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

/** "Install": the package command, then the import, in one frame. */
export async function packageInstallFrame({
  command,
  importLine,
}: {
  command: (pm: PackageManager) => string;
  importLine: string;
}) {
  return codeFrame(
    await packageCommand(command),
    await highlightedCode(importSnippet(importLine), { title: adoption.importTitle }),
  );
}

/** Quiet underline tabs: two peers, so no box, no raised segment. Secondary choices are selects. */
const ADOPTION_TRIGGER_CLASS =
  "h-auto! min-h-control-height flex-none rounded-none border-b-2 border-transparent bg-transparent px-3 py-0 text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function adoptionTabsList(tabs: readonly { value: string; label: string }[]) {
  return (
    <TabsList className="h-auto! w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
      {tabs.map(({ value, label }) => (
        <TabsTrigger key={value} value={value} className={ADOPTION_TRIGGER_CLASS}>
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

/** "Copy": add the brick with the shadcn CLI (a command per package manager), or paste the file by hand. */
export async function registryCopyPanels({
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
  const importTitle = { title: adoption.importTitle };
  const localImport = registryImportSnippet(importLine, registry);
  const cli = (
    <Stack gap={4}>
      <Text variant="muted" className="text-sm">
        {componentPageCopy.cliLead}
      </Text>
      {codeFrame(
        await packageCommand((pm) => registryShadcnAddCommand(site, registry, dlxRunner(pm))),
        await highlightedCode(localImport, importTitle),
      )}
      <Text variant="muted" className="text-sm">
        {componentPageCopy.registryContinuation}{" "}
        <Link href="/docs/zedkit-and-shadcn" className="text-primary underline underline-offset-4 hover:no-underline">
          {componentPageCopy.registryContinuationLink}
        </Link>
      </Text>
    </Stack>
  );
  const manual = (
    <Stack gap={4}>
      <Text variant="muted" className="text-sm">
        {componentPageCopy.sourceLead}
      </Text>
      {codeFrame(
        await highlightedCode(source, {
          title: (
            <Text as="span" className="font-mono">
              components/ui/
              <RegistryBrickInlineName name={registry} />
              .tsx
            </Text>
          ),
          label: `components/ui/${registry}.tsx`,
          tall: true,
        }),
        await highlightedCode(localImport, importTitle),
      )}
    </Stack>
  );
  return <CopyMethodPanels cli={cli} manual={manual} />;
}
