import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

// `public/sw.js` run against a stand-in for the worker's globals, since vitest has no service worker.

const PUBLIC = new URL("../../../public/", import.meta.url);
const source = readFileSync(new URL("sw.js", PUBLIC), "utf8");
const OFFLINE_HTML = readFileSync(new URL("offline.html", PUBLIC), "utf8");

type Listener = (event: Record<string, unknown>) => void;

function worker({ network }: { network: (request: Request) => Promise<Response> }) {
  const listeners = new Map<string, Listener>();
  const stored = new Map<string, Response>();
  // An older version's cache is already on the phone.
  const names = new Set(["offline-0"]);
  const caches = {
    open: async (name: string) => {
      names.add(name);
      return { add: async (request: Request) => void stored.set(new URL(request.url).pathname, new Response(OFFLINE_HTML)) };
    },
    keys: async () => [...names],
    delete: vi.fn(async () => true),
    match: async (path: string) => stored.get(path)?.clone(),
  };
  const self = {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined },
    registration: { navigationPreload: { enable: vi.fn(async () => undefined) } },
  };
  const fetch = (input: Request | string) => network(typeof input === "string" ? new Request(new URL(input, "https://app.test")) : input);
  // A relative Request needs a base URL, which a worker has and node does not.
  const BaseRequest = class extends Request {
    constructor(input: string, init?: RequestInit) {
      super(new URL(input, "https://app.test"), init);
    }
  };
  new Function("self", "caches", "fetch", "Request", "Response", source)(self, caches, fetch, BaseRequest, Response);

  async function lifecycle(type: "install" | "activate") {
    let settled: Promise<unknown> = Promise.resolve();
    listeners.get(type)?.({ waitUntil: (work: Promise<unknown>) => void (settled = work) });
    await settled;
  }

  /** What the worker answers for a request, or "browser" when it leaves it to the browser. */
  async function answer(url: string, mode: RequestMode | "navigate", preloaded?: Response): Promise<string> {
    let answered: Promise<Response> | null = null;
    const request = { url, method: "GET", mode } as unknown as Request;
    listeners.get("fetch")?.({ request, preloadResponse: Promise.resolve(preloaded), respondWith: (r: Promise<Response>) => void (answered = r) });
    if (answered === null) return "browser";
    return (await answered as Response).text();
  }

  return { lifecycle, answer, self, caches };
}

const down = async (): Promise<Response> => {
  throw new TypeError("Failed to fetch");
};

describe("the offline worker", () => {
  it("answers a navigation the network cannot reach with the offline page", async () => {
    const sw = worker({ network: down });
    await sw.lifecycle("install");
    await sw.lifecycle("activate");
    expect(await sw.answer("https://app.test/prem/match/60", "navigate")).toBe(OFFLINE_HTML);
  });

  it("passes the browser's own preloaded answer through untouched", async () => {
    const sw = worker({ network: down });
    await sw.lifecycle("install");
    await sw.lifecycle("activate");
    expect(sw.self.registration.navigationPreload.enable).toHaveBeenCalled();
    expect(await sw.answer("https://app.test/league", "navigate", new Response("the page"))).toBe("the page");
  });

  it("leaves everything that is not a navigation to the browser", async () => {
    const sw = worker({ network: down });
    await sw.lifecycle("install");
    expect(await sw.answer("https://app.test/crests/t3.png", "no-cors")).toBe("browser");
    expect(await sw.answer("https://app.test/league?_rsc=1", "cors")).toBe("browser");
  });

  it("drops an older version's cache on activation", async () => {
    const sw = worker({ network: down });
    await sw.lifecycle("install");
    await sw.lifecycle("activate");
    expect(sw.caches.delete).toHaveBeenCalledWith("offline-0");
    expect(sw.caches.delete).toHaveBeenCalledTimes(1);
  });
});

describe("the offline page", () => {
  it("needs nothing from the network: no stylesheet, script, image or font of its own", () => {
    expect(OFFLINE_HTML).not.toMatch(/<link\b|<script\b|<img\b|url\(|@import/);
  });

  it("retries the page that failed", () => {
    expect(OFFLINE_HTML).toMatch(/<a href="">Retry<\/a>/);
  });
});
