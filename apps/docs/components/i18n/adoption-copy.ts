/** English copy for the adoption panel (home page and every component page). Keys only; no markup. */

type StepParams = { brick?: string; files?: number; packages?: string[] };
type StepCopy = { title: string; note?: string };

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export const adoptionCopy = {
  panelLabel: "How to adopt",
  modes: { package: "Install package", copy: "Copy source" },
  copyMethodLabel: "Copy method",
  copyMethods: { cli: "shadcn CLI", manual: "Paste the files" },
  packageManagerLabel: "Package manager",
  terminalTitle: "Terminal",
  importTitle: "Import",
  copyLabel: (what: string) => `Copy ${what}`,
  copied: "Copied",
  copyFailed: "Could not copy. Select the text instead.",
  youGet: "You get",
  youNeed: "You need",
  gives: {
    "package-ui":
      "Every component from one import, with the theme tokens included. Updates arrive with your package manager.",
    "package-lib": "The published package. Updates arrive with your package manager.",
    cli: "The component's source in your repo, with no dependency on the kit package. You own and edit the files.",
    manual: "The same files the CLI writes, pasted by hand. The only installs are the npm packages listed.",
  },
  requires: {
    stack: "React 19 and Tailwind CSS 4, for example a Next.js app created with the Tailwind option.",
    runtime: "Node.js 22 or newer.",
    shadcn:
      "shadcn set up in the project: init creates components.json, the base colour tokens and the cn helper (src/lib/utils.ts).",
  },
  fileAction: { replace: "Replace the contents", append: "Add to the end", create: "Create the file", merge: "Merge into your file, keeping what is there" },
  companions: (count: number) => `${count} companion ${plural(count, "file", "files")}`,
  companionsHint: "The first file imports these. Add all of them.",
  result: {
    label: "Rendered example",
    caption: "The code above, running. A kit component for illustration; it does nothing on this site.",
  },
  npmOnly: "This ships on npm only; there is no copy-source brick for it.",
  step: (id: string, params: StepParams, mode: "package" | "cli" | "manual"): StepCopy => {
    const brick = params.brick ?? "the component";
    const files = params.files ?? 0;
    const packages = params.packages ?? [];
    switch (id) {
      case "install":
        return { title: "Install" };
      case "styles":
        return {
          title: "Load the styles",
          note: "Tailwind does not scan node_modules, so the @source line points it at the kit's class names. The path is relative to this file.",
        };
      case "extend":
        return { title: "Extend the preset" };
      case "import":
        return { title: "Import" };
      case "render":
        return {
          title: "Import and render",
          ...(mode === "package" ? {} : { note: "Imports come from src/components/ui, not from the package." }),
        };
      case "init":
        return { title: "Set up shadcn", note: "Skip this if components.json already exists." };
      case "namespace":
        return {
          title: "Register the ZedKit registry",
          note: `${brick} depends on other ZedKit bricks; this lets the CLI find them.`,
        };
      case "theme":
        return { title: "Add the theme tokens" };
      case "add":
        return {
          title: `Add ${brick}`,
          note: `Writes ${files === 1 ? "one file" : `${files} files`} under src/components/ui and installs ${
            packages.length === 0 ? "no packages" : packages.join(", ")
          }.`,
        };
      case "packages":
        return { title: "Install the example's packages", note: "The example below imports them directly." };
      case "dependencies":
        return { title: "Install the packages" };
      case "tokens":
        return { title: "Add the tokens", note: "Variables, theme values and utilities the files below rely on." };
      case "files":
        return {
          title: plural(files, "Add the file", "Add the files"),
          note: "Paths follow the @/* alias that shadcn init sets up (src/ in this layout).",
        };
      default:
        throw new Error(`adoption copy: no words for step "${id}"`);
    }
  },
} as const;

export type AdoptionCopy = typeof adoptionCopy;
