import { relative } from "node:path";

import { glob } from "tinyglobby";

import type { CleanxOptions } from "../options";

import { dedupe } from "./dedupe";
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

  const workspaceEntries = await Promise.all(
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

  const flatEntries = workspaceEntries.flat();

  const workspaceDirs = dedupe(
    flatEntries
      .map((entry) => {
        return relative(cwd, entry.dir);
      })
      .filter((dir) => {
        return dir !== "" && !dir.startsWith("..");
      }),
  );

  const rootConfigWithExcludes = mergeConfigs({
    cli: cliConfig,
    profile: profileConfig,
    root: {
      ...rootConfig,
      exclude: [...(rootConfig.exclude ?? []), ...workspaceDirs],
    },
    workspace: {},
  });

  return [{ config: rootConfigWithExcludes, dir: cwd }, ...flatEntries];
}
