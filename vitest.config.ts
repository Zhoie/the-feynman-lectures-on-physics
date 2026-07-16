import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    maxWorkers: 4,
    testTimeout: 15_000,
    include: [
      "core/**/*.spec.ts",
      "labs/**/*.spec.ts",
      "features/labs/**/*.spec.ts",
      "features/lectures/**/*.spec.ts",
    ],
  },
});
