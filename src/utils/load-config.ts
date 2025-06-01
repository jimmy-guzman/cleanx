import { loadConfig as unconfigLoadConfig } from "unconfig";

import type { CleanxOptions } from "../options";

interface LoadConfigOptions {
  configPath?: string;
  cwd: string;
}

export async function loadConfig({ configPath, cwd }: LoadConfigOptions) {
  const { config } = await unconfigLoadConfig<CleanxOptions>({
    cwd,
    sources: [
      {
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs"],
        files: configPath ?? "cleanx.config",
      },
    ],
  });

  return config;
}
