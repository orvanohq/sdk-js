# Orvano JavaScript SDK

An Orvano SDK for JavaScript and TypeScript. Orvano is an open source, self hostable backend as a service; see
[orvanohq/orvano](https://github.com/orvanohq/orvano).

## Install

```bash
pnpm add @orvano/client
```

## Use

```ts
import { createClient, Health, OrvanoError } from "@orvano/client";

const client = createClient({
  url: "https://orvano.example.com",
  project: "<project id>",
  key: "<publishable key>",
});
const health = await new Health(client).get(); // { status: "ok", apiVersions: [...] }
```

On React Native, `createClient` also needs `storage`: an object with async `getItem`, `setItem`, and `removeItem`.

## Develop

You need Node 24 (`.node-version`), pnpm, and Docker (or Podman) for the conformance suite.

- `pnpm check`, `pnpm build`, `pnpm test`, and `pnpm size` are the checks CI runs.
- `pnpm regenerate` rewrites `packages/client/src/generated/`, `src/runtime/`, and the two `conformance/*.generated.*` files from the orvano commit pinned in `orvano-contract.json` (spec 0014 RGN-1, RGN-2). It fetches that commit into `.orvano/`. Never edit those files by hand: CI regenerates them and fails on any difference. `pnpm regenerate --pin <sha>` moves the pin.
- `pnpm conformance` runs every client scenario in Node, the Hermes profile, and Chromium (spec 0014 CNF-5). Start the servers first, from the pinned checkout:

  ```bash
  docker build --file .orvano/deploy/Dockerfile --tag orvano:pinned .orvano
  ORVANO_IMAGE=orvano ORVANO_IMAGE_TAG=pinned docker compose --file .orvano/api/conformance/compose.yaml up --detach --wait
  pnpm exec playwright install chromium
  pnpm conformance
  ```

  A scenario that requires a project gets one from `orvano admin bootstrap-project`, run through `docker compose exec` in that stack (spec 0017 SDK-4).

  A scenario that can't run here goes in `packages/client/conformance/skip.json` with a reason and an issue link; any other scenario that doesn't run fails the suite. Set `ORVANO_CONFORMANCE_PARTIAL=1` when you run a few with `-t`.

## License

Apache License 2.0 (see `LICENSE` and `NOTICE`). The name "Orvano" and its logo aren't covered by the license;
see [TRADEMARKS.md](https://github.com/orvanohq/orvano/blob/main/TRADEMARKS.md).
