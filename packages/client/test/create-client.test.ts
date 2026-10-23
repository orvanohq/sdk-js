// Spec 0005 SHP-1, SHP-2, NPM-6, RN-1, RN-2: createClient and the request every service sends. The shared runtime
// (transport, retry, errors) has its full SQA-7 suite in orvano's generator tests, on the same template code.
import { describe, expect, it } from "vitest";
import {
  apiVersion,
  createClient,
  Health,
  OrvanoError,
  sdkVersion,
  type SessionStorage,
} from "../src/index.js";
import { createClient as createNativeClient } from "../src/index.native.js";

function recorder(response: () => Response): {
  fetch: (request: Request) => Promise<Response>;
  requests: Request[];
} {
  const requests: Request[] = [];
  return {
    requests,
    fetch: (request) => {
      requests.push(request);
      return Promise.resolve(response());
    },
  };
}

const ok = (): Response =>
  new Response(JSON.stringify({ status: "ok", apiVersions: [apiVersion] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("createClient", () => {
  it("0014 AC-18: health sends the version, the client identity, and the key", async () => {
    const http = recorder(ok);
    const client = createClient({
      url: "https://orvano.example.com",
      key: "pk_test",
      fetch: http.fetch,
    });
    await expect(new Health(client).get()).resolves.toEqual({
      status: "ok",
      apiVersions: [apiVersion],
    });
    const [sent] = http.requests;
    expect(sent?.url).toBe("https://orvano.example.com/v1/health");
    expect(sent?.headers.get("Orvano-Api-Version")).toBe(apiVersion);
    expect(sent?.headers.get("Orvano-Client")).toBe(`client/${sdkVersion}`);
    expect(sent?.headers.get("Orvano-Key")).toBe("pk_test");
  });

  it("refuses a missing key, a bad url, and a bad storage adapter at once", () => {
    // @ts-expect-error the key is required
    expect(() => createClient({ url: "https://orvano.example.com" })).toThrow(TypeError);
    expect(() => createClient({ url: "http://orvano.example.com", key: "k" })).toThrow(TypeError);
    const partial = { getItem: () => Promise.resolve(null) } as unknown as SessionStorage;
    expect(() => createClient({ url: "https://a.example", key: "k", storage: partial })).toThrow(
      TypeError,
    );
  });

  it("never shows the key on the client handle (KEY-3)", () => {
    const client = createClient({ url: "https://orvano.example.com", key: "pk_secret_value" });
    expect(JSON.stringify(client)).not.toContain("pk_secret_value");
  });

  it("reports failures as OrvanoError", async () => {
    const http = recorder(() => new Response("", { status: 503 }));
    const client = createClient({
      url: "https://a.example",
      key: "k",
      fetch: http.fetch,
      retry: { maxRetries: 0 },
    });
    const error: unknown = await new Health(client).get().catch((thrown: unknown) => thrown);
    expect(OrvanoError.is(error) && error.kind).toBe("server");
  });
});

describe("the React Native entry (RN-1, RN-2)", () => {
  const storage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };

  it("needs storage", () => {
    // @ts-expect-error storage is required on React Native
    expect(() => createNativeClient({ url: "https://a.example", key: "k" })).toThrow(
      /needs storage/,
    );
    expect(createNativeClient({ url: "https://a.example", key: "k", storage }).url).toBe(
      "https://a.example",
    );
  });
});
