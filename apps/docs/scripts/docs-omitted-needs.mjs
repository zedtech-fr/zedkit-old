/** Catalog needs kept in package CATALOG but not published as docs site pages (demo-only). */
export const DOCS_OMITTED_NEED_TITLES = [
  "Design your identity",
  "Switch the visual identity with one attribute",
];

export const IDENTITY_EDITOR_HREF = "/features/identity-editor";

export const DOCS_OMITTED_REDIRECTS = {
  "/docs/ui/design-your-identity": IDENTITY_EDITOR_HREF,
  "/docs/ui/switch-the-visual-identity-with-one-attribute": "/",
};

export function docsOmitNeed(title) {
  return DOCS_OMITTED_NEED_TITLES.includes(title);
}

export function hrefForOmittedNeed(title) {
  if (title === "Design your identity") return IDENTITY_EDITOR_HREF;
  if (title === "Switch the visual identity with one attribute") return "/#demo";
  return null;
}

export function countCatalogNeeds(catalog) {
  return Object.values(catalog.packages).reduce((n, entry) => n + entry.needs.length, 0);
}

export function countPublishedCatalogNeeds(catalog) {
  let n = 0;
  for (const entry of Object.values(catalog.packages)) {
    for (const need of entry.needs) {
      if (!docsOmitNeed(need.need)) n += 1;
    }
  }
  return n;
}
