// Original work by the same author.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { REQUEST_ID_HEADER } from "./request-id.js";

/**
 * Global error shape for every Nest app from this bootstrap:
 * `{ code, message, requestId }` with the matching HTTP status.
 * 4xx responses carry the safe client-facing message; 5xx responses never
 * leak internals (the full error goes to the logger only).
 */
export interface ErrorBody {
  code: string;
  message: string;
  requestId: string;
}

const STATUS_CODES: Record<number, string> = {
  400: "invalid_input",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  413: "payload_too_large",
  415: "unsupported_media_type",
  429: "rate_limited",
  500: "internal",
  503: "unavailable",
};

/** Safe public messages for mapped 5xx; everything else stays "internal error". */
const STATUS_5XX_MESSAGES: Record<number, string> = {
  503: "service unavailable",
};

function fastifyBodyErrorStatus(exception: unknown): number | null {
  if (typeof exception !== "object" || exception === null) return null;
  if (!("code" in exception) || typeof exception.code !== "string") return null;
  if (exception.code === "FST_ERR_CTP_BODY_TOO_LARGE") return 413;
  if (exception.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") return 415;
  if (exception.code.startsWith("FST_ERR_CTP_")) return 400;
  return null;
}

function httpMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "message" in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.map(String).join("; ");
  }
  return exception.message;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * When true, string-response HttpException 400/413/415 (Nest wrapping
   * a body-parser failure) map to the uniform parser-failure body instead
   * of echoing the driver text. Default false: today's public body.
   * Subclass and set true to opt in.
   */
  protected sanitizeStringHttpExceptions = false;

  /**
   * Shape for body-parser failures other than 413 (malformed JSON and
   * friends). Apps whose contract says otherwise override this one
   * method instead of reimplementing the filter.
   */
  protected unknownBodyParseError(): { status: number; code: string; message: string } {
    return { status: 400, code: "invalid_input", message: "invalid request body" };
  }

  /**
   * Maps any thrown value to status + body. Apps with domain errors
   * subclass the filter and override this: map first, else `super`.
   */
  protected toStatusBody(exception: unknown): {
    status: number;
    code: string;
    message: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (
        this.sanitizeStringHttpExceptions &&
        (status === 400 || status === 413 || status === 415) &&
        typeof exception.getResponse() === "string"
      ) {
        if (status === 413) {
          return {
            status: 413,
            code: "payload_too_large",
            message: "body exceeds the configured limit",
          };
        }
        return this.unknownBodyParseError();
      }
      const message =
        status >= 500
          ? (STATUS_5XX_MESSAGES[status] ?? "internal error")
          : httpMessage(exception);
      return { status, code: STATUS_CODES[status] ?? `http_${status}`, message };
    }
    const bodyStatus = fastifyBodyErrorStatus(exception);
    if (bodyStatus === 413) {
      return {
        status: 413,
        code: "payload_too_large",
        message: "body exceeds the configured limit",
      };
    }
    if (bodyStatus === 415) {
      return {
        status: 415,
        code: "unsupported_media_type",
        message: "unsupported media type",
      };
    }
    if (bodyStatus === 400) return this.unknownBodyParseError();
    return { status: 500, code: "internal", message: "internal error" };
  }

  /**
   * Final error body. Apps whose contract fixes the shape override
   * this (the id stays available as the `x-request-id` header, which
   * this filter always sets, so correlation never depends on the body).
   */
  protected formatBody(body: ErrorBody): unknown {
    return body;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    const requestId = typeof req.id === "string" ? req.id : "unknown";

    const { status, code, message } = this.toStatusBody(exception);
    if (status >= 500) {
      this.logger.error(
        `Unhandled error on ${req.method} ${req.url}: ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    // A streaming handler that throws after the first flush already sent
    // the reply: sending again would raise inside the filter itself.
    if (reply.sent) return;
    reply.header(REQUEST_ID_HEADER, requestId);
    reply.status(status).send(this.formatBody({ code, message, requestId }));
  }
}
