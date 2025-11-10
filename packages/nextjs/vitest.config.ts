import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~~": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: path.resolve(__dirname, "vitest.setup.ts"),
    css: false,
    coverage: {
      provider: "v8",
      include: ["hooks/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.ts"],
    },
  },
});

