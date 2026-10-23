// Spec 0005 SQA-4: the Hermes profile. It keeps the real fetch for the suite to pass in, then takes away what Hermes
// lacks or only partly has (RTM-2's banned set), so a use that slips past lint fails here.
// Node's own fetch and Vitest use some of these (URL, URLSearchParams, structuredClone, AbortSignal.any), so those are
// guarded rather than deleted: they throw only when this package's src/ calls them. `process`, `Buffer`, and `require`
// stay for Node itself; ESLint bans all of them in src/.
const realFetch = globalThis.fetch.bind(globalThis);
Object.defineProperty(globalThis, Symbol.for("orvano.conformance.fetch"), { value: realFetch });

const globals = globalThis as unknown as Record<string, unknown>;
for (const name of ["window", "document", "localStorage", "sessionStorage", "navigator"]) {
  Reflect.deleteProperty(globals, name);
}
const webCrypto = globals["crypto"] as Record<string, unknown> | undefined;
if (webCrypto !== undefined) Object.defineProperty(webCrypto, "subtle", { value: undefined });

/**
 * True when this package's src/ called the guarded API directly. Only the direct caller counts: Node's own fetch uses
 * URL and AbortSignal.any while SDK frames sit further down the stack. Frames: the Error line, this function, the
 * Proxy trap, then the caller.
 */
function calledFromSdk(): boolean {
  const caller = (new Error().stack ?? "").split("\n")[3] ?? "";
  return /[\\/]packages[\\/]client[\\/]src[\\/]/.test(caller);
}

function refuse(name: string): never {
  throw new ReferenceError(`${name} is not available on Hermes (spec 0005 RTM-2).`);
}

/** Replaces a function or constructor on its owner with one that refuses SDK callers. */
function guard(owner: Record<string, unknown>, key: string, label: string): void {
  const real = owner[key] as (new (...args: unknown[]) => object) &
    ((...args: unknown[]) => unknown);
  owner[key] = new Proxy(real, {
    apply(target, self, args) {
      return calledFromSdk() ? refuse(label) : Reflect.apply(target, self, args);
    },
    construct(target, args, newTarget) {
      return calledFromSdk()
        ? refuse(label)
        : (Reflect.construct(target, args, newTarget) as object);
    },
  });
}

for (const name of ["URL", "URLSearchParams", "structuredClone"]) guard(globals, name, name);
const signal = AbortSignal as unknown as Record<string, unknown>;
guard(signal, "timeout", "AbortSignal.timeout");
guard(signal, "any", "AbortSignal.any");
