import type { KnipConfig } from "knip";

export default {
  ignore: ["cleanx.config.ts"],
  ignoreDependencies: [
    "gitzy",
    "@commitlint/config-conventional",
    "commitlint",
  ],
} satisfies KnipConfig;
