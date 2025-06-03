import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["./src/{index,cli}.ts"],
  format: ["esm"],
  minify: true,
  platform: "node",
  publint: true,
});
