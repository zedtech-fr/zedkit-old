# Catalog — @zedtech/zedkit-seo

- Keywords: seo, sitemap, robots-txt, json-ld, structured-data, metadata, open-graph, hreflang, llms-txt, slug, nextjs, typescript
- Audience: Developers who want correct SEO primitives without becoming SEO experts.
- Purpose: Ship sitemaps, robots, typed JSON-LD, metadata, hreflang, slugs and llms.txt without thinking about the specs.


## Serve robots.txt content

- Import: `@zedtech/zedkit-seo` — `buildRobots`, `BuildRobotsOptions`, `RobotsConfig`
- Wraps: `(none)`
- Status: stable
- Short name: robots.txt
- Audience: Developers who want a correct robots.txt without memorizing the syntax.
- Purpose: Build robots.txt content (allows, disallows, sitemap links) from typed options.
- When to use: For every public site, served from `/robots.txt`.
- When not to use: For access control — robots.txt is advisory; gate private content with auth instead.
- See also: `List localized pages in a sitemap`

```ts
import { buildRobots } from "@zedtech/zedkit-seo";
export function robots() {
  return buildRobots({ siteUrl, extraSitemaps: [`${siteUrl}/video-sitemap.xml`] });
}
```

## List localized pages in a sitemap

- Import: `@zedtech/zedkit-seo` — `buildSitemapEntries`, `BuildSitemapOptions`, `SitemapEntry`, `SitemapPage`
- Wraps: `(none)`
- Status: stable
- Short name: Sitemap
- Audience: Developers shipping multi-locale sites that search engines should crawl fully.
- Purpose: Build sitemap entries with hreflang alternates from a page list.
- When to use: For every locale of every public page, regenerated on content change.
- When not to use: For pages behind auth — keep them out of the sitemap entirely.
- See also: `Serve robots.txt content`, `Serve a Google video sitemap`

```ts
import { buildSitemapEntries } from "@zedtech/zedkit-seo";
const pages = docs.map((d) => ({ path: `/${d.slug}`, lastModified: d.updatedAt }));
return buildSitemapEntries({ siteUrl, locales: ["en", "fr"], pages });
```

## Serve a Google video sitemap

- Import: `@zedtech/zedkit-seo` — `buildVideoSitemap`, `BuildVideoSitemapOptions`, `VideoSitemapEntry`, `escapeXml`
- Wraps: `(none)`
- Status: stable
- Short name: Video sitemap
- Audience: Sites embedding video that should appear in Google video search.
- Purpose: Build a Google video sitemap (page, thumbnail, title, description) from typed entries.
- When to use: When video pages should be discoverable via video search.
- When not to use: For plain pages — use the regular sitemap instead.
- See also: `List localized pages in a sitemap`

```ts
import { buildVideoSitemap } from "@zedtech/zedkit-seo";
const xml = buildVideoSitemap({ videos: [{ pageUrl, thumbnailUrl, title, description }] });
return new Response(xml, { headers: { "Content-Type": "application/xml" } });
```

## Emit typed JSON-LD structured data

- Import: `@zedtech/zedkit-seo` — `buildOrganizationJsonLd`, `buildWebPageJsonLd`, `buildBreadcrumbJsonLd`, `buildArticleJsonLd`, `OrganizationJsonLdOptions`, `WebPageJsonLdOptions`, `BreadcrumbItem`, `ArticleJsonLdOptions`
- Wraps: `schema-dts`
- Status: stable
- Short name: JSON-LD
- Audience: Developers who want rich results without hand-writing schema.org JSON.
- Purpose: Typed builders for Organization, WebPage, Breadcrumb and Article JSON-LD.
- When to use: On pages eligible for rich results (articles, org pages, breadcrumbs).
- When not to use: For data with no matching schema.org type — skip structured data instead of forcing it.
- See also: `Build localized page metadata`

```ts
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@zedtech/zedkit-seo";
const jsonLd = buildArticleJsonLd({ title, description, url, datePublished });
<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
```

## Build localized page metadata

- Import: `@zedtech/zedkit-seo` — `buildPageMetadata`, `BuildPageMetadataOptions`, `SiteMetadata`, `PageContent`, `PageMetadata`, `OpenGraphImage`
- Wraps: `(none)`
- Status: stable
- Short name: Page metadata
- Audience: Developers wiring titles, descriptions and OG tags across locales.
- Purpose: Build complete localized page metadata (title, description, canonical, OG) from site + page data.
- When to use: For every public page render, with the request locale.
- When not to use: For CMS-managed per-field validation — validate at edit time instead.
- See also: `Emit typed JSON-LD structured data`, `Derive descriptions, slugs, and localized fields`

```ts
import { buildPageMetadata } from "@zedtech/zedkit-seo";
return buildPageMetadata({ site, page, locale, pathname, ogImage });
```

## Serve llms.txt for AI agents

- Import: `@zedtech/zedkit-seo` — `llmsTextResponse`, `LlmsTextResponseOptions`, `normalizeLlmsBody`, `buildLlmsFull`, `LlmsFullSection`
- Wraps: `(none)`
- Status: stable
- Short name: llms.txt
- Audience: Sites that want AI agents and assistants to understand their content.
- Purpose: Serve a valid llms.txt (full or scoped) from stored settings.
- When to use: For documentation and marketing sites consumed by AI tools.
- When not to use: For private content — keep it out of llms.txt like out of the sitemap.
- See also: `Serve robots.txt content`

```ts
import { llmsTextResponse } from "@zedtech/zedkit-seo";
export async function GET() {
  const settings = await loadSettings();
  return llmsTextResponse({ body: settings.llmsTxt ?? "" });
}
```

## Derive descriptions, slugs, and localized fields

- Import: `@zedtech/zedkit-seo` — `truncateDescription`, `SEO_DESCRIPTION_MAX`, `resolveDescription`, `DescriptionSource`, `resolveLocalizedField`, `LocalizedField`, `normalizeSlug`, `isDraftSlug`
- Wraps: `(none)`
- Status: stable
- Short name: Slugs & descriptions
- Audience: Developers normalizing CMS or user content for URLs and meta tags.
- Purpose: Resolve descriptions with fallback, normalize slugs, and pick localized field values.
- When to use: At render time, when content may be missing, over-long, or untranslated.
- When not to use: For validating editor input — validate at edit time instead of fixing at render.
- See also: `Build localized page metadata`, `Validate editor-entered title/description lengths`

```ts
import { normalizeSlug, resolveDescription } from "@zedtech/zedkit-seo";
const slug = normalizeSlug(title);
const description = resolveDescription({ custom: seo.metaDescription, bodyText, title });
```
