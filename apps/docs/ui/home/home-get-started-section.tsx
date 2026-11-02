import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Section } from "@zedtech/zedkit-ui";

import { featuredRegistryBrick } from "@/content/registry-site";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { registryShadcnAddCommand } from "@/lib/registry-shadcn-command";
import { HomeGetStartedCopy } from "@/ui/home/home-get-started-copy";
import { HOME_MARKETING_ROOT_PROPS, HOME_SECTION_REVEAL_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const SNIPPETS_DIR = join(process.cwd(), "home-quickstart", "snippets");

export function loadHomeInitCommand() {
  const initCommand = readFileSync(join(SNIPPETS_DIR, "ai-init.sh"), "utf8").trim();
  if (initCommand !== "npx @zedtech/zedkit-ai init") {
    throw new Error("home-quickstart/snippets/ai-init.sh must be exactly: npx @zedtech/zedkit-ai init");
  }
  return initCommand;
}

function loadSnippet(name: string) {
  return readFileSync(join(SNIPPETS_DIR, name), "utf8").trim();
}

export function HomeGetStartedSection({ npmPackage }: { npmPackage: string }) {
  const packageInstallCmd = loadSnippet("install.sh");
  const expectedInstall = `pnpm add ${npmPackage}`;
  if (packageInstallCmd !== expectedInstall) {
    throw new Error(`home-quickstart/snippets/install.sh must be exactly: ${expectedInstall}`);
  }
  const registryAddCmd = loadSnippet("registry-add.sh");
  const expectedRegistry = registryShadcnAddCommand(PUBLIC_SITE_URL, featuredRegistryBrick);
  if (registryAddCmd !== expectedRegistry) {
    throw new Error(
      `home-quickstart/snippets/registry-add.sh must be exactly: ${expectedRegistry}`,
    );
  }
  const registryThemeAddCmd = loadSnippet("registry-theme-add.sh");
  const expectedTheme = registryShadcnAddCommand(PUBLIC_SITE_URL, "theme");
  if (registryThemeAddCmd !== expectedTheme) {
    throw new Error(
      `home-quickstart/snippets/registry-theme-add.sh must be exactly: ${expectedTheme}`,
    );
  }
  // The file `shadcn add` writes, shown as-is on the "Copy source" path.
  const brickSource = readFileSync(
    join(process.cwd(), "..", "..", "registry", "ui", `${featuredRegistryBrick}.tsx`),
    "utf8",
  ).trimEnd();

  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="get-started"
      title={homeCopy.getStarted.section.title}
      description={homeCopy.getStarted.section.description}
      className={HOME_SECTION_REVEAL_CLASS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <HomeGetStartedCopy packageName={npmPackage} brick={featuredRegistryBrick} source={brickSource} />
    </Section>
  );
}
