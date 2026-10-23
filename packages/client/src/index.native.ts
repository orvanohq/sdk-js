// Spec 0005 RN-1: the React Native entry has the same API, except that createClient requires a storage adapter,
// in the types as well as at run time (RN-2), so a session never lands in plain storage by accident.
import {
  createClient as createWebClient,
  type ClientOptions as WebClientOptions,
  type SessionStorage,
} from "./create-client.js";
import type { OrvanoClient } from "./runtime/client.js";

export * from "./generated/index.js";
export type { SessionStorage } from "./create-client.js";
export { sdkVersion } from "./version.js";

/**
 * Options for `createClient` on React Native: `storage` is required.
 * @public
 */
export interface ClientOptions extends WebClientOptions {
  readonly storage: SessionStorage;
}

/**
 * Opens a client for one Orvano project. On React Native it needs `storage`, such as an `expo-secure-store` adapter.
 * @public
 */
export function createClient(options: ClientOptions): OrvanoClient {
  if (
    typeof options === "object" &&
    (options as unknown) !== null &&
    (options.storage as unknown) === undefined
  ) {
    throw new TypeError(
      "On React Native, createClient needs storage (an async getItem, setItem, and removeItem).",
    );
  }
  return createWebClient(options);
}
