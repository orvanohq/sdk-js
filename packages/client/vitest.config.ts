import { readFileSync } from "node:fs";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type ViteUserConfig } from "vitest/config";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

// Spec 0014 CNF-6: the servers api/conformance/compose.yaml starts. Override them to point somewhere else.
const servers = {
  stubUrl: process.env.ORVANO_STUB_URL ?? "http://localhost:18081",
  liveUrl: process.env.ORVANO_LIVE_URL ?? "http://localhost:18080",
  partial: process.env.ORVANO_CONFORMANCE_PARTIAL === "1",
};
const conformance = ["conformance/conformance.test.ts"];
const globalSetup = ["conformance/bootstrap.ts"];
// Spec 0014 CNF-7: the exact origin the server allows for browser mode (spec 0007 COR-2 has no wildcards).
const browserPort = 63315;

// Spec 0005 SQA-1 to SQA-4: unit tests in Node; the conformance suite in Node, the Hermes profile, and Chromium.
const config: ViteUserConfig = defineConfig({
  define: { __ORVANO_SDK_VERSION__: JSON.stringify(version) },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["test/**/*.test.ts"], environment: "node" },
      },
      {
        extends: true,
        test: {
          name: "conformance-node",
          include: conformance,
          globalSetup,
          provide: { conformance: { ...servers, runtime: "node" } },
        },
      },
      {
        extends: true,
        test: {
          name: "conformance-hermes",
          include: conformance,
          setupFiles: ["conformance/hermes.setup.ts"],
          globalSetup,
          provide: { conformance: { ...servers, runtime: "hermes" } },
        },
      },
      {
        extends: true,
        test: {
          name: "conformance-browser",
          include: conformance,
          globalSetup,
          api: { port: browserPort, strictPort: true },
          provide: { conformance: { ...servers, runtime: "chromium" } },
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});

export default config;
