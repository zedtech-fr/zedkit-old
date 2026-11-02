# Catalog — @zedtech/zedkit-flags

- Keywords: feature-flags, openfeature, react, typescript, server
- Audience: Teams that want OpenFeature wiring with typed keys and test-friendly providers.
- Purpose: Typed flag registry, server evaluation, React hooks, JSON/env providers, and local override storage for dev.
- Attribution: Original work by the same author.

## Define a typed flag registry

- Import: `@zedtech/zedkit-flags` — `defineFlagRegistry`, `memoryProviderFromRegistry`, `createMemoryProvider`, `OpenFeature`, `TypedInMemoryProvider`, `Client`, `Provider`, `EvaluationContext`, `JsonValue`, `buildOpenFeatureFlagDefinitions`, `FlagValue`, `FlagRegistry`
- Wraps: `@openfeature/server-sdk` (peer)
- Status: beta
- Short name: defineFlagRegistry
- Audience: Server boot code and tests that need deterministic flag values.
- Purpose: Keep flag keys and default values in one object; build an in-memory OpenFeature provider from it.
- When to use: Unit tests, local APIs, or staging before a remote flag backend is wired.
- When not to use: Production flag delivery — register your vendor provider at the app root instead.

```ts
import { OpenFeature, defineFlagRegistry, memoryProviderFromRegistry } from "@zedtech/zedkit-flags";

const registry = defineFlagRegistry({ beta: false });
OpenFeature.setProvider(memoryProviderFromRegistry(registry));
```

## Evaluate flags on the server

- Import: `@zedtech/zedkit-flags` — `getFlag`, `Client`, `FlagReturnValue`
- Wraps: `@openfeature/server-sdk` (peer)
- Status: beta
- Short name: getFlag
- Audience: Handlers and jobs that branch on feature flags.
- Purpose: Read a flag with the default type taken from the registry entry.
- When to use: After `OpenFeature.setProvider` and optional context setup.
- When not to use: Browser code — use the React entry instead.

```ts
import { OpenFeature, defineFlagRegistry, getFlag, memoryProviderFromRegistry } from "@zedtech/zedkit-flags";

const registry = defineFlagRegistry({ exportCsv: true });
OpenFeature.setProvider(memoryProviderFromRegistry(registry));
const enabled = await getFlag(OpenFeature.getClient(), registry, "exportCsv");
```

## Load flag values from JSON or env

- Import: `@zedtech/zedkit-flags` — `parseFlagsJson`, `loadFlagsFromEnv`, `mergeFlagValues`, `createMemoryProvider`
- Wraps: `(none)`
- Status: beta
- Short name: loadFlagsFromEnv
- Audience: CI, preview apps, and integration tests.
- Purpose: Parse `ZEDKIT_FLAGS_JSON` or a JSON string and merge overrides onto registry defaults.
- When to use: Ephemeral environments where a remote flag service is unavailable.
- When not to use: Secrets or per-user targeting — use OpenFeature evaluation context and a real provider.

```ts
import { OpenFeature, createMemoryProvider, defineFlagRegistry, loadFlagsFromEnv, mergeFlagValues } from "@zedtech/zedkit-flags";

const registry = defineFlagRegistry({ maintenance: false });
const merged = mergeFlagValues(registry, loadFlagsFromEnv());
OpenFeature.setProvider(createMemoryProvider(merged));
```

## Override flags in the browser for local dev

- Import: `@zedtech/zedkit-flags` — `readFlagOverrides`, `writeFlagOverride`, `mergeFlagValue`, `FLAG_OVERRIDE_STORAGE_KEY`, `flagOverridesSnapshot`, `subscribeFlagOverrides`
- Wraps: `(none)`
- Status: beta
- Short name: writeFlagOverride
- Audience: Authors building internal dev panels or docs previews.
- Purpose: Persist boolean, string, or number overrides in `localStorage` and merge them after OpenFeature evaluation.
- When to use: Local-only tooling; never ship override UI to production users without auth.
- When not to use: Server-side flag evaluation.

```ts
import { mergeFlagValue, readFlagOverrides, writeFlagOverride } from "@zedtech/zedkit-flags";

const evaluated = false;
const overrides = readFlagOverrides(localStorage);
const effective = mergeFlagValue("beta", evaluated, overrides);
writeFlagOverride(localStorage, "beta", !effective);
```

## Read flags in React

- Import: `@zedtech/zedkit-flags/react` — `ZedkitFlagsProvider`, `useFlag`, `OpenFeatureProvider`, `OpenFeature`, `TypedInMemoryProvider`, `useBooleanFlagValue`, `useStringFlagValue`, `useNumberFlagValue`
- Wraps: `@openfeature/react-sdk`, `@openfeature/web-sdk` (peers)
- Status: beta
- Short name: useFlag
- Audience: Client components that gate UI on feature flags.
- Purpose: Register an in-memory provider from a registry and subscribe to local overrides via `useFlag`.
- When to use: Apps already using OpenFeature on the web; wrap a subtree that needs typed defaults.
- When not to use: Server Components — evaluate on the server and pass props.

```ts
import { defineFlagRegistry } from "@zedtech/zedkit-flags";
import { useFlag, ZedkitFlagsProvider } from "@zedtech/zedkit-flags/react";

const registry = defineFlagRegistry({ newDashboard: false });

export function FeatureGate({ children }: { children: React.ReactNode }) {
  return (
    <ZedkitFlagsProvider registry={registry}>
      <FeatureGateInner>{children}</FeatureGateInner>
    </ZedkitFlagsProvider>
  );
}

function FeatureGateInner({ children }: { children: React.ReactNode }) {
  const show = useFlag("newDashboard", false);
  return show ? children : null;
}
```
