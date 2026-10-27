import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" throws outside a React Server Components build; tests
      // import server modules directly, so stub it out.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
      SESSION_SECRET: "test-session-secret-that-is-at-least-32-chars",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
});
