# Catalog — @zedtech/zedkit-brand

- Keywords: brand, logo, svg, favicon, open-graph, react, typescript
- Audience: Teams that show the zedkit mark or wordmark in an app, a site or a document and want one source for it.
- Purpose: The zedkit Z-wave mark and wordmark as SVG assets, a string builder and a React component.
- Attribution: Original work by the same author.

## Show the logo in a React app

- Import: `@zedtech/zedkit-brand/react` — `ZedkitLogo`, `ZedkitLogoProps`
- Wraps: `react`
- Status: alpha
- Short name: ZedkitLogo
- Audience: React apps that put the mark, the wordmark or both in a header, a footer or a sign-in page.
- Purpose: Render the logo as an inline SVG that follows the text colour, so light and dark need no second asset.
- When to use: Any React surface that shows the zedkit brand.
- When not to use: Your own brand mark — draw it with your own SVG; `@zedtech/zedkit-ui` has `BrandLogo` for that.
- See also: `Get the logo as SVG markup, icon sources or raw shapes`

```ts
import { ZedkitLogo } from "@zedtech/zedkit-brand/react";

const header = <ZedkitLogo variant="lockup" height={32} />;
```

## Get the logo as SVG markup, icon sources or raw shapes

- Import: `@zedtech/zedkit-brand` — `logoSvg`, `LogoSvgOptions`, `LogoTheme`, `LogoVariant`, `logoAsset`, `LogoAsset`, `LogoAssetKind`, `logoGeometry`, `LogoGeometry`, `LogoShape`, `BRAND_INK`, `BRAND_PAPER`, `BRAND_NAME`
- Wraps: `(none)`
- Status: alpha
- Short name: logoSvg
- Audience: Servers, build scripts, icon and Open Graph routes, and renderers other than React.
- Purpose: Build a standalone SVG of the mark, wordmark or lockup on light, on dark or in the current colour; get the favicon, apple-touch and 1200x630 social card sources with their pixel size; or read the raw shapes and brand colours to paint them in Vue, canvas or a PDF.
- When to use: Route handlers, emails, static files, image pipelines, and any non-React renderer.
- When not to use: React markup — use `ZedkitLogo`, which draws the same shapes without a string round trip. A social card with a title or tagline — render those on top of the returned SVG in your own image route.
- See also: `Show the logo in a React app`

```ts
import { logoAsset, logoSvg } from "@zedtech/zedkit-brand";

const mark = logoSvg({ variant: "mark", theme: "on-dark" });
const { svg, width, height } = logoAsset("apple-touch"); // 180 x 180
```

## Use the ready-made SVG files

- Import: `@zedtech/zedkit-brand/assets/lockup-on-dark.svg` — `default`
- Wraps: `(none)`
- Status: alpha
- Short name: SVG files
- Audience: Anyone who wants a file path: a bundler import, an `<img>`, a design tool, a copy step.
- Purpose: Ship the logos as plain SVG files: mark, wordmark and lockup, each on light and on dark, plus favicon, apple-touch and og.
- When to use: Static sites, documents, and anywhere an `<img src>` is enough.
- When not to use: When the logo must follow the text colour — use `ZedkitLogo` or `logoSvg` with `theme: "current"`.
- See also: `Get the logo as SVG markup, icon sources or raw shapes`

```ts
// Files in `@zedtech/zedkit-brand/assets/*`: mark | wordmark | lockup, each -on-light.svg or -on-dark.svg, plus favicon, apple-touch, og.
import lockupUrl from "@zedtech/zedkit-brand/assets/lockup-on-dark.svg";
```
