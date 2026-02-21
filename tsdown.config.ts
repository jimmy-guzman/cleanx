import { defineConfig } from "tsdown";

export default defineConfig({
  inlineOnly: ["fdir", "balanced-match", "brace-expansion", "ignore", "pathe"],
  minify: true,
  noExternal: () => true,
  platform: "node",
  publint: true,
  unused: true,
});
