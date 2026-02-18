import { defineConfig } from "tsdown";

export default defineConfig({
  inlineOnly: [
    "graphmatch",
    "zeptomatch",
    "grammex",
    "fdir",
    "balanced-match",
    "brace-expansion",
    "ignore",
    "ms",
    "picomatch",
    "pathe",
    "escalade",
    "picomatch",
    "js-yaml",
    "jju",
    "@manypkg/tools",
    "@manypkg/get-packages",
    "@manypkg/find-root",
    "tinyglobby",
  ],
  minify: true,
  noExternal: () => true,
  platform: "node",
  publint: true,
  unused: true,
});
