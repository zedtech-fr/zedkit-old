# Catalog — @zedtech/zedkit-live

- Keywords: realtime, websocket, polling, reconnect, typescript, browser
- Audience: Apps that refresh data when something changes on a server, in any framework or none.
- Purpose: A small LiveSource interface plus polling and WebSocket implementations with reconnect and polling backup, with no framework code.
- Attribution: Original work by the same author.

## Share one live feed between subscribers

- Import: `@zedtech/zedkit-live` — `createLiveSource`, `LiveSource`, `LiveStatus`, `LiveListener`, `LiveHost`, `CreateLiveSourceOptions`
- Wraps: `(none)`
- Status: alpha
- Short name: LiveSource
- Audience: Authors of a custom transport (SSE, a vendor channel) and code that consumes any source.
- Purpose: Start the transport on the first subscriber, stop it on the last, expose status, and isolate listener errors.
- When to use: Wrapping a transport that is not polling or WebSocket, or typing a function that takes any live source.
- When not to use: One-shot fetches; call the endpoint directly.

```ts
import { createLiveSource } from "@zedtech/zedkit-live";

const ticks = createLiveSource<number>((host) => {
  host.setStatus("live");
  const id = setInterval(() => host.emit(Date.now()), 1000);
  return () => clearInterval(id);
});
const stop = ticks.subscribe((t) => console.log(t));
```

## Poll an endpoint as a live source

- Import: `@zedtech/zedkit-live` — `pollingSource`, `PollingSourceOptions`
- Wraps: `(none)`
- Status: alpha
- Short name: pollingSource
- Audience: Apps whose backend has no push channel, or that need a backup for one.
- Purpose: Poll on an interval without overlap, back off on failure, abort on stop, and skip unchanged values.
- When to use: Dashboards and lists that tolerate a few seconds of delay.
- When not to use: Sub-second updates; use a push transport.
- See also: `Receive WebSocket messages with reconnect and polling backup`

```ts
import { pollingSource } from "@zedtech/zedkit-live";

const jobs = pollingSource({
  intervalMs: 5000,
  poll: (signal) => fetch("/api/jobs", { signal }).then((r) => r.json()),
  isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
});
```

## Receive WebSocket messages with reconnect and polling backup

- Import: `@zedtech/zedkit-live` — `wsSource`, `WsSourceOptions`, `WsReconnectOptions`
- Wraps: `(none)`
- Status: alpha
- Short name: wsSource
- Audience: Apps that want push updates and still work when the socket drops.
- Purpose: Open a WebSocket on demand, reconnect with jittered exponential backoff, resolve the URL per attempt, and run a fallback source while it is down.
- When to use: Live lists and status pages behind a WebSocket endpoint.
- When not to use: Guaranteed delivery; missed messages are not replayed, so make the fallback fetch current state.
- See also: `Poll an endpoint as a live source`

```ts
import { pollingSource, wsSource } from "@zedtech/zedkit-live";

const events = wsSource<{ type: string }>({
  url: async () => `wss://example.com/live?token=${await getToken()}`,
  fallback: pollingSource({ intervalMs: 10_000, poll: () => fetchLatest() }),
});
const stop = events.subscribe((event) => refresh(event));
```
