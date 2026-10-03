import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    fileParallelism: process.env.CRUFTLESS_SERIAL_VITEST !== "1",
  },
});

