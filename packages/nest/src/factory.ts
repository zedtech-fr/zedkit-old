// Original work by the same author. Design notes:
// - `envFilePath` option (default `[".env"]`) instead of a hardcoded
//   monorepo-relative lookup.
// - `trustProxy` passthrough so the documented proxy guidance works.
import "reflect-metadata";
import {
  Module,
  ValidationPipe,
  type INestApplication,
  type Type,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import {
  ThrottlerGuard,
  ThrottlerModule,
  type ThrottlerStorage,
} from "@nestjs/throttler";
import { tryCatch } from "@zedtech/zedkit-core";
import type { FastifyBodyParser, FastifyServerOptions } from "fastify";
import { Logger as PinoLogger, LoggerModule } from "nestjs-pino";
import type {
  DestinationStream,
  LevelWithSilent,
  LoggerOptions as PinoLoggerOptions,
} from "pino";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Http2ServerRequest } from "node:http2";
import { Writable } from "node:stream";
import { AllExceptionsFilter } from "./all-exceptions.filter.js";
import { REQUEST_ID_HEADER } from "./request-id.js";
import { RequestIdInterceptor } from "./request-id.interceptor.js";
import { validateEnv } from "./validate-env.js";

/** Whatever `app.enableCors()` accepts (`true` allows any origin). */
type CorsSetting = Parameters<INestApplication["enableCors"]>[0];

export interface ThrottleOptions {
  ttlMs: number;
  limit: number;
  /**
   * Custom hit counter (e.g. shared across replicas). Defaults to the
   * in-memory store: correct for a single process only.
   */
  storage?: ThrottlerStorage | undefined;
}

export interface DocsOptions {
  title: string;
  version: string;
  description?: string | undefined;
  /** Serve path for the UI and `<path>-json`. Defaults to `docs`. */
  path?: string | undefined;
  /**
   * Extra absolute paths serving the same JSON document (stable
   * contract URLs beyond the swagger-default `<path>-json`). Served
   * raw (no guards), like the default JSON route.
   */
  aliases?: string[] | undefined;
}

/**
 * Request-logging options. The logger is process-wide: when several apps
 * boot in one process (tests), the first app's logger options win.
 */
export interface LoggerOptions {
  level?: string | undefined;
  /**
   * pino redact paths. Defaults to the Authorization header and cookies:
   * request logs must never carry credentials.
   */
  redact?: string[] | undefined;
  /** Log destination (pino passthrough). Defaults to stdout. */
  stream?: DestinationStream | undefined;
  /**
   * pino serializers. Defaults to pino's own (req/res include headers).
   * Pass `compactRequestSerializers()` to keep only id, method, url, status.
   */
  serializers?: PinoLoggerOptions["serializers"] | undefined;
  /**
   * pino-http level picker. Defaults to pino-http's own mapping.
   * Pass `createRequestLogLevel({ quietPaths })` to hush success on chosen paths.
   */
  customLogLevel?:
    | ((req: IncomingMessage, res: ServerResponse, error?: Error) => LevelWithSilent)
    | undefined;
  /**
   * Called with each parsed log object before the line is written.
   * The package stays dependency-free of any scrubber: the caller passes
   * the transform (e.g. a redaction function). Unparseable lines and
   * transform failures are replaced by a marker, never emitted raw.
   * Defaults to off: lines go to stdout or `stream` unchanged.
   */
  transformLine?: ((obj: unknown) => unknown) | undefined;
}

export interface ValidationOptions {
  /** Strip properties with no decorators. Defaults to true. */
  whitelist?: boolean | undefined;
  /** Reject (400) unknown properties instead of stripping. Defaults to true. */
  forbidNonWhitelisted?: boolean | undefined;
}

export interface NestBootstrapOptions {
  /** Root application module of the product app. */
  module: Type<object>;
  /**
   * class-validator decorated env schema. Validated at boot; boot fails
   * fast with a readable error when a declared variable is invalid.
   * Numbers need an explicit `@Type(() => Number)`: implicit conversion
   * relies on decorator metadata, which vitest/esbuild cannot emit.
   */
  envSchema?: Type<object> | undefined;
  /**
   * `.env` file lookup (ConfigModule passthrough). Defaults to `[".env"]`
   * (plus `process.env`, which always wins). Missing files are ignored.
   */
  envFilePath?: string[] | undefined;
  /**
   * Generated OpenAPI. Enabled by default except when
   * `NODE_ENV=production` (a public endpoint inventory is a gift to
   * attackers — opt back in explicitly if you serve docs in prod). Pass
   * `false` for apps without HTTP (workers).
   */
  docs?: DocsOptions | false | undefined;
  /**
   * Global IP-based coarse guard. Enabled by default at 100 req/min;
   * product apps add their own credential-scoped limits on top.
   */
  throttle?: ThrottleOptions | false | undefined;
  /** Populate `request.rawBody` with the exact bytes. Defaults to true. */
  rawBody?: boolean | undefined;
  /** Fastify body cap in bytes. Defaults to 1 MiB. */
  bodyLimit?: number | undefined;
  /**
   * Trust proxy headers (Fastify passthrough). Set this before running
   * behind a proxy or every client shares one throttle bucket.
   */
  trustProxy?: FastifyServerOptions["trustProxy"] | undefined;
  /**
   * `true` allows any origin; pass an object to restrict it. Note: a
   * plain string origin is echoed unconditionally — use an array or
   * function to actually restrict.
   */
  cors?: CorsSetting | undefined;
  logger?: LoggerOptions | undefined;
  /** Global ValidationPipe shape. Defaults to strict (strip + forbid). */
  validation?: ValidationOptions | undefined;
  /**
   * Global error filter. Defaults to AllExceptionsFilter; apps with
   * domain errors pass a subclass overriding `toStatusBody`.
   */
  exceptionFilter?: Type<object> | undefined;
  /**
   * Custom body parsers by content type, installed through the
   * adapter's standard `useBodyParser` (rawBody capture included)
   * before Nest registers its defaults — so a custom
   * `application/json` parser replaces the default instead of
   * conflicting with it. Receives the raw buffer; `done(null, value)`
   * sets `@Body()`, `done(error)` with `statusCode` rejects.
   */
  bodyParsers?: Record<string, FastifyBodyParser<Buffer>> | undefined;
}

const DEFAULT_THROTTLE: ThrottleOptions = { ttlMs: 60_000, limit: 100 };
const DEFAULT_LOG_REDACT = ["req.headers.authorization", "req.headers.cookie"];
const DEFAULT_BODY_LIMIT = 1024 * 1024;
const DEFAULT_DOCS: DocsOptions = {
  title: "API",
  version: "0.0.0",
  path: "docs",
};

function requestIdOf(req: IncomingMessage): string {
  const header = req.headers[REQUEST_ID_HEADER];
  // Node joins repeated HTTP/1 headers with ", "; HTTP/2 may deliver an
  // array. Either way the first value wins.
  const first = Array.isArray(header)
    ? header[0]?.trim()
    : header?.split(",")[0]?.trim();
  if (first) return first;
  return randomUUID();
}

/**
 * Fastify assigns `request.id` (via its own `genReqId`) before pino-http
 * runs, so pino reuses it: logs, error bodies, and the wire id are one
 * value. Generating a second UUID here would split them apart.
 */
function pinoReqId(req: IncomingMessage): string {
  const existing = (req as { id?: unknown }).id;
  if (typeof existing === "string" && existing.length > 0) return existing;
  return requestIdOf(req);
}

const DROPPED_LINE = '{"level":60,"msg":"[unparseable log line dropped]"}';

function applyTransform(line: string, transformLine: (obj: unknown) => unknown): string {
  const parsed = tryCatch(() => JSON.parse(line) as unknown);
  if (!parsed.ok) return DROPPED_LINE;
  const encoded = tryCatch(() => JSON.stringify(transformLine(parsed.value)));
  if (!encoded.ok || typeof encoded.value !== "string") return DROPPED_LINE;
  return encoded.value;
}

function transformSink(
  transformLine: (obj: unknown) => unknown,
  dest: DestinationStream,
): Writable {
  let tail = "";
  return new Writable({
    write(chunk, _encoding, done): void {
      tail += chunk.toString();
      const parts = tail.split("\n");
      tail = parts.pop() ?? "";
      for (const part of parts) {
        if (part.length === 0) continue;
        dest.write(`${applyTransform(part, transformLine)}\n`);
      }
      done();
    },
  });
}

function pinoHttpBindings(logger: LoggerOptions | undefined) {
  return {
    level: logger?.level ?? "info",
    genReqId: (req: IncomingMessage) => pinoReqId(req),
    redact: logger?.redact ?? DEFAULT_LOG_REDACT,
    ...(logger?.serializers === undefined ? {} : { serializers: logger.serializers }),
    ...(logger?.customLogLevel === undefined
      ? {}
      : { customLogLevel: logger.customLogLevel }),
  };
}

function pinoHttpDestination(logger: LoggerOptions | undefined): DestinationStream | undefined {
  if (logger?.transformLine !== undefined) {
    return transformSink(logger.transformLine, logger.stream ?? process.stdout);
  }
  return logger?.stream;
}

/**
 * Generic Nest bootstrap shared by every app. Wires only standard pieces:
 * Fastify platform, validated env (`@nestjs/config`), request-id JSON logs
 * (`nestjs-pino`), strict global `ValidationPipe`, a global error-shape
 * filter, an optional global throttler, generated OpenAPI, and graceful
 * shutdown hooks. Returns the app ready to `listen()`; tests use it with
 * supertest without ever touching product code.
 */
export async function createNestApp(
  options: NestBootstrapOptions,
): Promise<NestFastifyApplication> {
  const throttle = options.throttle === undefined ? DEFAULT_THROTTLE : options.throttle;
  const schema = options.envSchema;
  const loggerBindings = pinoHttpBindings(options.logger);
  const loggerDest = pinoHttpDestination(options.logger);

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        envFilePath: options.envFilePath ?? [".env"],
        ...(schema
          ? { validate: (config: Record<string, unknown>) => validateEnv(schema, config) }
          : {}),
      }),
      LoggerModule.forRoot({
        // nestjs-pino takes the destination as a tuple, not an option key.
        pinoHttp:
          loggerDest === undefined ? loggerBindings : [loggerBindings, loggerDest],
      }),
      ...(throttle
        ? [
            ThrottlerModule.forRoot(
              throttle.storage
                ? {
                    storage: throttle.storage,
                    throttlers: [{ ttl: throttle.ttlMs, limit: throttle.limit }],
                  }
                : [{ ttl: throttle.ttlMs, limit: throttle.limit }],
            ),
          ]
        : []),
      options.module,
    ],
    providers: [
      {
        provide: APP_PIPE,
        useValue: new ValidationPipe({
          whitelist: options.validation?.whitelist ?? true,
          forbidNonWhitelisted: options.validation?.forbidNonWhitelisted ?? true,
          transform: true,
        }),
      },
      { provide: APP_FILTER, useClass: options.exceptionFilter ?? AllExceptionsFilter },
      { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
      ...(throttle ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
    ],
  })
  class BootstrapRootModule {}

  const bodyLimit = options.bodyLimit ?? DEFAULT_BODY_LIMIT;
  const adapter = new FastifyAdapter({
    bodyLimit,
    genReqId: (req: IncomingMessage | Http2ServerRequest) =>
      requestIdOf(req as IncomingMessage),
    // exactOptionalPropertyTypes: only pass the key when set.
    ...(options.trustProxy === undefined ? {} : { trustProxy: options.trustProxy }),
  });
  for (const [contentType, parser] of Object.entries(options.bodyParsers ?? {})) {
    adapter.useBodyParser(contentType, options.rawBody ?? true, { bodyLimit }, parser);
  }
  const app = await NestFactory.create<NestFastifyApplication>(
    BootstrapRootModule,
    adapter,
    {
      rawBody: options.rawBody ?? true,
      bufferLogs: true,
      // Surface boot errors (e.g. invalid env) as rejections instead of
      // `process.abort()`: callers and tests can handle them, and an
      // unhandled rejection still crashes with the error printed.
      abortOnError: false,
    },
  );
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();
  if (options.cors) {
    app.enableCors(options.cors === true ? undefined : options.cors);
  }
  const docs =
    options.docs === undefined
      ? process.env.NODE_ENV === "production"
        ? false
        : DEFAULT_DOCS
      : options.docs;
  if (docs) {
    const builder = new DocumentBuilder()
      .setTitle(docs.title)
      .setVersion(docs.version);
    if (docs.description) {
      builder.setDescription(docs.description);
    }
    // Tolerate "docs/" or "/docs": the JSON route is derived by suffix.
    // Manual trim (no regex): the path is deployer-controlled input.
    const rawDocsPath = docs.path ?? "docs";
    let docsStart = 0;
    let docsEnd = rawDocsPath.length;
    while (docsStart < docsEnd && rawDocsPath[docsStart] === "/") docsStart += 1;
    while (docsEnd > docsStart && rawDocsPath[docsEnd - 1] === "/") docsEnd -= 1;
    const docsPath = rawDocsPath.slice(docsStart, docsEnd) || "docs";
    const document = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup(docsPath, app, document);
    const fastify = app.getHttpAdapter().getInstance();
    for (const alias of docs.aliases ?? []) {
      fastify.get(alias, (_req, reply) => reply.send(document));
    }
  }
  return app;
}
