import { tokensToCss, type IdentityTokens } from "@zedtech/zedkit-ui";

/** `:root` CSS string shared by the editor export field and dock copy (parity: identity-export-preview-parity). */
export function identityExportCss(tokens: IdentityTokens): string {
  return tokensToCss(tokens, ":root");
}

export const IDENTITY_UI_INSTALL_COMMAND = "pnpm add @zedtech/zedkit-ui";

/**
 * Kit stylesheet lines a fresh consumer adds to `globals.css` above the
 * exported tokens: the same kit lines the quickstart stylesheet carries
 * (pinned against the adoption builder by identity-export.test.mjs).
 */
export const IDENTITY_KIT_STYLES_CSS =
  '@import "@zedtech/zedkit-ui/styles.css";\n@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";\n';

/** Fontsource families the docs site loads (app/fonts.ts, app/fonts-identity.ts): stack marker to package. */
const IDENTITY_FONT_PACKAGES: ReadonlyArray<readonly [marker: string, pkg: string]> = [
  ['"Inter Variable"', "@fontsource-variable/inter"],
  ['"Geist Variable"', "@fontsource-variable/geist"],
  ['"Jost Variable"', "@fontsource-variable/jost"],
  ['"Space Grotesk Variable"', "@fontsource-variable/space-grotesk"],
  ['"Newsreader Variable"', "@fontsource-variable/newsreader"],
  ['"Cormorant Variable"', "@fontsource-variable/cormorant"],
];

export type IdentityExportFonts = { packages: string[]; imports: string };

/**
 * Font loading for an accepted identity, derived from its stacks: the
 * fontsource packages to install plus their side-effect imports, in
 * first-appearance order across the sans then display stack. Null when
 * neither stack names a docs-site family (system stacks travel with the CSS).
 */
export function identityExportFonts(tokens: IdentityTokens): IdentityExportFonts | null {
  const seen = new Set<string>();
  for (const stack of [tokens.fontSans, tokens.fontDisplay]) {
    for (const [marker, pkg] of IDENTITY_FONT_PACKAGES) {
      if (stack.includes(marker)) seen.add(pkg);
    }
  }
  if (seen.size === 0) return null;
  const packages = [...seen];
  return { packages, imports: packages.map((pkg) => `import "${pkg}";`).join("\n") };
}

/** Install command carrying the kit plus the identity's font packages. */
export function identityExportInstall(tokens: IdentityTokens): string {
  const fonts = identityExportFonts(tokens);
  return fonts === null ? IDENTITY_UI_INSTALL_COMMAND : `${IDENTITY_UI_INSTALL_COMMAND} ${fonts.packages.join(" ")}`;
}
