import { OrvanoHeaders } from "./generated/contract.js";
import type { OrvanoClient } from "./runtime/client.js";
import { createClientHandle, type CommonClientOptions } from "./runtime/options.js";
import { sdkVersion } from "./version.js";

/**
 * Where the client keeps its session between app launches. All three calls are async (spec 0005 RN-2).
 * @public
 */
export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Options for `createClient` (spec 0005 SHP-1).
 * @public
 */
export interface ClientOptions extends CommonClientOptions {
  /** The project's publishable key, sent as `Orvano-Key` on every request (spec 0014 HDR-1). */
  readonly key: string;
  /** Where the session is kept. Required on React Native; in a browser it is optional. */
  readonly storage?: SessionStorage | undefined;
}

/**
 * Opens a client for one Orvano project. It does no I/O; pass it to each service's constructor.
 * Throws `TypeError` at once for a bad option.
 * @public
 */
export function createClient(options: ClientOptions): OrvanoClient {
  checkKey(options);
  checkStorage(options.storage);
  return createClientHandle(options, `client/${sdkVersion}`, {
    [OrvanoHeaders.orvanoKey]: options.key,
  });
}

function checkKey(options: ClientOptions): void {
  if (typeof options !== "object" || (options as unknown) === null) {
    throw new TypeError("createClient needs an options object.");
  }
  if (typeof options.key !== "string" || options.key === "") {
    throw new TypeError("key must be the project's publishable key.");
  }
}

function checkStorage(storage: unknown): void {
  if (storage === undefined) return;
  const methods = ["getItem", "setItem", "removeItem"] as const;
  if (
    typeof storage !== "object" ||
    storage === null ||
    !methods.every((name) => typeof (storage as Record<string, unknown>)[name] === "function")
  ) {
    throw new TypeError("storage must have async getItem, setItem, and removeItem.");
  }
}
