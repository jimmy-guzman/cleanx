import { defineConfig } from "tsdown";

export default defineConfig({
  inlineOnly: [],
  minify: true,
  noExternal: () => true,
  platform: "node",
  publint: true,
  unused: true,
});
