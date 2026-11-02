# Catalog — @zedtech/zedkit-observability

- Keywords: logging, analytics, observability, react, typescript, ports, pino, product-analytics
- Audience: App authors who want logging and analytics behind stable ports.
- Purpose: Logger and Tracker ports with swappable adapters and React hooks — wire backends at the composition root, not inside features.
- Attribution: Original work by the same author.


## Log without importing a backend

- Import: `@zedtech/zedkit-observability` — `Logger`, `LogLevel`, `LogContext`, `noopLogger`, `createConsoleLogger`, `createMemoryLogger`, `CapturedLog`
- Wraps: `(none)`
- Status: beta
- Short name: Logger port
- Audience: TypeScript services and apps that should not import a logging SDK in feature code.
- Purpose: A small `Logger` port with noop, console, and in-memory adapters.
- When to use: Any module that needs structured logs but should stay testable.
- When not to use: When you only need one `console.log` in a throwaway script.

```ts
import { createMemoryLogger, type Logger } from "@zedtech/zedkit-observability";
const { logger, entries } = createMemoryLogger();
logger.info("ready", { port: 3000 });
```

## Track product events with a typed map

- Import: `@zedtech/zedkit-observability` — `Tracker`, `EventMap`, `createNoopTracker`, `createConsoleTracker`, `createMemoryTracker`
- Wraps: `(none)`
- Status: beta
- Short name: Tracker port
- Audience: Front-end and full-stack teams sending product analytics events.
- Purpose: Typed `capture` calls backed by noop, console, or in-memory adapters.
- When to use: Before a real analytics backend is wired, or in tests.
- When not to use: For server request metrics — use your APM stack instead.

```ts
import { createMemoryTracker } from "@zedtech/zedkit-observability";
type Events = { signup: { plan: string } };
const { tracker, captured } = createMemoryTracker<Events>();
tracker.capture("signup", { plan: "free" });
```

## Wire logger and tracker in React

- Import: `@zedtech/zedkit-observability/react` — `ObservabilityProvider`, `useLogger`, `useTracker`
- Wraps: `react`
- Status: beta
- Short name: React observability
- Audience: React apps that should read logging/analytics from context.
- Purpose: One provider at the root; hooks below stay backend-agnostic.
- When to use: Client components that emit logs or analytics events.
- When not to use: Server-only code — import the ports directly.

```ts
import { ObservabilityProvider, useLogger } from "@zedtech/zedkit-observability/react";
export function App() {
  return (
    <ObservabilityProvider>
      <Home />
    </ObservabilityProvider>
  );
}
function Home() {
  useLogger().info("mounted");
  return null;
}
```

## Ship JSON logs on Node with pino

- Import: `@zedtech/zedkit-observability/pino` — `createPinoLogger`, `PinoLoggerOptions`
- Wraps: `pino` (peer)
- Status: beta
- Short name: Pino adapter
- Audience: Node services that already run `pino` at the edge.
- Purpose: Wrap `pino` behind the shared `Logger` port.
- When to use: Production Node hosts ingesting JSON log lines.
- When not to use: Browser bundles — use the console adapter instead.

```ts
import { createPinoLogger } from "@zedtech/zedkit-observability/pino";
const logger = createPinoLogger({ name: "api" });
logger.info("listening", { port: 3000 });
```

## Forward events to a browser analytics SDK

- Import: `@zedtech/zedkit-observability/posthog` — `createProductAnalyticsTracker`, `ProductAnalyticsClient`
- Wraps: `posthog-js` (peer)
- Status: beta
- Short name: Analytics adapter
- Audience: Teams using a browser product-analytics SDK at the composition root.
- Purpose: Map the `Tracker` port onto an SDK client (for example `posthog-js`).
- When to use: After consent allows analytics in the browser.
- When not to use: Server-side event pipelines — send from your API instead.

```ts
import { createProductAnalyticsTracker } from "@zedtech/zedkit-observability/posthog";
const tracker = createProductAnalyticsTracker(client);
tracker.capture("page_view", { path: "/home" });
```

## Persist analytics consent choices

- Import: `@zedtech/zedkit-observability/consent` — `ConsentStore`, `ConsentRecord`, `ConsentCategory`, `createMemoryConsentStore`, `createLocalStorageConsentStore`, `isCategoryGranted`, `CONSENT_CATEGORIES`
- Wraps: `(none)`
- Status: beta
- Short name: Consent store
- Audience: Public sites that must record analytics/marketing opt-in before loading tags.
- Purpose: Small consent store with memory and localStorage backends.
- When to use: Before gating trackers or third-party scripts.
- When not to use: Logged-in admin apps with no public marketing tags.

```ts
import { createMemoryConsentStore } from "@zedtech/zedkit-observability/consent";
const store = createMemoryConsentStore();
store.write({ analytics: true, marketing: false });
```

## Gate trackers and script loaders on consent

- Import: `@zedtech/zedkit-observability/consent` — `createConsentGatedTracker`, `runConsentGatedLoader`
- Wraps: `(none)`
- Status: beta
- Short name: Gated tracker
- Audience: Teams wiring the Tracker port behind analytics consent.
- Purpose: Drop captures until a category is granted; run loaders when consent turns on.
- When to use: With `createProductAnalyticsTracker` or any custom script loader.
- When not to use: Strictly necessary cookies (no gate needed).

```ts
import { createConsentGatedTracker } from "@zedtech/zedkit-observability/consent";
const gated = createConsentGatedTracker(tracker, store, "analytics");
```

## Consent UI in React

- Import: `@zedtech/zedkit-observability/consent/react` — `ConsentProvider`, `ConsentGate`, `ConsentBanner`, `useConsentCategory`, `useConsentGatedLoader`
- Wraps: `@zedtech/zedkit-ui` (Dialog, Switch)
- Status: beta
- Short name: Consent UI
- Audience: React apps showing a first-visit banner and gating children.
- Purpose: Provider, category gate, banner, and hook to defer analytics loaders.
- When to use: Public marketing sites using the observability tracker port.
- When not to use: Server components (use the store on the client only).

```ts
import { ConsentBanner, ConsentProvider } from "@zedtech/zedkit-observability/consent/react";
import { createMemoryConsentStore } from "@zedtech/zedkit-observability/consent";
const store = createMemoryConsentStore();
```
