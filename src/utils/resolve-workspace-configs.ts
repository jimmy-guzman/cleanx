import { glob } from "tinyglobby";

import type { CleanxOptions } from "../options";

import { mergeConfigs } from "./merge-configs";

interface ResolveWorkspaceConfigsOptions {
  cliConfig: Partial<CleanxOptions>;
  cwd: string;
  profileConfig: Partial<CleanxOptions>;
  rootConfig: CleanxOptions;
}

export async function resolveWorkspaceConfigs({
  cliConfig,
  cwd,
  profileConfig,
  rootConfig,
}: ResolveWorkspaceConfigsOptions) {
  const workspaces = rootConfig.workspaces ?? {};

  const entries = await Promise.all(
    Object.entries(workspaces).map(async ([pattern, override]) => {
      const dirs = await glob(pattern, {
        absolute: true,
        cwd,
        onlyDirectories: true,
      });

      return dirs.map((dir) => {
        return {
          config: mergeConfigs({
            cli: cliConfig,
            profile: profileConfig,
            root: rootConfig,
            workspace: override,
          }),
          dir,
        };
      });
    }),
  );

  return [
    {
      config: mergeConfigs({
        cli: cliConfig,
        profile: profileConfig,
        root: rootConfig,
        workspace: {},
      }),
      dir: cwd,
    },
    ...entries.flat(),
  ];
}
