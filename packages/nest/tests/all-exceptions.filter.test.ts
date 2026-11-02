import "reflect-metadata";
import { HttpException, Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AllExceptionsFilter, type ErrorBody } from "../src/index.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function catchWith(exception: unknown, id: unknown = "req-1"): { status: number; body: ErrorBody; header: string | undefined } {
  vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  const filter = new AllExceptionsFilter();
  let status = 0;
  let header: string | undefined;
  let body: ErrorBody | undefined;
  const reply = {
    sent: false,
    header(_name: string, value: string) {
      header = value;
    },
    status(code: number) {
      status = code;
      return {
        send(next: ErrorBody) {
          body = next;
        },
      };
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ id, method: "GET", url: "/" }),
      getResponse: () => reply,
    }),
  };
  filter.catch(exception, host as never);
  return { status, body: body as ErrorBody, header };
}

describe("AllExceptionsFilter", () => {
  it("maps Fastify body-parser codes to structured 4xx bodies", () => {
    expect(catchWith({ code: "FST_ERR_CTP_BODY_TOO_LARGE" })).toEqual({
      status: 413,
      header: "req-1",
      body: { code: "payload_too_large", message: "body exceeds the configured limit", requestId: "req-1" },
    });
    expect(catchWith({ code: "FST_ERR_CTP_INVALID_MEDIA_TYPE" })).toEqual({
      status: 415,
      header: "req-1",
      body: { code: "unsupported_media_type", message: "unsupported media type", requestId: "req-1" },
    });
    expect(catchWith({ code: "FST_ERR_CTP_EMPTY_JSON_BODY" })).toEqual({
      status: 400,
      header: "req-1",
      body: { code: "invalid_input", message: "invalid request body", requestId: "req-1" },
    });
  });

  it("keeps unknown Fastify codes and non-objects as an internal 500", () => {
    expect(catchWith({ code: "FST_ERR_NOT_FOUND" }).body).toEqual({
      code: "internal",
      message: "internal error",
      requestId: "req-1",
    });
    expect(catchWith("boom").status).toBe(500);
    expect(catchWith(null).status).toBe(500);
  });

  it("maps HttpException 4xx messages and 5xx public text", () => {
    expect(catchWith(new HttpException("nope", 401))).toMatchObject({
      status: 401,
      body: { code: "unauthorized", message: "nope", requestId: "req-1" },
    });
    expect(catchWith(new HttpException({ message: ["a", "b"] }, 400)).body).toMatchObject({
      code: "invalid_input",
      message: "a; b",
    });
    expect(catchWith(new HttpException({ message: 1 }, 409)).body).toMatchObject({
      code: "conflict",
      message: "Http Exception",
    });
    expect(catchWith(new HttpException("hidden", 503))).toMatchObject({
      status: 503,
      body: { code: "unavailable", message: "service unavailable", requestId: "req-1" },
    });
    expect(catchWith(new HttpException("hidden", 502))).toMatchObject({
      status: 502,
      body: { code: "http_502", message: "internal error", requestId: "req-1" },
    });
  });

  it("names the request unknown when the id is not a string", () => {
    expect(catchWith(new Error("x"), 12).body.requestId).toBe("unknown");
  });

  it("echoes string-response 400/413/415 driver text by default", () => {
    expect(catchWith(new HttpException("Unexpected token o", 400)).body.message).toBe(
      "Unexpected token o",
    );
    expect(catchWith(new HttpException("Payload Too Large", 413)).body.message).toBe(
      "Payload Too Large",
    );
    expect(catchWith(new HttpException("Unsupported Media Type", 415)).body.message).toBe(
      "Unsupported Media Type",
    );
  });

  it("maps string-response 400/413/415 to the uniform parser body when opted in", () => {
    class SanitizingFilter extends AllExceptionsFilter {
      protected override sanitizeStringHttpExceptions = true;
    }
    const caught = (exception: unknown) => {
      vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
      const filter = new SanitizingFilter();
      let status = 0;
      let body: ErrorBody | undefined;
      const reply = {
        sent: false,
        header(): void {
          return undefined;
        },
        status(code: number) {
          status = code;
          return {
            send(next: ErrorBody) {
              body = next;
            },
          };
        },
      };
      filter.catch(
        exception,
        {
          switchToHttp: () => ({
            getRequest: () => ({ id: "req-1", method: "GET", url: "/" }),
            getResponse: () => reply,
          }),
        } as never,
      );
      return { status, body };
    };
    expect(caught(new HttpException("Unexpected token o", 400))).toEqual({
      status: 400,
      body: { code: "invalid_input", message: "invalid request body", requestId: "req-1" },
    });
    expect(caught(new HttpException("Payload Too Large", 413))).toEqual({
      status: 413,
      body: {
        code: "payload_too_large",
        message: "body exceeds the configured limit",
        requestId: "req-1",
      },
    });
    expect(caught(new HttpException("Unsupported Media Type", 415))).toEqual({
      status: 400,
      body: { code: "invalid_input", message: "invalid request body", requestId: "req-1" },
    });
  });

  it("lets a subclass replace the parser-failure body and the final shape", () => {
    class AppFilter extends AllExceptionsFilter {
      protected override sanitizeStringHttpExceptions = true;
      protected override unknownBodyParseError() {
        return { status: 422, code: "unprocessable", message: "request body must be valid JSON" };
      }
      protected override formatBody(body: ErrorBody) {
        return { code: body.code, message: body.message };
      }
    }
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const filter = new AppFilter();
    let sent: unknown;
    filter.catch(new HttpException("Unexpected token o", 400), {
      switchToHttp: () => ({
        getRequest: () => ({ id: "req-1", method: "POST", url: "/" }),
        getResponse: () => ({
          sent: false,
          header(): void {
            return undefined;
          },
          status: () => ({
            send(next: unknown) {
              sent = next;
            },
          }),
        }),
      }),
    } as never);
    expect(sent).toEqual({ code: "unprocessable", message: "request body must be valid JSON" });
  });

  it("lets a subclass map domain errors before falling through", () => {
    class AppFilter extends AllExceptionsFilter {
      protected override toStatusBody(exception: unknown) {
        if (exception instanceof Error && exception.message === "gone") {
          return { status: 404, code: "not_found", message: "missing" };
        }
        return super.toStatusBody(exception);
      }
    }
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const filter = new AppFilter();
    let status = 0;
    let body: ErrorBody | undefined;
    filter.catch(new Error("gone"), {
      switchToHttp: () => ({
        getRequest: () => ({ id: "req-1", method: "GET", url: "/" }),
        getResponse: () => ({
          sent: false,
          header(): void {
            return undefined;
          },
          status(code: number) {
            status = code;
            return {
              send(next: ErrorBody) {
                body = next;
              },
            };
          },
        }),
      }),
    } as never);
    expect(status).toBe(404);
    expect(body).toEqual({ code: "not_found", message: "missing", requestId: "req-1" });
  });
});
