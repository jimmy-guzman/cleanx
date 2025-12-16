import { defineConfig } from "tsdown";

export default defineConfig({
  minify: true,
  noExternal: [
    "brace-expansion",
    "fdir",
    "tinyglobby",
    "@manypkg/get-packages",
    "zeptomatch",
    "ignore",
    "ms",
    "escalade",
  ],
  publint: true,
});
