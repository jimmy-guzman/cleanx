import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["./src/{index,cli}.ts"],
  format: ["esm"],
  platform: "node",
  publint: true,
});
