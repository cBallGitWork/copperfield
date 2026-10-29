import { describe, expect, it } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, jsonBody, serve, statusOnly } from "../../http/fakeFetch";
import { fetchBootstrap, fetchRegions } from "./client";

describe("FPL client", () => {
  it("reads a web page in place of JSON as NOT_JSON", async () => {
    serve(htmlPage);
    await expect(fetchBootstrap()).rejects.toMatchObject({
      name: "ProviderError",
      code: "NOT_JSON",
      message: expect.stringContaining("FPL /bootstrap-static/"),
    });
  });

  it("throws a failing status with the message it has always had", async () => {
    serve(statusOnly(404));
    const error = await fetchBootstrap().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "404", message: "FPL /bootstrap-static/ → 404" });
  });

  it("refuses an array where an object belongs, and an object where an array belongs", async () => {
    serve(jsonBody([]));
    await expect(fetchBootstrap()).rejects.toMatchObject({ code: "WRONG_SHAPE", kind: "malformed", message: "FPL /bootstrap-static/ → an array, not an object" });
    serve(jsonBody({ regions: [] }));
    await expect(fetchRegions()).rejects.toMatchObject({ code: "WRONG_SHAPE", kind: "malformed", message: "FPL /regions/ → an object, not an array" });
  });

  it("reads the container each endpoint answers with", async () => {
    serve(jsonBody([{ id: 1, name: "England" }]));
    expect(await fetchRegions()).toEqual([{ id: 1, name: "England" }]);
  });
});
