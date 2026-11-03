# @zedtech/zedkit-live

Framework-free live data sources for the browser and Node 22+: one small `LiveSource` interface, a `pollingSource`, and a `wsSource` that reconnects and can fall back to polling while the socket is down. No React, no DOM beyond the global `WebSocket` (overridable).

See [CATALOG.md](./CATALOG.md) for exports and examples.

## Install

```sh
pnpm add @zedtech/zedkit-live
```

## Use

```ts
import { pollingSource, wsSource } from "@zedtech/zedkit-live";

const source = wsSource<{ id: string }>({
  url: "wss://example.com/live",
  fallback: pollingSource({ intervalMs: 10_000, poll: () => fetchLatest() }),
});

const stop = source.subscribe((message) => refresh(message));
source.onStatus((status) => console.log(status)); // connecting | live | retrying | idle
stop();
```

A source starts on its first subscriber and stops on its last unsubscribe. `getStatus` plus `onStatus` fit `useSyncExternalStore` or any store:

```ts
const status = useSyncExternalStore(source.onStatus, source.getStatus, () => "idle");
```

## Behavior to know

- Messages missed while the socket was down are not replayed. Make the fallback fetch current state.
- Status only moves while at least one message listener is subscribed; subscribing to status alone starts nothing.
- `status` describes the primary transport: `retrying` stays while a fallback delivers messages.
- A throwing listener does not affect other listeners; errors go to `onError`.

## Original work

Original work by the same author.
