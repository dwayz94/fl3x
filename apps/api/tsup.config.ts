import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  // Bundle the workspace package so Render only needs dist/ + node_modules.
  noExternal: ["@fl3x/shared"],
});
