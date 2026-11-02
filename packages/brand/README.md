# @zedtech/zedkit-brand

The zedkit Z-wave mark and wordmark as plain SVG files, a small string
builder, and a React component. Light and dark variants, plus the sources
for a favicon, an apple-touch icon and a social card. Original work by the
same author.

Additive and standalone: it has no dependency on the UI kit, its tokens or
its components. React is an optional peer, needed only for `/react`.

## Install

```sh
pnpm add @zedtech/zedkit-brand
```

## Use

### React

```tsx
import { ZedkitLogo } from "@zedtech/zedkit-brand/react";

// Follows the text colour (`currentColor`): light, dark and any theme restyle it.
<ZedkitLogo variant="lockup" height={32} className="text-foreground" />;

// The name is written next to it: hide it from screen readers.
<ZedkitLogo variant="mark" title="" />;
```

`variant` is `mark`, `wordmark` or `lockup` (the default). The default
`height` is `1.5em`; the width follows the aspect ratio.

### Any other code

```ts
import { logoAsset, logoSvg } from "@zedtech/zedkit-brand";

logoSvg({ variant: "mark", theme: "on-dark" }); // standalone SVG string
logoAsset("og"); // { svg, width: 1200, height: 630 }
```

`theme` is `on-light` (dark ink for light surfaces), `on-dark` (paper for dark
surfaces), `current` (the default) or `auto`. `auto` switches with
`prefers-color-scheme` through a scoped `<style>`; use it for standalone files
such as a favicon, not for inline markup.

### SVG files

```ts
import lockup from "@zedtech/zedkit-brand/assets/lockup-on-dark.svg";
```

| File | Use |
|---|---|
| `mark-on-light.svg`, `mark-on-dark.svg` | The Z-wave mark |
| `wordmark-on-light.svg`, `wordmark-on-dark.svg` | The name, outlined (no font needed) |
| `lockup-on-light.svg`, `lockup-on-dark.svg` | Mark and name side by side |
| `favicon.svg` | Transparent, follows the browser colour scheme |
| `apple-touch.svg` | 180 x 180, opaque, rasterise to PNG |
| `og.svg` | 1200 x 630, opaque, rasterise to PNG; add your title on top |

The files are generated from the same data as the string builder and the
React component, and a test fails when they drift.
Rasterised outputs (`.png`, `.ico`) are not committed: render them from the
SVG in your build or image route.

### Another renderer

```ts
import { logoGeometry } from "@zedtech/zedkit-brand";

const { viewBox, shapes } = logoGeometry("lockup"); // paths, stroke widths, transforms
```

## Colours

`BRAND_INK` is `#0f1a2b`, `BRAND_PAPER` is `#f5f2ed`.

## Maintaining

Edit `src/geometry.ts`, then refresh the files with
`UPDATE_ASSETS=1 pnpm --filter @zedtech/zedkit-brand test`.

The letters of the wordmark are outlined from Inter SemiBold, which is
licensed under the SIL Open Font License 1.1.
