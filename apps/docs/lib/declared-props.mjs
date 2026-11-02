import { createGenerator } from "fumadocs-typescript";

/** One generator (one TypeScript program) per tsconfig; the default is the one in the working directory. */
const generators = new Map();
function generatorFor(tsconfigPath) {
  if (!generators.has(tsconfigPath)) generators.set(tsconfigPath, createGenerator(tsconfigPath ? { tsconfigPath } : undefined));
  return generators.get(tsconfigPath);
}

/** Typings that describe what a DOM element accepts: React's element attributes and the TS DOM lib. */
const ELEMENT_ATTRIBUTE_TYPINGS = /[\\/](?:@types[\\/]react(?:-dom)?|typescript[\\/]lib)[\\/]/;

/**
 * Who owns a property, from the files that declare it. A property is inherited
 * only when every declaration describes a DOM element (React's element
 * attributes, the TS DOM lib). Anything else is the component's own option:
 * declared in the kit, or by the library the kit wraps (a Radix `value`, a
 * react-hook-form `render`), which readers need as much as the kit's own.
 *
 * @param {readonly string[]} declarationFiles
 * @returns {"kit" | "inherited"}
 */
export function declarationOrigin(declarationFiles) {
  return declarationFiles.some((file) => !ELEMENT_ATTRIBUTE_TYPINGS.test(file)) ? "kit" : "inherited";
}

/**
 * Reads one props type from the real kit source. Each entry carries its
 * `origin`, resolved from the property's own declarations.
 *
 * @typedef {import("fumadocs-typescript").DocEntry & { origin: "kit" | "inherited" }} DeclaredEntry
 * @typedef {Omit<import("fumadocs-typescript").GeneratedDoc, "entries"> & { entries: DeclaredEntry[] }} DeclaredDoc
 * @param {{ file: string, name: string, basePath: string, tsconfigPath?: string }} target
 * @returns {Promise<DeclaredDoc[]>}
 */
export async function readDeclaredProps({ file, name, basePath, tsconfigPath }) {
  return generatorFor(tsconfigPath).generateTypeTable(
    { path: file, name },
    {
      basePath,
      transform(entry, _type, property) {
        entry.origin = declarationOrigin((property.declarations ?? []).map((declaration) => declaration.path));
      },
    },
  );
}
