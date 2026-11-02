# Catalog — @zedtech/zedkit-devtools

- Keywords: devtools, development, react, typescript, debug
- Audience: App authors who want a consistent local-only debug drawer.
- Purpose: Dev-only drawer for identity, flag overrides, locale switching, build info, and a query devtools slot.
- Attribution: Original work by the same author.

## Gate devtools on environment

- Import: `@zedtech/zedkit-devtools` — `devtoolsEnabled`, `DevtoolsEnabledOptions`
- Wraps: `(none)`
- Status: beta
- Short name: devtoolsEnabled
- Audience: App roots that should tree-shake the panel out of production bundles.
- Purpose: Return false when `NODE_ENV` is `production` unless `force` is set for demos.
- When to use: Before rendering `@zedtech/zedkit-devtools/react`.
- When not to use: Production user-facing features — never expose `force` to end users.

```ts
import { devtoolsEnabled } from "@zedtech/zedkit-devtools";

if (devtoolsEnabled()) {
  // mount devtools in development
}
```

## Mount a dev-only developer tools panel

- Import: `@zedtech/zedkit-devtools/react` — `ZedkitDevtools`, `ZedkitDevtoolsPanel`, `DevtoolsBuildInfoRow`, `DevtoolsLocaleOption`
- Wraps: `@zedtech/zedkit-ui`, `@zedtech/zedkit-flags` (peers)
- Status: beta
- Short name: ZedkitDevtools
- Audience: Local development and preview environments wrapped in `ZedkitUiProvider`.
- Purpose: Floating drawer with Look (identity), Flags, Locale, Info, and optional query slot tabs.
- When to use: After providers are mounted; pass `flagKeys`, `buildInfo`, and locale handlers from the app root.
- When not to use: Production builds — rely on `devtoolsEnabled()` or omit the import entirely.

```ts
import { ZedkitDevtools } from "@zedtech/zedkit-devtools/react";

<ZedkitDevtools
  flagKeys={["betaUi"]}
  buildInfo={[{ label: "Git", value: "abc123" }]}
  localeOptions={[{ id: "en", label: "English" }]}
  activeLocale="en"
  onLocaleChange={(id) => console.log(id)}
/>;
```
