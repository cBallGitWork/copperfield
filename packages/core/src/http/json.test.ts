import { describe, expect, it } from "vitest";
import { ProviderError, notJson } from "./errors";
import { htmlPage } from "./fakeFetch";
import { readJson } from "./json";

const bootstrap = notJson("FPL", "/bootstrap-static/");

describe("readJson", () => {
  it("parses a JSON body", async () => {
    expect(await readJson(new Response('{"a":1}'), bootstrap)).toEqual({ a: 1 });
  });

  it("rejects a 200 web page as NOT_JSON, not as a SyntaxError", async () => {
    const error = await readJson(htmlPage(), bootstrap).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({
      code: "NOT_JSON",
      message: expect.stringContaining("FPL /bootstrap-static/ → 200"),
    });
  });

  it("says what came instead: the content type and the start of the body", async () => {
    const error = await readJson(htmlPage(), bootstrap).catch((e: unknown) => e);
    expect((error as Error).message).toContain("text/html");
    expect((error as Error).message).toContain("<!doctype html>");
  });

  it("quotes no more than 120 characters of a long body", async () => {
    const long = new Response(`<html>${"x".repeat(5000)}</html>`, { status: 200 });
    const error = (await readJson(long, bootstrap).catch((e: unknown) => e)) as Error;
    expect(error.message).toContain("x".repeat(100));
    expect(error.message).not.toContain("x".repeat(121));
  });

  it("treats an empty 200 as NOT_JSON", async () => {
    const error = await readJson(new Response(""), bootstrap).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "NOT_JSON" });
  });

  // 16 Oct 2026: 24 raw `TimeoutError` lines in 17.5 h, the deadline firing while the body streamed in.
  it("names a body that times out mid-read as an unreachable ProviderError, not a raw TimeoutError", async () => {
    const timeout = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    const error = await readJson(stalled(timeout), bootstrap).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "TIMEOUT", kind: "unreachable", message: "fpl.example /api/bootstrap-static/ → TIMEOUT" });
  });

  it("names a connection dropped mid-body the same way", async () => {
    const dropped = new TypeError("terminated", { cause: Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" }) });
    const error = await readJson(stalled(dropped), bootstrap).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "UND_ERR_SOCKET", kind: "unreachable" });
  });

  it("leaves a failure of our own as it was", async () => {
    const ours = new RangeError("ours");
    expect(await readJson(stalled(ours), bootstrap).catch((e: unknown) => e)).toBe(ours);
  });
});

/** A 200 whose body fails partway, as undici's does when the deadline fires or the socket closes. */
function stalled(reason: unknown): Response {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"a":'));
      controller.error(reason);
    },
  });
  const res = new Response(body, { status: 200 });
  Object.defineProperty(res, "url", { value: "https://fpl.example/api/bootstrap-static/" });
  return res;
}
